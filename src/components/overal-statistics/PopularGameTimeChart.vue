<template>
  <bar-chart :chart-data="gameHourChartData" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";

import { PopularGameHour } from "@/store/overallStats/types";
import { ChartData } from "chart.js";
import moment from "moment";
import BarChart from "@/components/overal-statistics/BarChart.vue";
import Vue from "vue";

@Component({
  components: { BarChart },
})
export default class PopularGameTimeChart extends Vue {
  @Prop() public popularGameHour!: PopularGameHour;

  getTrimmedTimes() {
    const gameHour = this.popularGameHour;
    if (!gameHour) return [];

    const times = gameHour?.playTimePerHour.slice(4);
    times.pop();
    return times;
  }

  get passedTime() {
    return this.getTrimmedTimes().map((g) =>
      moment
        .utc(
          moment
            .duration(g.hours, "hours")
            .add(moment.duration(g.minutes, "minutes"))
            .asMilliseconds()
        )
        .format("HH:mm")
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
              "components_overall-statistics_populargametimechart.accgameslast2weeks"
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
