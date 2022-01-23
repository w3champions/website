<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            <span>{{ $t("views_statistics.w3cstats") }}</span>
          </v-card-title>
          <v-tabs>
            <v-tabs-slider/>
            <v-tab class="profileTab" exact :to="{name: 'OverallStatisticsPlayerActivity'}">
              {{ $t("views_statistics.playeractivity") }}
            </v-tab>
            <v-tab class="profileTab" :to="{name: 'OverallStatisticsDistribution'}">
              {{ $t("views_statistics.mmr") }}
            </v-tab>
            <v-tab class="profileTab" :to="{name: 'OverallStatisticsWinrates'}">
              {{ $t("views_statistics.wrs") }}
            </v-tab>
            <v-tab class="profileTab" :to="{name: 'OverallStatisticsHeroesWinrates'}">
              {{ $t("views_statistics.heroes") }}
            </v-tab>
          </v-tabs>
          <v-card-text>
            <keep-alive>
              <router-view></router-view>
            </keep-alive>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import AmountPerDayChart from "@/components/overall-statistics/AmountPerDayChart.vue";
import Vue from "vue";
import {Component} from "vue-property-decorator";
import GameLengthChart from "@/components/overall-statistics/GameLengthChart.vue";
import PopularGameTimeChart from "@/components/overall-statistics/PopularGameTimeChart.vue";
import PlayedHeroesChart from "@/components/overall-statistics/PlayedHeroesChart.vue";
import HeroWinrate from "@/components/overall-statistics/HeroWinrate.vue";
import PlayerStatsRaceVersusRaceOnMapTableCell from "@/components/player/PlayerStatsRaceVersusRaceOnMapTableCell.vue";
import MmrDistributionChart from "@/components/overall-statistics/MmrDistributionChart.vue";
import {SeasonGameModeGateWayForMMR} from "@/store/overallStats/types";
import {Season} from "@/store/ranking/types";

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
  get seasons(): Season[] {
    return this.$store.direct.state.rankings.seasons;
  }

  get verifiedBtag(): string {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }

  mounted(): void {
    this.init();
  }

  private async init() {
    await this.$store.direct.dispatch.overallStatistics.loadGamesPerDayStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadMapsPerSeason();
    await this.$store.direct.dispatch.overallStatistics.loadPlayersPerDayStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadGameLengthStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadpopularGameHours();
    await this.$store.direct.dispatch.overallStatistics.loadMapAndRaceStatistics();
    if (this.verifiedBtag) {
      await this.$store.direct.dispatch.player.loadProfile({
        battleTag: this.verifiedBtag,
        freshLogin: false,
      });
    }
    const mMRDistributionPayload: SeasonGameModeGateWayForMMR = {
      season: this.$store.direct.state.rankings.selectedSeason.id,
      gameMode: this.$store.direct.state.matches.gameMode,
      gateWay: this.$store.direct.state.gateway,
    };
    await this.$store.direct.dispatch.overallStatistics.loadMmrDistribution(
        mMRDistributionPayload
    );
  }
}
</script>
