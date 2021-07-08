<template>
  <bar-chart :chart-data="gameHourChartData" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";

import { GameLength } from "@/store/overallStats/types";
import moment from "moment";
import BarChart from "@/components/overal-statistics/BarChart.vue";
import { ChartData } from "chart.js";
import Vue from "vue";

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

  get passedTime() {
    return this.getTrimmedTimes().map((g) =>
      moment
        .utc(moment.duration(g.passedTimeInSeconds, "seconds").asMilliseconds())
        .format("mm:ss")
    );
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
