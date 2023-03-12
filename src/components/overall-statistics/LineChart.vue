<template>
  <line-chart-generic
      :data="chartData"
      :options="chartOptions"
  />
</template>

<script lang="ts">
import { Chart as ChartJS, ChartOptions } from "chart.js/auto";
import chartJSPluginAnnotation from "chartjs-plugin-annotation";
import { Line as LineChartGeneric } from "vue-chartjs";
import "chartjs-adapter-date-fns";

ChartJS.register(chartJSPluginAnnotation);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultOptionsXAxis: any = {
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
