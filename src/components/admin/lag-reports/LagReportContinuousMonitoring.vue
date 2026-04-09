<template>
  <v-expansion-panel value="continuous">
    <v-expansion-panel-title>
      <strong>Continuous Monitoring</strong>
      <span class="text-medium-emphasis text-caption ml-2">Data collected throughout the entire game</span>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <!-- Player toggles -->
      <div class="d-flex ga-4 mb-3 justify-end">
        <v-checkbox
          v-for="(player, pi) in report.players"
          :key="'toggle-' + pi"
          v-model="visiblePlayers[pi]"
          :label="playerName(player.battleTag)"
          :color="playerColors[pi]"
          density="compact"
          hide-details
        />
      </div>

      <!-- Ping Timeline + Packet Loss Combined Chart -->
      <v-card variant="flat" class="mb-3 pa-3" color="transparent">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-overline text-medium-emphasis">End-to-End Ping (client + server overlaid)</div>
          <div class="d-flex align-center ga-2">
            <span class="text-caption text-medium-emphasis font-italic">Server ping realigned via reconnect events; game pauses may cause slight skew</span>
            <span class="text-caption text-medium-emphasis">|</span>
            <span class="text-caption text-medium-emphasis font-italic">Shift+click to place markers, scroll to zoom, drag to pan</span>
            <v-btn size="x-small" variant="text" @click="resetPingChartZoom">Reset zoom</v-btn>
          </div>
        </div>
        <div
          v-if="pingChartData.datasets.length"
          style="cursor: crosshair;"
          @pointerdown="onChartPointerDown"
          @pointermove="onChartPointerMove"
          @pointerup="onChartPointerUp"
          @pointerleave="onChartPointerUp"
        >
          <bar-chart ref="pingChartRef" :chart-data="pingChartData" :chart-options="pingChartOptions" :chart-plugins="[zoomPlugin]" />
        </div>
        <div v-else class="text-medium-emphasis text-caption pa-4 text-center">No ping data available</div>
      </v-card>

      <!-- Summary Stats Table -->
      <v-card variant="flat" class="pa-3" color="transparent">
        <div class="text-overline text-medium-emphasis mb-2">Game-wide Summary</div>
        <v-table density="compact">
          <thead>
            <tr>
              <th>Player</th>
              <th>Connection</th>
              <th class="text-center" colspan="4">Client Ping</th>
              <th class="text-center">Loss</th>
              <th class="text-center" colspan="3">Server Ping</th>
            </tr>
            <tr class="text-caption text-medium-emphasis">
              <th></th><th></th>
              <th class="text-center">min</th><th class="text-center">avg</th>
              <th class="text-center">max</th><th class="text-center">stddev</th>
              <th class="text-center">rate</th>
              <th class="text-center">min</th><th class="text-center">avg</th><th class="text-center">max</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(summary, si) in playerSummaries" :key="'sum-' + si">
              <td><v-icon :color="playerColors[si]" size="x-small">{{ mdiCircle }}</v-icon> {{ summary.battleTag }}</td>
              <td class="text-caption" :class="summary.isProxied ? 'text-warning' : ''">
                {{ summary.connectionLabel }}
              </td>
              <td class="text-center">{{ summary.clientPing.min ?? '—' }}</td>
              <td class="text-center">{{ summary.clientPing.avg ?? '—' }}</td>
              <td class="text-center">{{ summary.clientPing.max ?? '—' }}</td>
              <td class="text-center">{{ summary.clientPing.stddev ?? '—' }}</td>
              <td class="text-center" :class="(summary.clientPing.lossRate ?? 0) > 1 ? 'text-warning' : 'text-success'">
                {{ summary.clientPing.lossRate != null ? summary.clientPing.lossRate.toFixed(1) + '%' : '—' }}
              </td>
              <td class="text-center">{{ summary.serverPing.min ?? '—' }}</td>
              <td class="text-center">{{ summary.serverPing.avg ?? '—' }}</td>
              <td class="text-center">{{ summary.serverPing.max ?? '—' }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive, ref, watch } from "vue";
import { EConnectionEventType, EConnectionType, LagReportDetail } from "@/store/admin/lagReports/types";
import { mdiCircle } from "@mdi/js";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { ChartData, ChartOptions } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

const PLAYER_COLORS = ["#ef5350", "#42a5f5", "#66bb6a", "#ffb74d", "#ab47bc", "#26c6da", "#ec407a", "#8d6e63"];

export default defineComponent({
  name: "LagReportContinuousMonitoring",
  components: { BarChart },
  props: {
    report: { type: Object as PropType<LagReportDetail>, required: true },
    playerColors: { type: Array as PropType<string[]>, required: true },
    inspectorLeftMs: { type: Number as PropType<number | null>, default: null },
    inspectorRightMs: { type: Number as PropType<number | null>, default: null },
  },
  emits: ["update:inspectorLeftMs", "update:inspectorRightMs", "openInspector"],
  setup(props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pingChartRef = ref<any>(null);
    const draggingMarker = ref<"left" | "right" | null>(null);
    const visiblePlayers = reactive<Record<number, boolean>>({});

    function playerName(battleTag: string): string {
      return battleTag.split("#")[0];
    }

    function formatGameTime(ms: number): string {
      const totalSec = Math.floor(ms / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${min}:${sec.toString().padStart(2, "0")}`;
    }

    const connectionEventLabelMap: Record<string, string> = {
      [EConnectionEventType.Reconnect]: "Reconnected",
      [EConnectionEventType.FailureDisconnect]: "Disconnected",
      [EConnectionEventType.GameCrashed]: "Game crashed",
      [EConnectionEventType.GamePaused]: "Game paused",
      [EConnectionEventType.GameResumed]: "Game resumed",
      [EConnectionEventType.StartLag]: "Lag detected",
      [EConnectionEventType.StopLag]: "Lag resolved",
    };

    // ── Game clock alignment ─────────────────────────────────────────
    const gameStartMs = computed(() => {
      let earliest = Infinity;
      for (const player of props.report.players) {
        for (const p of player.diagnostics.pingHistory) {
          const t = new Date(p.timestamp).getTime();
          if (t < earliest) earliest = t;
        }
      }
      return earliest === Infinity ? new Date(props.report.createdAt).getTime() : earliest;
    });

    const gameClockPauses = computed(() => {
      const pauses: { gameTimeSec: number; durationMs: number }[] = [];
      for (const player of props.report.players) {
        for (const ce of player.diagnostics.connectionEvents) {
          if (
            (ce.eventType === EConnectionEventType.Reconnect ||
             ce.eventType === EConnectionEventType.GameResumed ||
             ce.eventType === EConnectionEventType.StopLag) &&
            ce.durationMs
          ) {
            pauses.push({ gameTimeSec: ce.gameTimeOffsetMs / 1000, durationMs: ce.durationMs });
          }
        }
      }
      const seen = new Set<number>();
      return pauses.filter((p) => {
        if (seen.has(p.gameTimeSec)) return false;
        seen.add(p.gameTimeSec);
        return true;
      }).sort((a, b) => a.gameTimeSec - b.gameTimeSec);
    });

    function gameTimeToWallClockMs(gameTimeSec: number): number {
      let extraMs = 0;
      for (const pause of gameClockPauses.value) {
        if (pause.gameTimeSec < gameTimeSec) {
          extraMs += pause.durationMs;
        } else {
          break;
        }
      }
      return gameStartMs.value + gameTimeSec * 1000 + extraMs;
    }

    // ── Ping + Loss combined chart ──────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pingChartData = computed<ChartData<any>>(() => {
      const r = props.report;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const datasets: any[] = [];

      r.players.forEach((player, pi) => {
        if (!visiblePlayers[pi]) return;
        const color = PLAYER_COLORS[pi % PLAYER_COLORS.length];

        if (player.diagnostics.pingHistory.length) {
          datasets.push({
            type: "line",
            label: `${playerName(player.battleTag)} client`,
            data: player.diagnostics.pingHistory.map((p) => ({
              x: new Date(p.timestamp).getTime(),
              y: p.avg ?? 0,
            })),
            borderColor: color,
            backgroundColor: "transparent",
            borderWidth: 1.5,
            pointRadius: 1,
            tension: 0.2,
            yAxisID: "y",
            order: 1,
          });
        }

        const lossPoints = player.diagnostics.pingHistory.filter((p) => p.lossRate > 0);
        if (lossPoints.length) {
          datasets.push({
            type: "bar",
            label: `${playerName(player.battleTag)} loss`,
            data: lossPoints.map((p) => ({
              x: new Date(p.timestamp).getTime(),
              y: p.lossRate * 100,
            })),
            backgroundColor: color + "40",
            borderColor: color,
            borderWidth: 1,
            maxBarThickness: 8,
            yAxisID: "yLoss",
            order: 2,
          });
        }
      });

      if (r.serverSidePing) {
        r.serverSidePing.forEach((sp, si) => {
          const pi = r.players.findIndex((p) => p.battleTag === sp.playerName);
          if (pi >= 0 && !visiblePlayers[pi]) return;
          const color = pi >= 0 ? PLAYER_COLORS[pi % PLAYER_COLORS.length] : PLAYER_COLORS[si % PLAYER_COLORS.length];
          if (sp.samples.length) {
            const points: { x: number; y: number | null }[] = [];
            const pauses = gameClockPauses.value;
            let prevTime = -1;
            for (const s of sp.samples) {
              for (const pause of pauses) {
                if (pause.gameTimeSec > prevTime && pause.gameTimeSec <= s.time) {
                  points.push({ x: gameTimeToWallClockMs(pause.gameTimeSec), y: null });
                }
              }
              points.push({ x: gameTimeToWallClockMs(s.time), y: s.avg ?? 0 });
              prevTime = s.time;
            }
            datasets.push({
              type: "line",
              label: `${sp.playerName.split("#")[0]} server`,
              data: points,
              borderColor: color,
              backgroundColor: "transparent",
              borderWidth: 1,
              borderDash: [4, 3],
              pointRadius: 0,
              tension: 0.2,
              spanGaps: false,
              yAxisID: "y",
              order: 1,
            });
          }
        });
      }

      return { datasets };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pingChartOptions = computed<ChartOptions<any>>(() => {
      const annotations: Record<string, unknown> = {};
      const r = props.report;
      let idx = 0;
      r.players.forEach((player) => {
        player.diagnostics.lagEvents.forEach((le) => {
          const ts = new Date(le.timestamp).getTime();
          annotations[`lag-${idx}`] = {
            type: "line",
            xMin: ts,
            xMax: ts,
            borderColor: "#ffb74d",
            borderWidth: 2,
            label: {
              display: true,
              content: `-lag ${formatGameTime(le.gameTimeOffsetMs)}`,
              position: "start",
              backgroundColor: "#ffb74d",
              color: "#000",
              font: { size: 9 },
            },
          };
          idx++;
        });
        const annotationColorMap: Record<string, string> = {
          [EConnectionEventType.Reconnect]: "#ff9800",
          [EConnectionEventType.FailureDisconnect]: "#f44336",
          [EConnectionEventType.GameCrashed]: "#f44336",
          [EConnectionEventType.GamePaused]: "#ff9800",
          [EConnectionEventType.GameResumed]: "#2196f3",
          [EConnectionEventType.StartLag]: "#ff9800",
          [EConnectionEventType.StopLag]: "#2196f3",
        };

        player.diagnostics.connectionEvents.forEach((ce) => {
          const ts = new Date(ce.timestamp).getTime();
          if (ce.eventType === EConnectionEventType.Reconnect && ce.durationMs) {
            const disconnectTs = ts - ce.durationMs;
            annotations[`disc-${idx}`] = {
              type: "line",
              xMin: disconnectTs,
              xMax: disconnectTs,
              borderColor: "#f44336",
              borderWidth: 2,
              label: {
                display: true,
                content: "Disconnected",
                position: "start",
                backgroundColor: "#f44336",
                color: "#fff",
                font: { size: 9 },
              },
            };
          }

          const color = annotationColorMap[ce.eventType] ?? "#f44336";
          const label = connectionEventLabelMap[ce.eventType] ?? ce.eventType;

          annotations[`conn-${idx}`] = {
            type: "line",
            xMin: ts,
            xMax: ts,
            borderColor: color,
            borderWidth: 2,
            borderDash: [4, 2],
            label: {
              display: true,
              content: label,
              position: "start",
              backgroundColor: color,
              color: "#fff",
              font: { size: 9 },
            },
          };
          idx++;
        });
      });

      return {
        maintainAspectRatio: true,
        aspectRatio: 4,
        plugins: {
          legend: { display: true, position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
          annotation: {
            annotations: {
              ...annotations,
              ...(props.inspectorLeftMs != null ? {
                inspectorLeft: {
                  type: "line",
                  xMin: props.inspectorLeftMs,
                  xMax: props.inspectorLeftMs,
                  borderColor: "#42a5f5",
                  borderWidth: 2,
                  borderDash: [6, 3],
                  label: {
                    display: true,
                    content: "L",
                    position: "end",
                    backgroundColor: "#42a5f5",
                    color: "#fff",
                    font: { size: 10, weight: "bold" },
                  },
                },
              } : {}),
              ...(props.inspectorRightMs != null ? {
                inspectorRight: {
                  type: "line",
                  xMin: props.inspectorRightMs,
                  xMax: props.inspectorRightMs,
                  borderColor: "#ffb74d",
                  borderWidth: 2,
                  borderDash: [6, 3],
                  label: {
                    display: true,
                    content: "R",
                    position: "end",
                    backgroundColor: "#ffb74d",
                    color: "#000",
                    font: { size: 10, weight: "bold" },
                  },
                },
              } : {}),
            },
          },
          zoom: {
            pan: { enabled: true, mode: "x" },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x",
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: { tooltipFormat: "HH:mm:ss", displayFormats: { second: "HH:mm:ss", minute: "HH:mm" } },
          },
          y: { beginAtZero: true, title: { display: true, text: "ms" } },
          yLoss: {
            position: "right",
            beginAtZero: true,
            title: { display: true, text: "% loss" },
            grid: { drawOnChartArea: false },
          },
        },
        elements: { point: { radius: 1, hitRadius: 8 } },
      };
    });

    // ── Summary Stats ────────────────────────────────────────────────
    const playerSummaries = computed(() => {
      return props.report.players.map((player) => {
        const ping = player.diagnostics.pingHistory;
        const clientStats = computePingStats(ping.map((p) => p.avg).filter((v): v is number => v != null));
        const lossRates = ping.map((p) => p.lossRate).filter((v) => v != null);
        const avgLoss = lossRates.length ? (lossRates.reduce((a, b) => a + b, 0) / lossRates.length) * 100 : null;

        const spd = props.report.serverSidePing?.find((s) => s.playerName === player.battleTag);
        const serverStats = spd
          ? computePingStats(spd.samples.map((s) => s.avg).filter((v): v is number => v != null))
          : { min: null, avg: null, max: null };

        return {
          battleTag: player.battleTag,
          isProxied: player.connectionType === EConnectionType.Proxied,
          connectionLabel: player.connectionType === EConnectionType.Proxied
            ? `${player.proxyName ?? "proxy"} → ${props.report.serverNodeName}`
            : "Direct",
          clientPing: { ...clientStats, stddev: computeStddev(ping.map((p) => p.avg).filter((v): v is number => v != null)), lossRate: avgLoss },
          serverPing: serverStats,
        };
      });
    });

    function computePingStats(values: number[]): { min: number | null; avg: number | null; max: number | null } {
      if (!values.length) return { min: null, avg: null, max: null };
      return {
        min: Math.round(Math.min(...values)),
        avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        max: Math.round(Math.max(...values)),
      };
    }

    function computeStddev(values: number[]): number | null {
      if (values.length < 2) return null;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
      return Math.round(Math.sqrt(variance) * 10) / 10;
    }

    // ── Chart interaction ────────────────────────────────────────────
    function getChartXFromEvent(event: PointerEvent): number | null {
      const chart = pingChartRef.value?.chart;
      if (!chart?.scales?.x) return null;
      const rect = chart.canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      return chart.scales.x.getValueForPixel(px);
    }

    function onChartPointerDown(event: PointerEvent) {
      if (!event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();

      const ms = getChartXFromEvent(event);
      if (ms == null) return;
      const chart = pingChartRef.value?.chart;
      if (!chart?.scales?.x) return;

      const GRAB_THRESHOLD = 12;
      const clickPx = event.clientX - chart.canvas.getBoundingClientRect().left;

      if (props.inspectorLeftMs != null) {
        const leftPx = chart.scales.x.getPixelForValue(props.inspectorLeftMs);
        if (Math.abs(clickPx - leftPx) < GRAB_THRESHOLD) {
          draggingMarker.value = "left";
          return;
        }
      }
      if (props.inspectorRightMs != null) {
        const rightPx = chart.scales.x.getPixelForValue(props.inspectorRightMs);
        if (Math.abs(clickPx - rightPx) < GRAB_THRESHOLD) {
          draggingMarker.value = "right";
          return;
        }
      }

      if (props.inspectorLeftMs == null) {
        emit("update:inspectorLeftMs", ms);
        draggingMarker.value = "left";
      } else if (props.inspectorRightMs == null) {
        emit("update:inspectorRightMs", ms);
        draggingMarker.value = "right";
      } else {
        const leftPx = chart.scales.x.getPixelForValue(props.inspectorLeftMs);
        const rightPx = chart.scales.x.getPixelForValue(props.inspectorRightMs);
        if (Math.abs(clickPx - leftPx) < Math.abs(clickPx - rightPx)) {
          emit("update:inspectorLeftMs", ms);
          draggingMarker.value = "left";
        } else {
          emit("update:inspectorRightMs", ms);
          draggingMarker.value = "right";
        }
      }
      emit("openInspector");
    }

    function onChartPointerMove(event: PointerEvent) {
      if (!draggingMarker.value) return;
      event.preventDefault();
      const ms = getChartXFromEvent(event);
      if (ms == null) return;
      if (draggingMarker.value === "left") {
        emit("update:inspectorLeftMs", ms);
      } else {
        emit("update:inspectorRightMs", ms);
      }
    }

    function onChartPointerUp() {
      draggingMarker.value = null;
    }

    function resetPingChartZoom() {
      pingChartRef.value?.chart?.resetZoom();
    }

    // Initialize visible players when report data arrives
    watch(() => props.report.players, (players) => {
      players.forEach((_, i) => {
        if (visiblePlayers[i] === undefined) visiblePlayers[i] = true;
      });
    }, { immediate: true });

    return {
      visiblePlayers,
      playerName,
      pingChartRef,
      pingChartData,
      pingChartOptions,
      resetPingChartZoom,
      onChartPointerDown,
      onChartPointerMove,
      onChartPointerUp,
      playerSummaries,
      mdiCircle,
      zoomPlugin,
    };
  },
});
</script>
