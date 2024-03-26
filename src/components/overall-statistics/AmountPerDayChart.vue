<template>
  <line-chart :chart-data="chartData" />
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-facing-decorator";
import { GameDay } from "@/store/overallStats/types";
import LineChart from "@/components/overall-statistics/LineChart.vue";
import { ChartData } from "chart.js";
import { parseJSON } from "date-fns";

@Component({
  components: { LineChart },
})
export default class AmountPerDayChart extends Vue {
  @Prop() public gameDays!: GameDay[];

  get gameDayDates(): Date[] {
    return this.gameDays.map((g) => parseJSON(g.date));
  }

  get gameDayCounts(): number[] {
    return this.gameDays.map((g) => g.gamesPlayed);
  }

  get chartData(): ChartData {
    return {
      labels: this.gameDayDates,
      datasets: [
        {
          label: this.$t("components_overall-statistics_tabs_playeractivitytab.playersperday").toString(),
          data: this.gameDayCounts,
          fill: true,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1.5,
          tension: 0.4, // Smooth line.
        },
      ],
    };
  }
}
</script>
