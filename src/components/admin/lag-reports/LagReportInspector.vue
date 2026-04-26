<template>
  <v-expansion-panel value="inspector">
    <v-expansion-panel-title>
      <strong>Point-in-Time Inspector</strong>
      <span class="text-medium-emphasis text-caption ml-2">Drag markers on chart or use quick-jump buttons</span>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <!-- Quick-jump chips for events -->
      <div class="d-flex ga-2 flex-wrap mb-3 align-center">
        <span class="text-caption text-medium-emphasis">Jump to:</span>
        <v-chip
          v-for="(evt, ei) in inspectableEvents"
          :key="'evt-' + ei"
          :color="evt.color"
          variant="tonal"
          size="x-small"
          class="cursor-pointer"
          @click="jumpToEvent(evt.timestamp)"
        >
          {{ evt.prefix }}
          <span class="ml-1" :style="{ color: evt.playerColor, fontWeight: 600 }">({{ evt.playerName }})</span>
        </v-chip>
      </div>

      <template v-if="inspectorLeftMs != null || inspectorRightMs != null">
        <!-- Player tabs for MTR -->
        <v-tabs v-model="inspectorPlayerTab" color="primary" class="mb-3">
          <v-tab
            v-for="(player, pi) in report.players"
            :key="'ptab-' + pi"
            :value="pi"
            class="text-none inspector-tab"
          >
            <span :style="{ color: playerColors[pi] }">{{ playerName(player.battleTag) }}</span>
            <span class="text-medium-emphasis">&nbsp;— forward</span>
          </v-tab>
          <v-tab
            v-for="(player, pi) in report.players"
            :key="'rtab-' + pi"
            :value="'reverse-' + pi"
            class="text-none inspector-tab"
          >
            <span :style="{ color: playerColors[pi] }">{{ playerName(player.battleTag) }}</span>
            <span class="text-medium-emphasis">&nbsp;— reverse</span>
          </v-tab>
        </v-tabs>

        <!-- Side-by-side comparison -->
        <v-row>
          <v-col cols="12" md="6">
            <v-card variant="flat" color="transparent" class="pa-3">
              <div class="text-overline mb-2" style="color: #42a5f5;">
                <v-icon size="x-small" color="#42a5f5">{{ mdiCircle }}</v-icon>
                L — {{ inspectorLeftMs != null ? formatDate(new Date(inspectorLeftMs).toISOString()) : 'not set' }}
                <span v-if="inspectorLeftTrace" class="text-caption text-medium-emphasis ml-1">
                  (closest trace: {{ inspectorLeftTrace.hops.length }} hops, final {{ lastHopAvg(inspectorLeftTrace.hops) }})
                </span>
              </div>
              <mtr-hop-table v-if="inspectorLeftTrace" :hops="inspectorLeftTrace.hops" />
              <div v-else class="text-medium-emphasis text-caption">No MTR trace near this timestamp</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card variant="flat" color="transparent" class="pa-3">
              <div class="text-overline mb-2" style="color: #ffb74d;">
                <v-icon size="x-small" color="#ffb74d">{{ mdiCircle }}</v-icon>
                R — {{ inspectorRightMs != null ? formatDate(new Date(inspectorRightMs).toISOString()) : 'not set' }}
                <span v-if="inspectorRightTrace" class="text-caption text-medium-emphasis ml-1">
                  (closest trace: {{ inspectorRightTrace.hops.length }} hops, final {{ lastHopAvg(inspectorRightTrace.hops) }})
                </span>
              </div>
              <mtr-hop-table
                v-if="inspectorRightTrace"
                :hops="inspectorRightTrace.hops"
                :baseline-hops="inspectorLeftTrace ? inspectorLeftTrace.hops : []"
              />
              <div v-else class="text-medium-emphasis text-caption">No MTR trace near this timestamp</div>
            </v-card>
          </v-col>
        </v-row>
      </template>
      <div v-else class="text-medium-emphasis text-caption pa-4 text-center">
        Click or drag on the chart above to place inspection markers
      </div>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";
import { EConnectionEventType, HopData, LagReportDetail, LagReportPlayer } from "@/store/admin/lagReports/types";
import { mdiCircle } from "@mdi/js";
import MtrHopTable from "@/components/admin/MtrHopTable.vue";

export default defineComponent({
  name: "LagReportInspector",
  components: { MtrHopTable },
  props: {
    report: { type: Object as PropType<LagReportDetail>, required: true },
    playerColors: { type: Array as PropType<string[]>, required: true },
    inspectorLeftMs: { type: Number as PropType<number | null>, default: null },
    inspectorRightMs: { type: Number as PropType<number | null>, default: null },
  },
  emits: ["update:inspectorLeftMs", "update:inspectorRightMs"],
  setup(props, { emit }) {
    const inspectorPlayerTab = ref<number | string>(0);

    function playerName(battleTag: string): string {
      return battleTag.split("#")[0];
    }

    function formatDate(iso: string): string {
      if (!iso) return "";
      return new Date(iso).toLocaleString();
    }

    function formatGameTime(ms: number): string {
      const totalSec = Math.floor(ms / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${min}:${sec.toString().padStart(2, "0")}`;
    }

    function lastHopAvg(hops: HopData[]): string {
      if (!hops.length) return "—";
      const last = hops[hops.length - 1];
      return last.avgRttMs != null ? Math.round(last.avgRttMs) + "ms" : "—";
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

    function connectionEventLabel(eventType: string): string {
      return connectionEventLabelMap[eventType] ?? eventType;
    }

    // Game start used for jumpToEvent baseline marker
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

    function eventColor(eventType: EConnectionEventType): string {
      if ([EConnectionEventType.Reconnect, EConnectionEventType.GamePaused, EConnectionEventType.StartLag].includes(eventType)) {
        return "warning";
      }
      if ([EConnectionEventType.GameResumed, EConnectionEventType.StopLag].includes(eventType)) {
        return "info";
      }
      return "error";
    }

    const inspectableEvents = computed(() => {
      const events: {
        prefix: string;
        playerName: string;
        playerColor: string;
        timestamp: string;
        color: string;
      }[] = [];
      props.report.players.forEach((player, pi) => {
        const pName = playerName(player.battleTag);
        const pColor = props.playerColors[pi] ?? "#ffffff";
        player.diagnostics.lagEvents.forEach((le) => {
          events.push({
            prefix: `-lag ${formatGameTime(le.gameTimeOffsetMs)}`,
            playerName: pName,
            playerColor: pColor,
            timestamp: le.timestamp,
            color: "warning",
          });
        });
        player.diagnostics.connectionEvents.forEach((ce) => {
          if (ce.eventType === EConnectionEventType.Reconnect && ce.durationMs) {
            const disconnectMs = new Date(ce.timestamp).getTime() - ce.durationMs;
            events.push({
              prefix: `Disconnected ${formatGameTime(ce.gameTimeOffsetMs)}`,
              playerName: pName,
              playerColor: pColor,
              timestamp: new Date(disconnectMs).toISOString(),
              color: "error",
            });
          }
          events.push({
            prefix: `${connectionEventLabel(ce.eventType)} ${formatGameTime(ce.gameTimeOffsetMs)}`,
            playerName: pName,
            playerColor: pColor,
            timestamp: ce.timestamp,
            color: eventColor(ce.eventType),
          });
        });
      });
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return events;
    });

    function jumpToEvent(timestamp: string) {
      const ms = new Date(timestamp).getTime();
      emit("update:inspectorLeftMs", gameStartMs.value);
      emit("update:inspectorRightMs", ms);
    }

    function findClosestTrace(player: LagReportPlayer, wallClockMs: number, direction: "forward" | "reverse") {
      const traces = direction === "forward" ? player.diagnostics.targetMtr : player.diagnostics.reverseMtr;
      if (!traces.length) return null;
      let closest = traces[0];
      let minDiff = Math.abs(new Date(closest.timestamp).getTime() - wallClockMs);
      for (const t of traces) {
        const diff = Math.abs(new Date(t.timestamp).getTime() - wallClockMs);
        if (diff < minDiff) {
          closest = t;
          minDiff = diff;
        }
      }
      return closest;
    }

    function getInspectorTrace(wallClockMs: number | null) {
      if (wallClockMs == null) return null;
      const tab = inspectorPlayerTab.value;
      const isReverse = typeof tab === "string" && tab.startsWith("reverse-");
      const pi = isReverse ? parseInt(tab.toString().replace("reverse-", "")) : (tab as number);
      const player = props.report.players[pi];
      if (!player) return null;
      return findClosestTrace(player, wallClockMs, isReverse ? "reverse" : "forward");
    }

    const inspectorLeftTrace = computed(() => getInspectorTrace(props.inspectorLeftMs));
    const inspectorRightTrace = computed(() => getInspectorTrace(props.inspectorRightMs));

    return {
      inspectorPlayerTab,
      inspectableEvents,
      jumpToEvent,
      inspectorLeftTrace,
      inspectorRightTrace,
      playerName,
      formatDate,
      lastHopAvg,
      mdiCircle,
    };
  },
});
</script>

<style scoped>
:deep(.inspector-tab.v-btn) {
  text-transform: none !important;
  letter-spacing: normal !important;
}
</style>
