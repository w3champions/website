<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            <span>{{ $t("views_statistics.w3cstats") }}</span>
          </v-card-title>
          <v-tabs>
            <v-tabs-slider />
            <v-tab
              class="profileTab"
              exact
              :to="{ name: 'OverallStatisticsPlayerActivity' }"
            >
              {{ $t("views_statistics.playeractivity") }}
            </v-tab>
            <v-tab
              class="profileTab"
              :to="{ name: 'OverallStatisticsDistribution' }"
            >
              {{ $t("views_statistics.mmr") }}
            </v-tab>
            <v-tab
              class="profileTab"
              :to="{ name: 'OverallStatisticsWinrates' }"
            >
              {{ $t("views_statistics.wrs") }}
            </v-tab>
            <v-tab
              class="profileTab"
              :to="{ name: 'OverallStatisticsHeroesWinrates' }"
            >
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
import { Component } from "vue-property-decorator";
import GameLengthChart from "@/components/overall-statistics/GameLengthChart.vue";
import PopularGameTimeChart from "@/components/overall-statistics/PopularGameTimeChart.vue";
import PlayedHeroesChart from "@/components/overall-statistics/PlayedHeroesChart.vue";
import HeroWinrate from "@/components/overall-statistics/HeroWinrate.vue";
import MmrDistributionChart from "@/components/overall-statistics/MmrDistributionChart.vue";
import { Season } from "@/store/ranking/types";
import { useOauthStore } from "@/store/oauth/store";
import { useOverallStatsStore } from "@/store/overallStats/store";
import { usePlayerStore } from "@/store/player/store";
import { useRankingStore } from "@/store/ranking/store";

@Component({
  components: {
    MmrDistributionChart,
    HeroWinrate,
    PlayedHeroesChart,
    PopularGameTimeChart,
    AmountPerDayChart,
    GameLengthChart,
  },
})
export default class OverallStatisticsView extends Vue {
  private oauthStore = useOauthStore();
  private overallStatsStore = useOverallStatsStore();
  private player = usePlayerStore();
  private rankingsStore = useRankingStore();

  get seasons(): Season[] {
    return this.rankingsStore.seasons;
  }

  get verifiedBtag(): string {
    return this.oauthStore.blizzardVerifiedBtag;
  }

  mounted(): void {
    this.init();
  }

  private async init() {
    await this.overallStatsStore.loadGamesPerDayStatistics();
    await this.overallStatsStore.loadMapsPerSeason();
    await this.overallStatsStore.loadPlayersPerDayStatistics();
    await this.overallStatsStore.loadGameLengthStatistics();
    await this.overallStatsStore.loadPopularGameHours();
    await this.overallStatsStore.loadMapAndRaceStatistics();
    if (this.verifiedBtag) {
      await this.player.loadProfile({
        battleTag: this.verifiedBtag,
        freshLogin: false,
      });
    }
  }
}
</script>
