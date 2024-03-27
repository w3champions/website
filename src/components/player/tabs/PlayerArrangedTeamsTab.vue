<template>
  <div v-if="gameModeStatsAt && gameModeStatsAt.length > 0">
    <v-card-title>
      {{ $t("components_player_tabs_playerarrangedteamtab.title") }}
    </v-card-title>
    <br />

    <v-card-text>
      <v-row>
        <v-col
          class="mb-10"
          cols="12"
          md="3"
          v-for="atPartner in gameModeStatsAt"
          :key="atPartner.id"
        >
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
import { Component, Vue } from "vue-facing-decorator";
import PlayerLeague from "@/components/player/PlayerLeague.vue";
import { EGameMode } from "@/store/types";
import { usePlayerStore } from "@/store/player/store";

@Component({
  components: { PlayerLeague },
})
export default class PlayerArrangedTeamsTab extends Vue {
  private player = usePlayerStore();

  get gameModeStats() {
    return this.player.gameModeStats;
  }

  get gameModeStatsAt() {
    const atStats = this.gameModeStats.filter(
      (m) => m.gameMode === EGameMode.GM_2ON2_AT && m.rank !== 0
    );

    const atStatsUnranked = this.gameModeStats.filter(
      (m) => m.gameMode === EGameMode.GM_2ON2_AT && m.rank === 0
    );

    return [
      ...atStats.sort(
        (a, b) => a.leagueId * 1000 + a.rank - (b.leagueId * 1000 + b.rank)
      ),
      ...atStatsUnranked,
    ];
  }
}
</script>
