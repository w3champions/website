<template>
  <line-chart :chart-data="gameHourChartData" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { GameDay } from "@/store/overallStats/types";
import moment from "moment";
import LineChart from "@/components/overal-statistics/LineChart.vue";
import Vue from "vue";
import { ChartData } from "chart.js";

@Component({
  components: { LineChart },
})
export default class AmountPerDayChart extends Vue {
  @Prop() public gameDays!: GameDay[];

  get gameDayDates() {
    return this.gameDays.map((g) => moment(g.date).format("LL"));
  }

  get gameDayCounts() {
    return this.gameDays.map((g) => g.gamesPlayed);
  }

  get gameHourChartData(): ChartData {
    return {
      labels: this.gameDayDates,
      datasets: [
        {
          label: String(
            this.$t(
              "components_overall-statistics_tabs_playeractivitytab.playersperday"
            )
          ),
          data: this.gameDayCounts,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  }
}
</script>
