<template>
  <v-expansion-panel value="relay">
    <v-expansion-panel-title>
      <strong>Relay Legs</strong>
      <span class="text-medium-emphasis text-caption ml-2">Per-hop TCP stats from the relays and the game node, on the wall clock</span>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <section
        v-for="(view, pi) in views"
        :key="'relay-' + pi"
        :aria-labelledby="'relay-heading-' + pi"
        class="mb-6"
      >
        <h3 :id="'relay-heading-' + pi" class="text-subtitle-1 mb-1">
          <v-icon :color="playerColors[pi]" size="x-small">{{ mdiCircle }}</v-icon>
          {{ playerName(report.players[pi].battleTag) }}
          <span v-for="chain in view?.chains ?? []" :key="chain" class="text-body-2 text-medium-emphasis ml-2">{{ chain }}</span>
        </h3>
        <template v-if="view">
          <lag-report-relay-chart
            :series="view.series"
            :groups="view.groups"
            :pauses="pauses"
            :markers="markers[pi]"
            :description="chartLabel(view)"
          />
          <lag-report-hop-table
            class="mt-3"
            :legs="view.legs"
            :worst-index="view.worstIndex"
            :player-name="playerName(report.players[pi].battleTag)"
          />
        </template>
        <div v-else class="text-caption text-medium-emphasis">No relay telemetry for this player (older client, or the fetch has not succeeded yet).</div>
      </section>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import { useTheme } from "vuetify";
import { mdiCircle } from "@mdi/js";
import { EConnectionEventType, type LagReportDetail } from "@/store/admin/lagReports/types";
import type { IPlayerMatchTelemetry } from "@/store/admin/playerMatchTelemetry/types";
import { readLagChipColors } from "@/helpers/lag-report-colors";
import LagReportHopTable from "./LagReportHopTable.vue";
import LagReportRelayChart from "./LagReportRelayChart.vue";
import { buildEventMarkers, type EventMarkerInfo, playerName } from "./chartMarkers";
import { collectPauseIntervals, isWithinPause } from "./gameTimeline";
import { buildPlayerRelayView, type PlayerRelayView } from "./relayPlayerView";

const PAUSE_EVENTS = [EConnectionEventType.GamePaused, EConnectionEventType.GameResumed];

export default defineComponent({
  name: "LagReportRelayLegs",
  components: { LagReportHopTable, LagReportRelayChart },
  props: {
    report: { type: Object as PropType<LagReportDetail>, required: true },
    playerColors: { type: Array as PropType<string[]>, required: true },
    telemetry: { type: Object as PropType<IPlayerMatchTelemetry | null>, default: null },
  },
  setup(props) {
    const views = computed(() => props.report.players.map((_, pi) => buildPlayerRelayView(props.report, pi, props.telemetry)));
    const pauses = computed(() => collectPauseIntervals(props.report.players));

    const theme = useTheme();

    // An opponent's pause freezes this player's game too. The pause boxes already show every
    // resumed pause, so only the other players' pause events that no box covers become lines.
    const markers = computed<EventMarkerInfo[][]>(() => {
      // readLagChipColors reads CSS variables, which Vue cannot track; this re-reads them on a theme switch.
      void theme.current.value.dark;
      const chipColors = readLagChipColors();
      return props.report.players.map((_, pi) =>
        buildEventMarkers(props.report.players, {
          chipColors,
          playerColors: props.playerColors,
          includeLagEvents: (i) => i === pi,
          includeConnectionEvent: (i, ce) =>
            i === pi || (PAUSE_EVENTS.includes(ce.eventType) && !isWithinPause(new Date(ce.timestamp).getTime(), pauses.value)),
        })
      );
    });

    function chartLabel(view: PlayerRelayView): string {
      const worst = view.worstIndex != null ? view.legs[view.worstIndex] : null;
      const verdict = worst ? ` Worst leg: ${worst.label}, ${worst.stallSecs} s stalled, ${worst.retransmits} retransmits.` : "";
      return `Round-trip times over the game for ${playerName(view.battleTag)}: felt echo-RTT, ServerSidePing and each relay leg.${verdict} The hop table below has the numbers.`;
    }

    return { views, pauses, markers, chartLabel, playerName, mdiCircle };
  },
});
</script>
