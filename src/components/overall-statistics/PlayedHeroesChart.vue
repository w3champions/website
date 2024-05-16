<template>
  <bar-chart :chart-data="chartData" :chart-options="chartOptions" />
</template>
<script lang="ts">
import { computed, ComputedRef, defineComponent } from "vue";
import { i18n } from "@/main";
import map from "lodash/map";
import round from "lodash/round";
import sumBy from "lodash/sumBy";
import orderBy from "lodash/orderBy";
import groupBy from "lodash/groupBy";
import mapValues from "lodash/mapValues";
import toArray from "lodash/toArray";
import flatten from "lodash/flatten";
import { ChartData, ChartOptions } from "chart.js";
import { PlayedHero } from "@/store/overallStats/types";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { HERO_DATA } from "@/store/heroes";
import { ERaceEnum } from "@/store/types";

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

export default defineComponent({
  name: "PlayedHeroesChart",
  components: {
    BarChart,
  },
  props: {
    playedHeroes: {
      type: Array<PlayedHero>,
      required: true,
    },
  },
  setup(props) {
    const orderedHeroes: ComputedRef<PlayedHeroExtra[]> = computed((): PlayedHeroExtra[] => {
      const playedHeroesExtra = props.playedHeroes
        .map((hero) => {
          const race = HERO_DATA[hero.icon].race;
          const color = RACE_COLORS[race];
          return {
            ...hero,
            race,
            color,
          };
        });

      const ordered = orderBy(playedHeroesExtra, [ "race", "count", "icon" ], [ "asc", "desc", "asc" ]);
      const groupedByRace = groupBy(ordered, "race");
      const computed = mapValues(groupedByRace, (heroes: PlayedHeroExtra[], race: string) => {
        // Compute percentages within the race
        const groupTotalCount = sumBy(heroes, "count");
        const newHeroesData: PlayedHeroExtra[] = map(heroes, (hero) => ({
          ...hero,
          icon: i18n.t("heroNames." + hero.icon).toString(),
          count: round(hero.count / groupTotalCount * 100, 1),
        }));

        // Add empty data point between races
        if (+race !== ERaceEnum.RANDOM) {
          newHeroesData.unshift({ icon: "", count: 0, race: ERaceEnum.RANDOM, color: "" });
        }

        return newHeroesData;
      });
      const computedArray = toArray(computed);
      return flatten(computedArray);
    });

    const chartData: ComputedRef<ChartData> = computed((): ChartData => {
      return {
        labels: orderedHeroes.value.map((p: PlayedHero) => p.icon),
        datasets: [
          {
            data: orderedHeroes.value.map((p: PlayedHero) => p.count),
            backgroundColor: orderedHeroes.value.map((p) => p.color),
            borderWidth: 1,
          },
        ],
      };
    });

    const chartOptions: ComputedRef<ChartOptions> = computed((): ChartOptions => {
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
    });

    return {
      chartData,
      chartOptions,
    };
  },
});
</script>
