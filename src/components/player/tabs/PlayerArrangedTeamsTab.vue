<template>
  <div v-if="gameModeStatsAt && gameModeStatsAt.length > 0">
    <v-card-title>
      {{ $t("components_player_tabs_playerarrangedteamtab.title") }}
    </v-card-title>
    <br />
    <v-card-text>
      <v-row>
        <v-col class="mb-10" cols="12" md="3" v-for="atPartner in gameModeStatsAt" :key="atPartner.id">
          <player-league :mode-stat="atPartner" :show-at-partner="true" />
        </v-col>
      </v-row>
    </v-card-text>
  </div>
  <div v-else>
    <v-card-text>
      <v-row class="justify-center">
        <v-col class="text-center">
          <v-card-subtitle>This player is not part of a team</v-card-subtitle>
        </v-col>
      </v-row>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import PlayerLeague from "@/components/player/PlayerLeague.vue";
import { usePlayerStore } from "@/store/player/store";
import { ModeStat } from "@/store/player/types";
import { AT_modes } from "@/mixins/GameModesMixin";

export default defineComponent({
  name: "PlayerArrangedTeamsTab",
  components: {
    PlayerLeague,
  },
  setup() {
    const playerStore = usePlayerStore();
    const gameModeStats = computed<ModeStat[]>(() => playerStore.gameModeStats);

    const gameModeStatsAt = computed<ModeStat[]>(() => {
      const atStats = gameModeStats.value.filter(
        (m) => m.rank !== 0 && AT_modes().includes(m.gameMode)
      );

      const atStatsUnranked = gameModeStats.value.filter(
        (m) => m.rank === 0 && AT_modes().includes(m.gameMode)
      );

      return [
        ...atStats.sort(
          (a, b) => a.leagueId * 1000 + a.rank - (b.leagueId * 1000 + b.rank)
        ),
        ...atStatsUnranked,
      ];
    });

    return {
      gameModeStatsAt,
    };
  },
});
</script>
