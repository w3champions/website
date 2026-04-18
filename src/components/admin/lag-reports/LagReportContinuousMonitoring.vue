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
          style="cursor: crosshair; position: relative;"
          @pointerdown="onChartPointerDown"
          @pointermove="onChartPointerMove"
          @pointerup="onChartPointerUp"
          @pointerleave="onChartPointerLeave"
        >
          <bar-chart ref="pingChartRef" :chart-data="pingChartData" :chart-options="pingChartOptions" :chart-plugins="[zoomPlugin]" />
          <div
            v-if="hoveredEventTooltip"
            :style="{
              position: 'absolute',
              left: `${hoveredEventTooltip.left}px`,
              top: `${hoveredEventTooltip.top}px`,
              backgroundColor: tooltipBgColor(hoveredEventTooltip.style.bgColor),
              color: tooltipTextColor(hoveredEventTooltip.style.textColor),
              border: `1px solid ${hoveredEventTooltip.style.border}`,
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '12px',
              lineHeight: '1.25',
              pointerEvents: 'none',
              zIndex: '10',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              maxWidth: '260px',
              whiteSpace: 'normal',
            }"
          >
            <div
              v-if="hoveredEventTooltip.swatchColor && hoveredEventTooltip.lines.length"
              style="display:flex; align-items:center; gap:6px; margin-bottom:2px;"
            >
              <span
                :style="{
                  display: 'inline-block',
                  width: '12px',
                  height: '8px',
                  borderRadius: '2px',
                  backgroundColor: hoveredEventTooltip.swatchColor,
                  border: '1px solid rgba(0,0,0,0.2)',
                }"
              ></span>
              <span style="font-weight: 600;">{{ hoveredEventTooltip.lines[0] }}</span>
            </div>
            <div
              v-for="(line, li) in hoveredEventTooltip.swatchColor ? hoveredEventTooltip.lines.slice(1) : hoveredEventTooltip.lines"
              :key="li"
            >
              {{ line }}
            </div>
          </div>
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
import { useTheme } from "vuetify";
import { EConnectionEventType, EConnectionType, LagReportDetail } from "@/store/admin/lagReports/types";
import { mdiCircle } from "@mdi/js";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { ChartData, ChartOptions } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { readLagChipColors, playerColorTonalStyle, type LagAnnotationStyle } from "@/helpers/lag-report-colors";

const PLAYER_COLORS = ["#ef5350", "#42a5f5", "#66bb6a", "#ffb74d", "#ab47bc", "#26c6da", "#ec407a", "#8d6e63"];

type EventMarkerInfo = {
  id: string;
  ts: number;
  shortLabel: string;
  detailLines: string[];
  style: LagAnnotationStyle;
  dashed?: boolean;
};

type HoveredEventTooltip = {
  left: number;
  top: number;
  lines: string[];
  style: LagAnnotationStyle;
  swatchColor?: string;
};

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
    const theme = useTheme();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pingChartRef = ref<any>(null);
    const zoomRangeMs = ref<{ min: number; max: number } | null>(null);
    const chartNavigating = ref(false);
    const draggingMarker = ref<"left" | "right" | null>(null);
    const hoveredEventTooltip = ref<HoveredEventTooltip | null>(null);
    const hoveredDatasetIndex = ref<number | null>(null);
    const hoveredMarkerId = ref<string | null>(null);
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

    function formatWallClock(ms: number): string {
      return new Date(ms).toLocaleTimeString();
    }

    function tooltipBgColor(_color: string): string {
      return theme.current.value.dark ? "rgba(10, 14, 22, 0.94)" : "rgba(245, 248, 255, 0.96)";
    }

    function tooltipTextColor(_color: string): string {
      return theme.current.value.dark ? "rgba(245, 248, 255, 0.98)" : "rgba(10, 14, 22, 0.92)";
    }

    function withAlpha(color: string, alpha: number): string {
      const rgba = color.match(/^rgba\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\)$/i);
      if (rgba) return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${alpha})`;

      const rgb = color.match(/^rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)$/i);
      if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;

      const hex = color.match(/^#?([0-9a-f]{6})$/i);
      if (hex) {
        const n = hex[1];
        const r = Number.parseInt(n.slice(0, 2), 16);
        const g = Number.parseInt(n.slice(2, 4), 16);
        const b = Number.parseInt(n.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }

      return color;
    }

    function rememberZoomRange() {
      const xScale = pingChartRef.value?.chart?.scales?.x;
      if (!xScale) return;

      const min = Number(xScale.min);
      const max = Number(xScale.max);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return;

      zoomRangeMs.value = { min, max };
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
            metric: "client-ping",
            playerColor: color,
            data: player.diagnostics.pingHistory.map((p) => ({
              x: new Date(p.timestamp).getTime(),
              y: p.current,
            })),
            borderColor: color,
            backgroundColor: "transparent",
            borderWidth: 1.5,
            pointRadius: 1,
            pointHoverRadius: 4,
            pointHitRadius: 12,
            tension: 0.2,
            yAxisID: "y",
            order: 1,
          });
        }

        const lossPoints = player.diagnostics.pingHistory.filter((p) => p.lossRate > 0);
        if (lossPoints.length) {
          datasets.push({
            type: "line",
            label: `${playerName(player.battleTag)} loss`,
            metric: "packet-loss",
            playerColor: color,
            data: lossPoints.map((p) => ({
              x: new Date(p.timestamp).getTime(),
              y: p.lossRate * 100,
            })),
            showLine: false,
            backgroundColor: color,
            borderColor: color,
            borderWidth: 0,
            pointStyle: "rectRounded",
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHitRadius: 14,
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
              metric: "server-ping",
              playerColor: color,
              data: points,
              borderColor: color,
              backgroundColor: "transparent",
              borderWidth: 1,
              borderDash: [4, 3],
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHitRadius: 12,
              tension: 0.2,
              spanGaps: false,
              yAxisID: "y",
              order: 1,
            });
          }
        });
      }

      datasets.forEach((ds, i) => {
        const base = (ds.playerColor as string | undefined) ?? (ds.borderColor as string | undefined) ?? "#888888";
        const dimmed = hoveredDatasetIndex.value != null && hoveredDatasetIndex.value !== i;

        ds.borderColor = withAlpha(base, dimmed ? 0.2 : 1);

        if (ds.type === "line" && ds.showLine === false) {
          ds.backgroundColor = withAlpha(base, dimmed ? 0.2 : 1);
          ds.pointBorderColor = withAlpha(base, dimmed ? 0.25 : 1);
          ds.pointBackgroundColor = withAlpha(base, dimmed ? 0.25 : 1);
        } else {
          ds.pointBorderColor = withAlpha(base, dimmed ? 0.35 : 1);
          ds.pointBackgroundColor = withAlpha(base, dimmed ? 0.35 : 1);
        }
      });

      return { datasets };
    });

    const eventMarkers = computed<EventMarkerInfo[]>(() => {
      const markers: EventMarkerInfo[] = [];
      const chipColors = readLagChipColors();
      let idx = 0;

      props.report.players.forEach((player, pi) => {
        if (!visiblePlayers[pi]) return;
        const pName = playerName(player.battleTag);
        const pStyle = playerColorTonalStyle(PLAYER_COLORS[pi % PLAYER_COLORS.length]);

        player.diagnostics.lagEvents.forEach((le) => {
          const ts = new Date(le.timestamp).getTime();
          markers.push({
            id: `lag-${idx}`,
            ts,
            shortLabel: `-lag (${pName})`,
            detailLines: [
              `Game ${formatGameTime(le.gameTimeOffsetMs)}`,
              `At ${formatWallClock(ts)}`,
            ],
            style: pStyle,
          });
          idx++;
        });

        player.diagnostics.connectionEvents.forEach((ce) => {
          const ts = new Date(ce.timestamp).getTime();
          const ceLabel = connectionEventLabelMap[ce.eventType] ?? ce.eventType;
          const semanticKey = (
            [EConnectionEventType.Reconnect, EConnectionEventType.GamePaused, EConnectionEventType.StartLag].includes(ce.eventType)
              ? "warning"
              : [EConnectionEventType.GameResumed, EConnectionEventType.StopLag].includes(ce.eventType)
                ? "info"
                : "error"
          ) as keyof typeof chipColors;

          if (ce.eventType === EConnectionEventType.Reconnect && ce.durationMs) {
            const disconnectTs = ts - ce.durationMs;
            const disconnectGameMs = Math.max(0, ce.gameTimeOffsetMs - ce.durationMs);
            markers.push({
              id: `disc-${idx}`,
              ts: disconnectTs,
              shortLabel: `Disconnected (${pName})`,
              detailLines: [
                `Game ${formatGameTime(disconnectGameMs)}`,
                `At ${formatWallClock(disconnectTs)}`,
              ],
              style: chipColors.error,
            });
          }

          markers.push({
            id: `conn-${idx}`,
            ts,
            shortLabel: `${ceLabel} (${pName})`,
            detailLines: [
              `Game ${formatGameTime(ce.gameTimeOffsetMs)}`,
              `At ${formatWallClock(ts)}`,
            ],
            style: chipColors[semanticKey],
            dashed: true,
          });
          idx++;
        });
      });

      return markers;
    });

    const hoverMarkers = computed<EventMarkerInfo[]>(() => {
      const markers = [...eventMarkers.value];

      if (props.inspectorLeftMs != null) {
        markers.push({
          id: "inspector-left",
          ts: props.inspectorLeftMs,
          shortLabel: "Inspector Left (L)",
          detailLines: [
            "Shift+drag to move",
            `At ${formatWallClock(props.inspectorLeftMs)}`,
          ],
          style: {
            border: "#42a5f5",
            bgColor: "rgba(66,165,245,0.18)",
            textColor: "#42a5f5",
          },
          dashed: true,
        });
      }

      if (props.inspectorRightMs != null) {
        markers.push({
          id: "inspector-right",
          ts: props.inspectorRightMs,
          shortLabel: "Inspector Right (R)",
          detailLines: [
            "Shift+drag to move",
            `At ${formatWallClock(props.inspectorRightMs)}`,
          ],
          style: {
            border: "#ffb74d",
            bgColor: "rgba(255,183,77,0.18)",
            textColor: "#ffb74d",
          },
          dashed: true,
        });
      }

      return markers;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pingChartOptions = computed<ChartOptions<any>>(() => {
      const annotations: Record<string, unknown> = {};
      for (const marker of eventMarkers.value) {
        const dimmed = hoveredMarkerId.value != null && hoveredMarkerId.value !== marker.id;
        annotations[marker.id] = {
          id: marker.id,
          type: "line",
          xMin: marker.ts,
          xMax: marker.ts,
          borderColor: withAlpha(marker.style.border, dimmed ? 0.25 : 1),
          borderWidth: dimmed ? 1 : 2,
          borderDash: marker.dashed ? [4, 2] : undefined,
          hitTolerance: 12,
          label: { display: false },
        };
      }

      return {
        animation: false,
        maintainAspectRatio: true,
        aspectRatio: 4,
        plugins: {
          legend: { display: true, position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
          tooltip: { enabled: false },
          annotation: {
            annotations: {
              ...annotations,
              ...(props.inspectorLeftMs != null ? {
                inspectorLeft: {
                  type: "line",
                  xMin: props.inspectorLeftMs,
                  xMax: props.inspectorLeftMs,
                  borderColor: withAlpha("#42a5f5", hoveredMarkerId.value && hoveredMarkerId.value !== "inspector-left" ? 0.25 : 1),
                  borderWidth: hoveredMarkerId.value && hoveredMarkerId.value !== "inspector-left" ? 1 : 2,
                  borderDash: [6, 3],
                  label: { display: false },
                },
              } : {}),
              ...(props.inspectorRightMs != null ? {
                inspectorRight: {
                  type: "line",
                  xMin: props.inspectorRightMs,
                  xMax: props.inspectorRightMs,
                  borderColor: withAlpha("#ffb74d", hoveredMarkerId.value && hoveredMarkerId.value !== "inspector-right" ? 0.25 : 1),
                  borderWidth: hoveredMarkerId.value && hoveredMarkerId.value !== "inspector-right" ? 1 : 2,
                  borderDash: [6, 3],
                  label: { display: false },
                },
              } : {}),
            },
          },
          zoom: {
            pan: {
              enabled: true,
              mode: "x",
              onPanStart: () => {
                chartNavigating.value = true;
              },
              onPan: rememberZoomRange,
              onPanComplete: () => {
                rememberZoomRange();
                chartNavigating.value = false;
              },
            },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x",
              onZoomStart: () => {
                chartNavigating.value = true;
              },
              onZoom: rememberZoomRange,
              onZoomComplete: () => {
                rememberZoomRange();
                chartNavigating.value = false;
              },
            },
            limits: (() => {
              // Prevent zooming out past the extent of actual data.
              let xMin = Infinity;
              let xMax = -Infinity;
              for (const ds of pingChartData.value.datasets) {
                for (const pt of (ds.data as { x?: number }[])) {
                  if (pt?.x != null) {
                    if (pt.x < xMin) xMin = pt.x;
                    if (pt.x > xMax) xMax = pt.x;
                  }
                }
              }
              return xMin < xMax ? { x: { min: xMin, max: xMax } } : {};
            })(),
          },
        },
        scales: {
          x: {
            type: "time",
            time: { tooltipFormat: "HH:mm:ss", displayFormats: { second: "HH:mm:ss", minute: "HH:mm" } },
            ...(zoomRangeMs.value ? { min: zoomRangeMs.value.min, max: zoomRangeMs.value.max } : {}),
          },
          y: { beginAtZero: true, title: { display: true, text: "ms" } },
          yLoss: {
            position: "right",
            beginAtZero: true,
            title: { display: true, text: "% loss" },
            grid: { drawOnChartArea: false },
          },
        },
        elements: { point: { radius: 1, hitRadius: 12 } },
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
      if (draggingMarker.value) {
        event.preventDefault();
        const ms = getChartXFromEvent(event);
        if (ms == null) return;
        if (draggingMarker.value === "left") {
          emit("update:inspectorLeftMs", ms);
        } else {
          emit("update:inspectorRightMs", ms);
        }
        hoveredDatasetIndex.value = null;
        hoveredMarkerId.value = null;
        hoveredEventTooltip.value = null;
        return;
      }

      // While dragging for pan (mouse button down), disable hover-driven chart updates.
      if (event.buttons !== 0 && !event.shiftKey) {
        hoveredDatasetIndex.value = null;
        hoveredMarkerId.value = null;
        hoveredEventTooltip.value = null;
        return;
      }

      if (chartNavigating.value) {
        hoveredDatasetIndex.value = null;
        hoveredMarkerId.value = null;
        hoveredEventTooltip.value = null;
        return;
      }

      const chart = pingChartRef.value?.chart;
      if (!chart?.scales?.x) {
        hoveredDatasetIndex.value = null;
        hoveredMarkerId.value = null;
        hoveredEventTooltip.value = null;
        return;
      }

      const rect = chart.canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const nearestPoint = chart.getElementsAtEventForMode(
        event as unknown as Event,
        "nearest",
        { intersect: false, axis: "xy" },
        false,
      )[0];

      if (nearestPoint) {
        const pointEl = nearestPoint.element as { x: number; y: number };
        const dx = mouseX - pointEl.x;
        const dy = mouseY - pointEl.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const POINT_HOVER_THRESHOLD_PX = 20;

        if (dist <= POINT_HOVER_THRESHOLD_PX) {
          const ds = chart.data.datasets[nearestPoint.datasetIndex] as {
            label?: string;
            metric?: string;
            playerColor?: string;
            data?: Array<{ x?: number; y?: number }>;
          };
          const dp = ds.data?.[nearestPoint.index];
          const xMs = typeof dp?.x === "number" ? dp.x : null;
          const yVal = typeof dp?.y === "number" ? dp.y : null;
          const pStyle = playerColorTonalStyle(ds.playerColor ?? "#888888");

          const valueLine = ds.metric === "packet-loss"
            ? `Loss ${yVal != null ? yVal.toFixed(1) : "?"}%`
            : `Ping ${yVal != null ? Math.round(yVal) : "?"} ms`;

          hoveredDatasetIndex.value = nearestPoint.datasetIndex;
          hoveredMarkerId.value = null;
          hoveredEventTooltip.value = {
            left: Math.min(mouseX + 14, Math.max(8, rect.width - 260)),
            top: Math.min(mouseY + 14, Math.max(8, rect.height - 100)),
            lines: [
              ds.label ?? "Series",
              valueLine,
              xMs != null ? `At ${formatWallClock(xMs)}` : "",
            ].filter(Boolean),
            style: pStyle,
            swatchColor: ds.playerColor,
          };
          return;
        }
      }

      const HOVER_THRESHOLD_PX = 12;

      let nearest: EventMarkerInfo | null = null;
      let nearestDistance = Infinity;
      for (const marker of hoverMarkers.value) {
        const markerX = chart.scales.x.getPixelForValue(marker.ts);
        const dist = Math.abs(mouseX - markerX);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearest = marker;
        }
      }

      if (nearest && nearestDistance <= HOVER_THRESHOLD_PX) {
        hoveredDatasetIndex.value = null;
        hoveredMarkerId.value = nearest.id;
        hoveredEventTooltip.value = {
          left: Math.min(mouseX + 14, Math.max(8, rect.width - 260)),
          top: Math.min(mouseY + 14, Math.max(8, rect.height - 100)),
          lines: [nearest.shortLabel, ...nearest.detailLines],
          style: nearest.style,
        };
      } else {
        hoveredDatasetIndex.value = null;
        hoveredMarkerId.value = null;
        hoveredEventTooltip.value = null;
      }
    }

    function onChartPointerUp() {
      draggingMarker.value = null;
    }

    function onChartPointerLeave() {
      draggingMarker.value = null;
      hoveredDatasetIndex.value = null;
      hoveredMarkerId.value = null;
      hoveredEventTooltip.value = null;
    }

    function resetPingChartZoom() {
      zoomRangeMs.value = null;
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
      tooltipBgColor,
      tooltipTextColor,
      pingChartRef,
      pingChartData,
      pingChartOptions,
      hoveredEventTooltip,
      resetPingChartZoom,
      onChartPointerDown,
      onChartPointerMove,
      onChartPointerUp,
      onChartPointerLeave,
      playerSummaries,
      mdiCircle,
      zoomPlugin,
    };
  },
});
</script>
