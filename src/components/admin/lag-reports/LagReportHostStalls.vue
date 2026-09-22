<template>
  <v-card v-if="rows.length" variant="outlined" class="mb-4">
    <v-card-text class="py-3">
      <div class="d-flex flex-wrap ga-2 align-center mb-1">
        <v-icon :color="summary?.color" size="small">{{ mdiServerNetworkOff }}</v-icon>
        <strong>Host Stalls</strong>
        <v-chip v-if="summary" size="x-small" :color="summary.color" variant="tonal">
          {{ summary.count }}x — {{ formatStallDuration(summary.totalStallMs) }} lost
        </v-chip>
      </div>
      <div class="text-medium-emphasis text-caption mb-3">
        {{ serverNodeName }} measured these in itself and told every client the same thing,
        so they describe the server and not any one player's connection.
      </div>
      <v-table density="compact">
        <thead>
          <tr>
            <th>
              <div class="d-flex align-center ga-1">
                <span>First Reported</span>
                <v-tooltip
                  location="top"
                  content-class="w3-tooltip elevation-1"
                  text="Each client stamps this on arrival, after the stall and the network trip - so it is an
                    approximate upper bound on when the stall happened, not a lower one, and only as reliable
                    as the reporting clients' own clocks. Hover a row's time to see every reporter's own timestamp."
                >
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" size="14">{{ mdiInformationOutline }}</v-icon>
                  </template>
                </v-tooltip>
              </div>
            </th>
            <th>Game Time</th>
            <th class="text-center">Lost</th>
            <th class="text-center">Players Flagged</th>
            <th>Outcome</th>
            <th>Reported By</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in rows" :key="'hs-' + ri">
            <td class="text-caption">
              <v-tooltip
                v-if="row.reportedAtHint"
                location="top"
                content-class="w3-tooltip elevation-1"
                :text="row.reportedAtHint"
              >
                <template v-slot:activator="{ props }">
                  <span v-bind="props">{{ row.earliestTimestamp ? formatDate(row.earliestTimestamp) : "—" }}</span>
                </template>
              </v-tooltip>
              <span v-else>—</span>
            </td>
            <td>{{ formatGameTime(row.stall.gameTimeOffsetMs) }}</td>
            <td class="text-center">{{ formatStallDuration(row.stall.stallMs) }}</td>
            <td class="text-center" :class="row.stall.playersFlagged > 0 ? 'text-warning' : ''">
              {{ row.stall.playersFlagged }} / {{ row.stall.playersTotal }}
            </td>
            <td>
              <v-tooltip
                location="top"
                content-class="w3-tooltip elevation-1"
                :text="row.outcome.description"
              >
                <template v-slot:activator="{ props }">
                  <v-chip v-bind="props" size="x-small" :color="row.outcome.color" variant="tonal">
                    {{ row.outcome.label }}
                  </v-chip>
                </template>
              </v-tooltip>
            </td>
            <td>
              <div class="d-flex flex-wrap ga-1 align-center py-1">
                <span
                  v-for="(reporter, pi) in row.reporters"
                  :key="'rep-' + ri + '-' + pi"
                  class="text-caption"
                  :style="{ color: playerColors[reporter.playerIndex], fontWeight: 600 }"
                >
                  {{ playerName(reporter.battleTag) }}
                </span>
                <v-tooltip
                  v-if="row.partiallyReported"
                  location="top"
                  content-class="w3-tooltip elevation-1"
                  :text="PARTIAL_REPORT_HINT"
                >
                  <template v-slot:activator="{ props }">
                    <v-chip v-bind="props" size="x-small" color="warning" variant="tonal">
                      {{ row.reporters.length }} of {{ row.playersTotal }} players
                    </v-chip>
                  </template>
                </v-tooltip>
                <span v-else class="text-medium-emphasis text-caption">
                  ({{ row.reporters.length }} of {{ row.playersTotal }} players)
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { LagReportPlayer } from "@/store/admin/lagReports/types";
import {
  earliestHostStallReport,
  formatStallDuration,
  groupHostStalls,
  hostStallOutcome,
  summarizeHostStalls,
} from "@/components/admin/lag-reports/hostStalls";
import { mdiInformationOutline, mdiServerNetworkOff } from "@mdi/js";

const PARTIAL_REPORT_HINT = "Only flo clients on 0.18.4 or newer are sent this packet, so a mixed-version "
  + "roster reports fewer clients than the game had players. The stall still hit everyone.";

export default defineComponent({
  name: "LagReportHostStalls",
  props: {
    players: { type: Array as PropType<LagReportPlayer[]>, required: true },
    playerColors: { type: Array as PropType<string[]>, required: true },
    serverNodeName: { type: String, required: true },
  },
  setup(props) {
    function playerName(battleTag: string): string {
      return battleTag.split("#")[0];
    }

    function formatDate(iso: string): string {
      if (!iso) return "";
      return new Date(iso).toLocaleString();
    }

    // Every reporter's timestamp is that client's own clock, not the node's, so the
    // hover text lists each of them by name rather than implying one shared instant.
    function reportedAtHint(reporters: { battleTag: string; timestamp: string }[]): string {
      return reporters
        .slice()
        .sort((a, b) => (Date.parse(a.timestamp) || 0) - (Date.parse(b.timestamp) || 0))
        .map((reporter) => `${playerName(reporter.battleTag)}: ${formatDate(reporter.timestamp)}`)
        .join(" · ");
    }

    const rows = computed(() =>
      groupHostStalls(props.players).map((group) => ({
        ...group,
        outcome: hostStallOutcome(group.stall.outcome),
        earliestTimestamp: earliestHostStallReport(group.reporters),
        reportedAtHint: reportedAtHint(group.reporters),
      }))
    );

    const summary = computed(() => summarizeHostStalls(rows.value));

    function formatGameTime(ms: number): string {
      const totalSec = Math.floor(ms / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${min}:${sec.toString().padStart(2, "0")}`;
    }

    return {
      rows,
      summary,
      playerName,
      formatDate,
      formatGameTime,
      formatStallDuration,
      PARTIAL_REPORT_HINT,
      mdiInformationOutline,
      mdiServerNetworkOff,
    };
  },
});
</script>
