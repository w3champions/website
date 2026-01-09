<template>
  <div class="player-ping-summary">
    <v-row class="mb-2" align="center">
      <v-col cols="12" md="6">
        <div>
          <strong>{{ $t("components_player_ping.player_avg") }}:</strong>
          <span>{{ playerLabel }}</span>
        </div>
      </v-col>
      <v-col cols="12" md="6">
        <div>
          <strong>{{ $t("components_player_ping.opponents_avg") }}:</strong>
          <span>{{ opponentsLabel }}</span>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <small class="text--secondary">{{ $t("components_player_ping.offset_note", { size: pageSize }) }}</small>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useI18n } from "vue-i18n";
import { Match, PlayerServerInfo } from "@/store/types";

export default defineComponent({
  name: "PlayerPingSummary",
  props: {
    matches: {
      type: Object as () => Match[] | any,
      required: true,
    },
    battleTag: {
      type: String,
      required: true,
    },
    // optional pageSize in case it differs from default 50
    pageSize: {
      type: Number,
      required: false,
      default: 50,
    },
  },
  setup(props) {
    function extractPingForMatch(match: Match, tag: string): number | null {
      if (!match.serverInfo || !match.serverInfo.playerServerInfos) return null;
      const psi: PlayerServerInfo | undefined = match.serverInfo.playerServerInfos.find((p) => p.battleTag === tag);
      if (!psi) return null;
      // prefer averagePing if present else currentPing
      return Number.isFinite(psi.averagePing) && psi.averagePing > 0 ? psi.averagePing : psi.currentPing ?? null;
    }

    // Ensure we operate on a plain array even if `matches` was passed as a ref or (accidentally) as a Promise
    const matchesArr = computed<Match[]>(() => {
      const raw: any = props.matches as any;
      if (!raw) return [];
      // Promise -> return empty until resolved
      if (typeof raw.then === "function") return [];
      // Ref with `.value`
      if (raw && Object.prototype.hasOwnProperty.call(raw, "value")) {
        return Array.isArray(raw.value) ? raw.value : [];
      }
      // Plain array
      if (Array.isArray(raw)) return raw;
      return [];
    });

    const playerAvg = computed<number | null>(() => {
      const arr = matchesArr.value;
      if (!arr || arr.length === 0) return null;
      const pings: number[] = [];
      for (let i = 0; i < Math.min(arr.length, props.pageSize); i++) {
        const m = arr[i];
        const ping = extractPingForMatch(m, props.battleTag);
        if (ping != null && Number.isFinite(ping)) pings.push(ping);
      }
      if (pings.length === 0) return null;
      const sum = pings.reduce((a, b) => a + b, 0);
      return Math.round(sum / pings.length);
    });

    const opponentsAvg = computed<number | null>(() => {
      const arr = matchesArr.value;
      if (!arr || arr.length === 0) return null;
      const pings: number[] = [];
      for (let i = 0; i < Math.min(arr.length, props.pageSize); i++) {
        const m = arr[i];
        if (!m.serverInfo || !m.serverInfo.playerServerInfos) continue;

        // find pings for players on opponent teams
        for (const psi of m.serverInfo.playerServerInfos) {
          if (psi.battleTag === props.battleTag) continue;
          const ping = Number.isFinite(psi.averagePing) && psi.averagePing > 0 ? psi.averagePing : psi.currentPing ?? null;
          if (ping != null && Number.isFinite(ping)) pings.push(ping);
        }
      }
      if (pings.length === 0) return null;
      const sum = pings.reduce((a, b) => a + b, 0);
      return Math.round(sum / pings.length);
    });

    const { t } = useI18n();

    const playerLabel = computed<string>(() => {
      const val = playerAvg.value;
      if (val === null) return t("components_player_ping.no_data");
      if (typeof val === "object") {
        // defensive logging to console to help debugging
        // eslint-disable-next-line no-console
        console.warn("PlayerPingSummary: playerAvg is not a primitive:", val);
      }
      return `${val} ms`;
    });

    const opponentsLabel = computed<string>(() => {
      const val = opponentsAvg.value;
      if (val === null) return t("components_player_ping.no_data");
      if (typeof val === "object") {
        // eslint-disable-next-line no-console
        console.warn("PlayerPingSummary: opponentsAvg is not a primitive:", val);
      }
      return `${val} ms`;
    });

    return {
      playerAvg,
      opponentsAvg,
      playerLabel,
      opponentsLabel,
    };
  },
});
</script>

<style scoped>
.player-ping-summary {
  font-size: 0.95rem;
  padding: 8px 0;
}

:deep(.player-ping-summary strong) {
  font-weight: 600;
}
</style>
