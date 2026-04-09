<template>
  <v-expansion-panel value="events">
    <v-expansion-panel-title>
      <strong>Event-Triggered Data</strong>
      <span class="text-medium-emphasis text-caption ml-2">All-server baselines and burst measurements</span>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <!-- All-server baseline table (expandable rows) -->
      <template v-for="(player, pi) in players" :key="'baseline-' + pi">
        <div v-if="player.diagnostics.allServerBaselines.length" class="mb-4">
          <div class="text-overline text-medium-emphasis mb-2">
            All-Server Baselines — {{ playerName(player.battleTag) }}
            ({{ player.diagnostics.allServerBaselines.length }} measurements)
          </div>
          <v-table density="compact">
            <thead>
              <tr>
                <th></th>
                <th>Time</th>
                <th>Server</th>
                <th>Target</th>
                <th class="text-center">Hops</th>
                <th class="text-center">Final Avg</th>
                <th class="text-center">Final Loss</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(bl, bi) in player.diagnostics.allServerBaselines" :key="'bl-' + bi">
                <tr
                  style="cursor: pointer;"
                  @click="toggleBaseline(pi, bi)"
                >
                  <td style="width: 30px;">
                    <v-icon size="small">{{ expandedBaselines[pi + '-' + bi] ? mdiChevronDown : mdiChevronRight }}</v-icon>
                  </td>
                  <td class="text-caption">{{ formatDate(bl.timestamp) }}</td>
                  <td>{{ bl.serverName }}</td>
                  <td class="text-caption">{{ bl.target }}</td>
                  <td class="text-center">{{ bl.hops.length }}</td>
                  <td class="text-center">{{ lastHopAvg(bl.hops) }}</td>
                  <td class="text-center" :class="lastHopLoss(bl.hops) > 0 ? 'text-warning' : ''">
                    {{ lastHopLoss(bl.hops).toFixed(1) }}%
                  </td>
                </tr>
                <tr v-if="expandedBaselines[pi + '-' + bi]">
                  <td colspan="7" class="pa-0">
                    <div class="pa-3" style="background: rgba(0,0,0,0.03);">
                      <mtr-hop-table :hops="bl.hops" />
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </v-table>
        </div>
      </template>

      <!-- Connection events -->
      <template v-for="(player, pi) in players" :key="'conn-' + pi">
        <div v-if="player.diagnostics.connectionEvents.length" class="mb-4">
          <div class="text-overline text-medium-emphasis mb-2">
            Connection Events — {{ playerName(player.battleTag) }}
          </div>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Time</th>
                <th>Game Time</th>
                <th>Event</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ce, ci) in player.diagnostics.connectionEvents" :key="'ce-' + ci">
                <td class="text-caption">{{ formatDate(ce.timestamp) }}</td>
                <td>{{ formatGameTime(ce.gameTimeOffsetMs) }}</td>
                <td>
                  <v-chip :color="[EConnectionEventType.Reconnect, EConnectionEventType.GamePaused, EConnectionEventType.StartLag].includes(ce.eventType) ? 'warning' : [EConnectionEventType.GameResumed, EConnectionEventType.StopLag].includes(ce.eventType) ? 'info' : 'error'" size="x-small" variant="flat">
                    {{ connectionEventLabel(ce.eventType) }}
                  </v-chip>
                </td>
                <td>{{ ce.durationMs != null ? (ce.durationMs / 1000).toFixed(1) + 's' : '—' }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </template>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive } from "vue";
import { EConnectionEventType, HopData, LagReportPlayer } from "@/store/admin/lagReports/types";
import { mdiChevronDown, mdiChevronRight } from "@mdi/js";
import MtrHopTable from "@/components/admin/MtrHopTable.vue";

export default defineComponent({
  name: "LagReportEventData",
  components: { MtrHopTable },
  props: {
    players: { type: Array as PropType<LagReportPlayer[]>, required: true },
  },
  setup() {
    const expandedBaselines = reactive<Record<string, boolean>>({});

    const connectionEventLabelMap: Record<string, string> = {
      [EConnectionEventType.Reconnect]: "Reconnected",
      [EConnectionEventType.FailureDisconnect]: "Disconnected",
      [EConnectionEventType.GameCrashed]: "Game crashed",
      [EConnectionEventType.GamePaused]: "Game paused",
      [EConnectionEventType.GameResumed]: "Game resumed",
      [EConnectionEventType.StartLag]: "Lag detected",
      [EConnectionEventType.StopLag]: "Lag resolved",
    };

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

    function connectionEventLabel(eventType: string): string {
      return connectionEventLabelMap[eventType] ?? eventType;
    }

    function lastHopAvg(hops: HopData[]): string {
      if (!hops.length) return "—";
      const last = hops[hops.length - 1];
      return last.avgRttMs != null ? Math.round(last.avgRttMs) + "ms" : "—";
    }

    function lastHopLoss(hops: HopData[]): number {
      if (!hops.length) return 0;
      return hops[hops.length - 1].lossPercent;
    }

    function toggleBaseline(pi: number, bi: number) {
      const key = pi + "-" + bi;
      expandedBaselines[key] = !expandedBaselines[key];
    }

    return {
      expandedBaselines,
      playerName,
      formatDate,
      formatGameTime,
      connectionEventLabel,
      lastHopAvg,
      lastHopLoss,
      toggleBaseline,
      EConnectionEventType,
      mdiChevronDown,
      mdiChevronRight,
    };
  },
});
</script>
