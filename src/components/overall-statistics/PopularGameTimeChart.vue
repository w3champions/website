<template>
  <bar-chart :chart-data="gameHourChartData" />
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, PropType } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { PopularHours, Timeslot } from "@/store/overallStats/types";
import { ChartData } from "chart.js";
import BarChart from "@/components/overall-statistics/BarChart.vue";

export default defineComponent({
  name: "PopularGameTimeChart",
  components: {
    BarChart,
  },
  props: {
    popularGameHours: {
      type: Object as PropType<PopularHours>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const timeslots: ComputedRef<Timeslot[]> = computed((): Timeslot[] => props.popularGameHours ? props.popularGameHours?.timeslots.slice(0) : []);

    const gameStartHour: ComputedRef<string[]> = computed((): string[] => {
      return timeslots.value.map((g) =>
        g.hours.toString().padStart(2, "0") + ":" + g.minutes.toString().padStart(2, "0")
      );
    });

    const utcTimeOffset: ComputedRef<number> = computed((): number => {
      const time = new Date();
      const timeOffset = time.getTimezoneOffset() / 60;
      return timeOffset;
    });

    function shiftGameCount(gamesCount: number[]): number[] {
      const numberOfBarsToOffset = Math.abs(utcTimeOffset.value * 4);
      const isPositiveOffset = Math.abs(utcTimeOffset.value) === utcTimeOffset.value;

      for (let i = 0; i < numberOfBarsToOffset; i++) {
        if (isPositiveOffset) {
          const firstItem = gamesCount.shift()!;
          gamesCount.push(firstItem);
        } else {
          const lastItem = gamesCount.pop()!;
          gamesCount.unshift(lastItem);
        }
      }
      return gamesCount;
    }

    const gamesCount: ComputedRef<number[]> = computed((): number[] => timeslots.value.map((g) => g.games));

    const gameHourChartData: ComputedRef<ChartData> = computed((): ChartData => {
      return {
        labels: gameStartHour.value,
        datasets: [
          {
            label: String(t("components_overall-statistics_populargametimechart.accgameslast2weeks")),
            data: shiftGameCount(gamesCount.value),
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
