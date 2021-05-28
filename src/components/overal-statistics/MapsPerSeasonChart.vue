<template>
  <bar-chart :chart-data="barChartData" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";

import { ChartData } from "chart.js";
import BarChart from "@/components/overal-statistics/BarChart.vue";
import Vue from "vue";
import { MapCount } from "@/store/overallStats/types";

@Component({
  components: { BarChart },
})
export default class MapsPerSeasonChart extends Vue {
  @Prop() public mapsPerSeason!: MapCount[];

  get mapNames() {
    return this.mapsPerSeason.map((m) =>
      this.$t(`mapNames.${m.map}`).toString()
    );
  }

  get gamesCount() {
    return this.mapsPerSeason.map((m) => m.count);
  }

  get barChartData(): ChartData {
    return {
      labels: this.mapNames,
      datasets: [
        {
          label: String(
            this.$t(
              "components_overall-statistics_mapsperseasonchart.playedmaps"
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
