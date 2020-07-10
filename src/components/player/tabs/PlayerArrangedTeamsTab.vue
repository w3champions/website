<template>
  <div>
    <v-card-title>Teams</v-card-title>
    <br />
    <v-card-text>
      <v-row>
        <v-col
          cols="12"
          md="3"
          v-for="atPartner in gameModeStatsAt"
          :key="atPartner.id"
        >
          <player-league :mode-stat="atPartner" :show-at-partner="true" />
          <br />
        </v-col>
      </v-row>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import PlayerLeague from "@/components/player/PlayerLeague.vue";
import { EGameMode } from "@/store/typings";

@Component({
  components: { PlayerLeague },
})
export default class PlayerArrangedTeamsTab extends Vue {
  get gameModeStats() {
    return this.$store.direct.state.player.gameModeStats;
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
