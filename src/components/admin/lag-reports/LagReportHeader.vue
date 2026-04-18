<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-text class="py-3">
      <div class="d-flex flex-wrap ga-4 align-center mb-2">
        <div><span class="text-medium-emphasis">Map:</span> <strong>{{ report.mapPath }}</strong></div>
        <div><span class="text-medium-emphasis">Server:</span> <strong class="text-info">{{ report.serverNodeName }}</strong></div>
        <div><span class="text-medium-emphasis">Game:</span> <strong>{{ report.gameName }}</strong></div>
        <div><span class="text-medium-emphasis">Flo ID:</span> <strong>{{ report.floGameId }}</strong></div>
        <div><span class="text-medium-emphasis">Created:</span> <strong>{{ formatDate(report.createdAt) }}</strong></div>
        <div>
          <span class="text-medium-emphasis">Report ID:</span>
          <code class="text-caption ml-1">{{ report.id }}</code>
        </div>
      </div>
      <div class="d-flex flex-wrap ga-2 align-center">
        <span class="text-medium-emphasis text-caption">Events:</span>
        <template v-for="(player, pi) in report.players" :key="'ev-' + pi">
          <v-chip
            v-if="player.diagnostics.lagEvents.length"
            size="x-small"
            variant="flat"
            :style="playerLagChipStyle(playerColors[pi])"
          >
            {{ player.diagnostics.lagEvents.length }}x -lag
            <span class="ml-1" :style="{ color: playerColors[pi], fontWeight: 600 }">
              ({{ playerName(player.battleTag) }})
            </span>
          </v-chip>
          <v-chip
            v-for="(ce, ci) in player.diagnostics.connectionEvents"
            :key="'ce-' + pi + '-' + ci"
            size="x-small"
            :color="eventColor(ce.eventType)"
            variant="tonal"
          >
            {{ connectionEventLabel(ce.eventType) }} {{ formatGameTime(ce.gameTimeOffsetMs) }}
            <span class="ml-1" :style="{ color: playerColors[pi], fontWeight: 600 }">
              ({{ playerName(player.battleTag) }})
            </span>
          </v-chip>
        </template>
        <span class="text-medium-emphasis text-caption ml-2">Categories:</span>
        <template v-for="(player, pi) in report.players" :key="'cat-' + pi">
          <v-chip
            v-for="(cat, ci) in player.issueCategories"
            :key="'ic-' + pi + '-' + ci"
            size="x-small"
            color="error"
            variant="tonal"
          >
            {{ cat }}
          </v-chip>
        </template>
      </div>
      <div v-for="(player, pi) in report.players" :key="'ft-' + pi">
        <div v-if="player.freeText" class="text-medium-emphasis text-caption mt-1 font-italic">
          {{ playerName(player.battleTag) }}: "{{ player.freeText }}"
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { EConnectionEventType, LagReportDetail } from "@/store/admin/lagReports/types";
import { playerColorStyle } from "@/helpers/lag-report-colors";

export default defineComponent({
  name: "LagReportHeader",
  props: {
    report: { type: Object as PropType<LagReportDetail>, required: true },
    playerColors: { type: Array as PropType<string[]>, required: true },
  },
  setup() {
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

    function eventColor(eventType: EConnectionEventType): string {
      if ([EConnectionEventType.Reconnect, EConnectionEventType.GamePaused, EConnectionEventType.StartLag].includes(eventType)) {
        return "warning";
      }
      if ([EConnectionEventType.GameResumed, EConnectionEventType.StopLag].includes(eventType)) {
        return "info";
      }
      return "error";
    }

    function playerLagChipStyle(baseColor: string): Record<string, string> {
      const { bgColor, textColor } = playerColorStyle(baseColor);
      return { backgroundColor: bgColor, color: textColor };
    }

    return {
      playerName,
      formatDate,
      formatGameTime,
      connectionEventLabel,
      eventColor,
      playerLagChipStyle,
      EConnectionEventType,
    };
  },
});
</script>
