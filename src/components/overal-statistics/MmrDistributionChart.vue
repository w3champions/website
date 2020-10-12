<template>
  <bar-chart :chart-data="gameHourChartData" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";

import { MmrDistribution } from "@/store/overallStats/types";
import { ChartData } from "chart.js";
import Vue from "vue";
import BarChart from "@/components/overal-statistics/BarChart.vue";
import { EGameMode } from "@/store/typings";
import { Season } from "@/store/ranking/types";
import { reverse } from 'lodash';

@Component({
  components: { BarChart },
})
export default class MmrDistributionChart extends Vue {
  @Prop() public mmrDistribution!: MmrDistribution;
  @Prop() public selectedSeason!: Season;
  @Prop() public reverseX!: boolean

  private colors() {
    const colors = [];
    for (let i = 0; i < this.mmrDistribution.distributedMmrs.length; i++) {
      if (this.isYou(i)) {
        colors.push("rgb(28,95,47, 0.7)");
      } else if (
        i === this.mmrDistribution.top2PercentIndex ||
        i === this.mmrDistribution.top5PercentIndex ||
        i === this.mmrDistribution.top10PercentIndex ||
        i === this.mmrDistribution.top25ercentIndex ||
        i === this.mmrDistribution.top50PercentIndex
      ) {
        colors.push("rgb(66,23,63, 0.7)");
      } else {
        colors.push("rgba(54, 162, 235, 0.2)");
      }
    }
    return colors;
  }

  get mmrOfLoggedInPlayer() {
    if (!this.gameModeStats) return 0;

    return (
      this.gameModeStats.filter(
        (g) =>
          g.gameMode === EGameMode.GM_1ON1 &&
          g.season === this.selectedSeason?.id
      )[0]?.mmr ?? 0
    );
  }

  get gameModeStats() {
    return this.$store.direct.state.player.gameModeStats;
  }

  public isYou(index: number) {
    return (
      Math.abs(
        this.mmrDistribution.distributedMmrs[index].mmr +
          25 -
          this.mmrOfLoggedInPlayer
      ) < 12
    );
  }

  get gameHourChartData(): ChartData {
    if (!this.mmrDistribution.distributedMmrs) {
      return {};
    }

    return {
      labels: this.mmrDistribution.distributedMmrs.map((d) => `> ${d.mmr}`),
      datasets: [
        {
          label: "mmr",
          data: this.mmrDistribution.distributedMmrs.map((d) => d.count),
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          backgroundColor: this.colors,
        },
      ],
    };
  }
}
</script>
