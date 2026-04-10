<template>
  <v-expansion-panel value="raw">
    <v-expansion-panel-title>
      <strong>All Raw MTR Measurements</strong>
      <span class="text-medium-emphasis text-caption ml-2">
        <template v-for="(player, pi) in players" :key="'rawcount-' + pi">
          {{ playerName(player.battleTag) }}: {{ player.diagnostics.targetMtr.length }} fwd + {{ player.diagnostics.reverseMtr.length }} rev
          <span v-if="pi < players.length - 1">&nbsp;|&nbsp;</span>
        </template>
      </span>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <template v-for="(player, pi) in players" :key="'raw-' + pi">
        <div class="mb-4">
          <div class="text-overline text-medium-emphasis mb-2">
            <v-icon :color="playerColors[pi]" size="x-small">{{ mdiCircle }}</v-icon>
            {{ playerName(player.battleTag) }} — Forward MTR ({{ player.diagnostics.targetMtr.length }})
          </div>
          <v-expansion-panels variant="accordion">
            <v-expansion-panel
              v-for="(trace, ti) in player.diagnostics.targetMtr"
              :key="'fwd-' + ti"
            >
              <v-expansion-panel-title class="text-caption">
                {{ formatDate(trace.timestamp) }} → {{ trace.target }} ({{ trace.hops.length }} hops, final {{ lastHopAvg(trace.hops) }})
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <mtr-hop-table :hops="trace.hops" />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
        <div v-if="player.diagnostics.reverseMtr.length" class="mb-4">
          <div class="text-overline text-medium-emphasis mb-2">
            <v-icon :color="playerColors[pi]" size="x-small">{{ mdiCircle }}</v-icon>
            {{ playerName(player.battleTag) }} — Reverse MTR ({{ player.diagnostics.reverseMtr.length }})
          </div>
          <v-expansion-panels variant="accordion">
            <v-expansion-panel
              v-for="(trace, ti) in player.diagnostics.reverseMtr"
              :key="'rev-' + ti"
            >
              <v-expansion-panel-title class="text-caption">
                {{ formatDate(trace.timestamp) }} → {{ trace.target }} ({{ trace.hops.length }} hops, final {{ lastHopAvg(trace.hops) }})
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <mtr-hop-table :hops="trace.hops" />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </template>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { HopData, LagReportPlayer } from "@/store/admin/lagReports/types";
import { mdiCircle } from "@mdi/js";
import MtrHopTable from "@/components/admin/MtrHopTable.vue";

export default defineComponent({
  name: "LagReportRawData",
  components: { MtrHopTable },
  props: {
    players: { type: Array as PropType<LagReportPlayer[]>, required: true },
    playerColors: { type: Array as PropType<string[]>, required: true },
  },
  setup() {
    function playerName(battleTag: string): string {
      return battleTag.split("#")[0];
    }

    function formatDate(iso: string): string {
      if (!iso) return "";
      return new Date(iso).toLocaleString();
    }

    function lastHopAvg(hops: HopData[]): string {
      if (!hops.length) return "—";
      const last = hops[hops.length - 1];
      return last.avgRttMs != null ? Math.round(last.avgRttMs) + "ms" : "—";
    }

    return {
      playerName,
      formatDate,
      lastHopAvg,
      mdiCircle,
    };
  },
});
</script>
