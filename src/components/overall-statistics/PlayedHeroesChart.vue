<template>
  <bar-chart :chart-data="chartData" :chart-options="chartOptions" />
</template>
<script lang="ts">
import Vue from "vue";
import chain from "lodash/chain";
import map from "lodash/map";
import round from "lodash/round";
import sumBy from "lodash/sumBy";
import { ChartData, ChartOptions } from "chart.js";
import { Component, Prop } from "vue-property-decorator";
import { PlayedHero } from "@/store/overallStats/types";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { HERO_DATA } from "@/store/heroes";
import { ERaceEnum } from "@/store/typings";

type PlayedHeroExtra = PlayedHero & {
  race: ERaceEnum;
  color: string;
};

const FILL_OPACITY = "0.5";
const RACE_COLORS: { [key: string]: string } = {
  [ERaceEnum.RANDOM]: `rgba(66, 62, 64, ${FILL_OPACITY})`,
  [ERaceEnum.HUMAN]: `rgba(54, 162, 235, ${FILL_OPACITY})`,
  [ERaceEnum.ORC]: `rgba(255, 0, 0, ${FILL_OPACITY})`,
  [ERaceEnum.UNDEAD]: `rgba(151, 0, 165, ${FILL_OPACITY})`,
  [ERaceEnum.NIGHT_ELF]: `rgba(0, 161, 3, ${FILL_OPACITY})`,
};

@Component({
  components: { BarChart },
})
export default class PlayedHeroesChart extends Vue {
  @Prop() public playedHeroes!: PlayedHero[];

  get orderedHeroes(): PlayedHeroExtra[] {
    return chain(this.playedHeroes)
        .map((hero) => {
          const race = HERO_DATA[hero.icon].race;
          const color = RACE_COLORS[race];
          return {
            ...hero,
            race,
            color,
          };
        })
        .orderBy([ "race", "count", "icon" ], [ "asc", "desc", "asc" ])
        .groupBy("race")
        .mapValues((heroes, race) => {
          // Compute percentages within the race
          const groupTotalCount = sumBy(heroes, "count");
          const newHeroesData: PlayedHeroExtra[] = map(heroes, (hero) => ({
            ...hero,
            icon: this.$t("heroNames." + hero.icon).toString(),
            count: round(hero.count / groupTotalCount * 100, 1),
          }));

          // Add empty data point between races
          if (+race !== ERaceEnum.RANDOM) {
            newHeroesData.unshift({ icon: "", count: 0, race: ERaceEnum.RANDOM, color: "" });
          }

          return newHeroesData;
        })
        .toArray()
        .flatten()
        .value();
  }

  get chartData(): ChartData {
    return {
      labels: this.orderedHeroes.map((p: PlayedHero) => p.icon),
      datasets: [
        {
          data: this.orderedHeroes.map((p: PlayedHero) => p.count),
          backgroundColor: this.orderedHeroes.map((p) => p.color),
          borderWidth: 1,
        },
      ],
    };
  }

  get chartOptions(): ChartOptions {
    return {
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          displayColors: false,
          callbacks: {
            label: (tooltipItem: { label: string; formattedValue: string }) => {
              return `${tooltipItem.label} - ${tooltipItem.formattedValue}%`;
            },
            title: () => {
              return "";
            },
          },
        },
      },
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => {
              return value + "%";
            },
          },
        },
      },
    };
  }
}
</script>
