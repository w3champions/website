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
            <v-tab class="profileTab" :href="`#tab-1`">Games Per Day</v-tab>
            <v-tab-item :value="'tab-1'">
              <v-card-text v-if="!loadingGamesPerDayStats">
                <players-per-day-chart class="player-per-day-chart" :game-days="gameDays" />
              </v-card-text>
            </v-tab-item>
          </v-tabs>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import PlayersPerDayChart from "@/components/PlayersPerDayChart.vue";
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { GameDay } from "@/store/overallStats/types";

@Component({
  components: { PlayersPerDayChart }
})
export default class OverallStatisticsView extends Vue {
  get loadingGamesPerDayStats(): boolean {
    return this.$store.direct.state.overallStatistics.loadingGamesPerDayStats;
  }

  get gameDays(): GameDay[] {
    return this.$store.direct.state.overallStatistics.games;
  }

  mounted() {
    this.init();
  }

  private async init() {
    await this.$store.direct.dispatch.overallStatistics.loadStatistics();
  }
}
</script>

<style type="text/css">
.player-per-day-chart {
  height: 650px;
}
</style>
