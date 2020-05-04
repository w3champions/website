<template>
  <bar-chart :chart-data="gameHourChartData" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";

import {PlayedHero} from "@/store/overallStats/types";
import BarChart from "@/components/BarChart.vue";
import { ChartData } from "chart.js";
import Vue from "vue";

@Component({
  components: { BarChart }
})
export default class PlayedHeroesChart extends Vue {
  @Prop() public playedHeroes!: PlayedHero[];

  get gameHourChartData(): ChartData {
    return {
      labels: this.playedHeroes.map(p => p.icon),
      datasets: [
        {
          label: "played heroes",
          data: this.playedHeroes.map(p => p.count),
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1
        }
      ]
    };
  }
}
</script>
