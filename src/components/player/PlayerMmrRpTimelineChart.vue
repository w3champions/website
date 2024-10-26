<template>
  <div>
    <line-chart
      ref="chart"
      :chart-data="mmrRpChartData"
      :chart-options="chartOptions"
    />
  </div>
</template>
<script lang="ts">
import { computed, ComputedRef, PropType, defineComponent } from "vue";
import { PlayerMmrRpTimeline } from "@/store/player/types";
import { ChartData , ChartOptions, ScriptableContext } from "chart.js";
import { parseJSON, startOfDay } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import LineChart, { defaultOptions, defaultOptionsXAxis, getBackgroundColor } from "@/components/overall-statistics/LineChart.vue";

export default defineComponent({
  name: "PlayerMmrRpTimelineChart",
  components: {
    LineChart,
  },
  props: {
    mmrRpTimeline: {
      type: Object as PropType<PlayerMmrRpTimeline>,
      required: true,
    },
  },
  setup(props) {
    const mmrValues: ComputedRef<number[]> = computed((): number[] => props.mmrRpTimeline.mmrRpAtDates.map((m) => m.mmr));
    const rpValues: ComputedRef<number[]> = computed((): number[] => props.mmrRpTimeline.mmrRpAtDates.map((m) => m.rp));

    // Workaround: prevent dates from moving into the next day due to timezone conversion.
    const dates: ComputedRef<Date[]> = computed((): Date[] => props.mmrRpTimeline.mmrRpAtDates.map((m) => startOfDay(utcToZonedTime(parseJSON(m.date), "UTC"))));

    const chartOptions: ComputedRef<ChartOptions> = computed((): ChartOptions => {
      const options: ChartOptions = {
        scales: {
          x: defaultOptionsXAxis,
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "MMR",
            },
          },
          y1: {
            position: "right",
            beginAtZero: false,
            title: {
              display: true,
              text: "RP",
            },
          },
        },
      };
      return { ...defaultOptions(), ...options };
    });

    const mmrRpChartData = computed<ChartData<"line">>(() => {
      return {
        labels: dates.value,
        datasets: [
          {
            yAxisID: "y",
            label: "MMR",
            data: mmrValues.value,
            borderColor: "rgb(54, 162, 235)",
            fill: true,
            backgroundColor: (context: ScriptableContext<"line">) => getBackgroundColor(context, "rgb(54, 162, 235)"),
            borderWidth: 1.0,
            pointStyle: "circle",
            pointRadius: 1.2,
            pointBorderWidth: 1.8,
            pointHitRadius: 6,
            tension: 0.4, // Smooth line.
          },
          {
            yAxisID: "y1",
            label: "RP",
            data: rpValues.value,
            borderColor: "rgb(150, 80, 100)",
            fill: true,
            backgroundColor: (context: ScriptableContext<"line">) => getBackgroundColor(context, "rgb(150, 80, 100)"),
            borderWidth: 1.0,
            pointStyle: "circle",
            pointRadius: 1.2,
            pointBorderWidth: 1.8,
            pointHitRadius: 6,
            tension: 0.4, // Smooth line.
          },
        ],
      };
    });

    return {
      mmrRpChartData,
      chartOptions,
    };
  },
});
</script>
