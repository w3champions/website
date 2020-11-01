<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            <span>Statistics of W3Champions</span>
          </v-card-title>
          <v-tabs>
            <v-tabs-slider />
            <v-tab class="profileTab" :to="`/OverallStatistics/`">
              Player Activity
            </v-tab>
            <v-tab
              class="profileTab"
              :to="`/OverallStatistics/mmr-distribution`"
            >
              MMR
            </v-tab>
            <v-tab
              class="profileTab"
              :to="`/OverallStatistics/winrates-per-race-and-map`"
            >
              Winrates
            </v-tab>
            <v-tab
              class="profileTab"
              :to="`/OverallStatistics/heroes-winrates`"
            >
              Heroes
            </v-tab>
          </v-tabs>
          <router-view></router-view>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import AmountPerDayChart from "@/components/overal-statistics/AmountPerDayChart.vue";
import Vue from "vue";
import { Component } from "vue-property-decorator";
import GameLengthChart from "@/components/overal-statistics/GameLengthChart.vue";
import PopularGameTimeChart from "@/components/overal-statistics/PopularGameTimeChart.vue";
import PlayedHeroesChart from "@/components/overal-statistics/PlayedHeroesChart.vue";
import HeroWinrate from "@/components/overal-statistics/HeroWinrate.vue";
import PlayerStatsRaceVersusRaceOnMapTableCell from "@/components/player/PlayerStatsRaceVersusRaceOnMapTableCell.vue";
import MmrDistributionChart from "@/components/overal-statistics/MmrDistributionChart.vue";
import { SeasonGameModeGateWayForMMR } from '@/store/overallStats/types';

@Component({
  components: {
    MmrDistributionChart,
    HeroWinrate,
    PlayedHeroesChart,
    PopularGameTimeChart,
    AmountPerDayChart,
    GameLengthChart,
    PlayerStatsRaceVersusRaceOnMapTableCell,
  },
})
export default class OverallStatisticsView extends Vue {
  get seasons() {
    return this.$store.direct.state.rankings.seasons;
  }

  get verifiedBtag() {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }

  mounted() {
    this.init();
  }

  private async init() {
    await this.$store.direct.dispatch.overallStatistics.loadGamesPerDayStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadMapsPerSeason();
    await this.$store.direct.dispatch.overallStatistics.loadPlayersPerDayStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadMapAndRaceStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadGameLengthStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadpopularGameHours();
    await this.$store.direct.dispatch.overallStatistics.loadPlayedHeroes();
    if (this.verifiedBtag) {
      await this.$store.direct.dispatch.player.loadProfile(this.verifiedBtag);
    }
    const mMRDistributionPayload: SeasonGameModeGateWayForMMR ={season:  this.$store.direct.state.rankings.selectedSeason.id,
                                                                gameMode: this.$store.direct.state.matches.gameMode,
                                                                gateWay: this.$store.direct.state.gateway};
    await this.$store.direct.dispatch.overallStatistics.loadMmrDistribution(
      mMRDistributionPayload
    );
  }
}
</script>
