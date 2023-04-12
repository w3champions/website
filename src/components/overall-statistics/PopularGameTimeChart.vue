<template>
  <bar-chart :chart-data="gameHourChartData" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";

import { PopularHours } from "@/store/overallStats/types";
import { ChartData } from "chart.js";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import Vue from "vue";

@Component({
  components: { BarChart },
})
export default class PopularGameTimeChart extends Vue {
  @Prop() public popularGameHours!: PopularHours;

  getTimeslots() {
    return this.popularGameHours ? this.popularGameHours?.timeslots.slice(0) : [];
  }

  get gameStartHour(): string[] {
    return this.getTimeslots().map((g) =>
      g.hours.toString().padStart(2, "0") + ":" + g.minutes.toString().padStart(2, "0")
    );
  }

  get utcTimeOffset(): number {
    const time = new Date();
    const timeOffset = time.getTimezoneOffset() / 60;

    return timeOffset;
  }

  private shiftGameCount(gamesCount: number[]) {
    const numberOfBarsToOffset = this.utcTimeOffset * 4;

    for (let i = 0; i < numberOfBarsToOffset; i++) {
      const firstItem = gamesCount.shift()!;
      gamesCount.push(firstItem);
    }
    return gamesCount;
  }

  get gamesCount() {
    return this.getTimeslots().map((g) => g.games);
  }

  get gameHourChartData(): ChartData {
    return {
      labels: this.gameStartHour,
      datasets: [
        {
          label: String(
            this.$t(
              "components_overall-statistics_populargametimechart.accgameslast2weeks"
            )
          ),
          data: this.shiftGameCount(this.gamesCount),
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  }
}
</script>
