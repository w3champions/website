<template>
  <line-chart :chart-data="gameHourChartData" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { GameDayPerMode } from "@/store/overallStats/types";
import moment from "moment";
import LineChart from "@/components/overal-statistics/LineChart.vue";
import Vue from "vue";
import { ChartData } from "chart.js";

@Component({
  components: { LineChart },
})
export default class AmountPerGatewayPerDayChart extends Vue {
  @Prop() public gameDays!: GameDayPerMode[][];

  get gameDayDates() {
    return this.gameDays[0][0].gameDays.map((g) => moment(g.date).format("LL"));
  }

  get gameHourChartData(): ChartData {
    return {
      labels: this.gameDayDates.splice(0, this.gameDayDates.length - 1),
      datasets: this.gameDays.map((c, index) => {
        return {
          label: this.maIndex(index),
          data: c[0].gameDays.map((g) => g.gamesPlayed),
          backgroundColor: "rgba(126,126,126,0.08)",
          borderColor: this.mapColor(index),
          borderWidth: 1,
        };
      }),
    };
  }

  private mapColor(gameMode: number) {
    switch (gameMode) {
      case 0:
        return "rgba(54, 162, 235, 1)";
      case 1:
        return "rgb(41,128,101)";
      case 2:
        return "rgb(163,54,255)";
    }
  }

  private maIndex(index: number) {
    switch (index) {
      case 0:
        return "Overall";
      case 1:
        return "Europe";
      case 2:
        return "America";
    }
  }
}
</script>
