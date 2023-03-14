<template>
  <line-chart-generic
      :data="chartData"
      :options="chartOptions"
  />
</template>

<script lang="ts">
import {
  Chart as ChartJS,
  ChartOptions,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScaleOptions,
  TimeScale,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import chartJSPluginAnnotation from "chartjs-plugin-annotation";
import { Line as LineChartGeneric } from "vue-chartjs";

ChartJS.register(LineController);
ChartJS.register(LineElement);
ChartJS.register(PointElement);
ChartJS.register(TimeScale);
ChartJS.register(LinearScale);
ChartJS.register(Filler);
ChartJS.register(Tooltip);
ChartJS.register(chartJSPluginAnnotation);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultOptionsXAxis: ScaleOptions<"time"> = {
  type: "time",
  time: {
    unit: "day",
    tooltipFormat: "MMM dd, yyyy",
    displayFormats: {
      day: "MMM dd, yyyy",
    },
  },
};

export const defaultOptions = (): ChartOptions => {
  return {
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        bodyAlign: "center",
        displayColors: false,
        // mode: "index",
        position: "nearest",
        callbacks: {
          label: (tooltipItem: { label: string; formattedValue: string }) => {
            return `${tooltipItem.label} - ${tooltipItem.formattedValue}`;
          },
          title: () => {
            return "";
          },
        },
      },
    },
    maintainAspectRatio: true,
    scales: {
      y: { beginAtZero: true },
      x: defaultOptionsXAxis,
    },
    elements: {
      point: {
        radius: 2,
      },
    },
  };
};

export default {
  name: "LineChart",
  components: { LineChartGeneric },
  props: {
    chartData: {
      type: Object,
    },
    chartOptions: {
      type: Object,
      default: defaultOptions,
    },
  }
};
</script>
