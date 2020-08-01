<template>
  <bar-chart :chart-data="barChartData" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";

import { MatchesOnMap, PopularGameHour } from "@/store/overallStats/types";
import { ChartData } from "chart.js";
import moment from "moment";
import BarChart from "@/components/overal-statistics/BarChart.vue";
import Vue from "vue";

@Component({
  components: { BarChart },
})
export default class MapsPerSeasonChart extends Vue {
  @Prop() public mapsPerSeason!: MatchesOnMap[];

  get mapNames() {
    return this.mapsPerSeason.map(m => m.map);
  }

  get gamesCount() {
    return this.mapsPerSeason.map(m => m.gamesOnModes[0].count);
  }

  get barChartData(): ChartData {
    return {
      labels: this.mapNames,
      datasets: [
        {
          label: "played maps",
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
