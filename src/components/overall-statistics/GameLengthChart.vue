<template>
  <bar-chart :chart-data="gameHourChartData" />
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";

import { GameLength } from "@/store/overallStats/types";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { ChartData } from "chart.js";
import Vue from "vue";
import { formatSecondsToDuration } from "@/helpers/date-functions";

@Component({
  components: { BarChart },
})
export default class GameLengthChart extends Vue {
  @Prop() public gameLength!: GameLength;

  get trimmedStats() {
    const stats = this.gameLength.lengths.slice(4); // Do not display games lasting less than 2 minutes.
    stats.pop(); // Do not display the last entry, because all games longer than the last timeslot are accumulated here.
    return stats;
  }

  get passedTime(): string[] {
    return this.trimmedStats.map((g) => formatSecondsToDuration(g.seconds));
  }

  get gamesCount() {
    return this.trimmedStats.map((g) => g.games);
  }

  get gameHourChartData(): ChartData {
    return {
      labels: this.passedTime,
      datasets: [
        {
          label: String(
            this.$t(
              "components_overall-statistics_gamelengthchart.amountofgames"
            )
          ),
          data: this.gamesCount,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  }
}
</script>
