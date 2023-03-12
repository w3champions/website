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

  getTrimmedTimes() {
    const times = this.gameLength.lengths.slice(4);
    times.pop();
    return times;
  }

  get passedTime(): string[] {
    return this.getTrimmedTimes().map((g) => formatSecondsToDuration(g.passedTimeInSeconds));
  }

  get gamesCount() {
    return this.getTrimmedTimes().map((g) => g.games);
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
