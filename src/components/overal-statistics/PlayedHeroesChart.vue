<template>
  <bar-chart :chart-data="gameHourChartData" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";

import { PlayedHero } from "@/store/overallStats/types";
import BarChart from "@/components/overal-statistics/BarChart.vue";
import { ChartData } from "chart.js";
import Vue from "vue";

@Component({
  components: { BarChart },
})
export default class PlayedHeroesChart extends Vue {
  @Prop() public playedHeroes!: PlayedHero[];

  get orderedHeroes(): PlayedHero[] {
    return this.playedHeroes
      .map((h) => ({
        icon: this.$t("heroNames." + h.icon).toString(),
        count: h.count,
      }))
      .sort(this.compare);
  }

  private compare(a: PlayedHero, b: PlayedHero) {
    if (a.icon < b.icon) {
      return -1;
    }
    return 1;
  }

  get gameHourChartData(): ChartData {
    return {
      labels: this.orderedHeroes.map((p) => p.icon),
      datasets: [
        {
          label: String(
            this.$t(
              "components_overall-statistics_playedheroeschart.playedheroes"
            )
          ),
          data: this.orderedHeroes.map((p) => p.count),
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  }
}
</script>
