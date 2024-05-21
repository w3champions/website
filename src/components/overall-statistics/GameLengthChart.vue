<template>
  <bar-chart :chart-data="gameHourChartData" />
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, PropType } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { GameLength, Length } from "@/store/overallStats/types";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { ChartData } from "chart.js";
import { formatSecondsToDuration } from "@/helpers/date-functions";

export default defineComponent({
  name: "GameLengthChart",
  components: {
    BarChart,
  },
  props: {
    gameLength: {
      type: Object as PropType<GameLength>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const trimmedStats: ComputedRef<Length[]> = computed((): Length[] => {
      const stats = props.gameLength.lengths.slice(4); // Do not display games lasting less than 2 minutes.
      stats.pop(); // Do not display the last entry, because all games longer than the last timeslot are accumulated here.
      return stats;
    });

    const passedTime: ComputedRef<string[]> = computed((): string[] => trimmedStats.value.map((g) => formatSecondsToDuration(g.seconds)));
    const gamesCount: ComputedRef<number[]> = computed((): number[] => trimmedStats.value.map((g) => g.games));

    const gameHourChartData: ComputedRef<ChartData> = computed((): ChartData => {
      return {
        labels: passedTime.value,
        datasets: [
          {
            label: t("components_overall-statistics_gamelengthchart.amountofgames").toString(),
            data: gamesCount.value,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      };
    });

    return {
      gameHourChartData,
    };
  },
});
</script>
