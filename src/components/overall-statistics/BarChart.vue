<template>
  <bar-chart-generic
    :data="chartData"
    :options="chartOptions"
  />
</template>

<script lang="ts">
import { BarController, BarElement, CategoryScale, Chart as ChartJS, ChartOptions, Filler, LinearScale, Tooltip, Legend, ChartData } from "chart.js";
import chartJSPluginAnnotation from "chartjs-plugin-annotation";
import { PropType } from "vue";
import { Bar as BarChartGeneric } from "vue-chartjs";

ChartJS.register(BarController);
ChartJS.register(BarElement);
ChartJS.register(CategoryScale);
ChartJS.register(LinearScale);
ChartJS.register(Filler);
ChartJS.register(Tooltip);
ChartJS.register(chartJSPluginAnnotation);
ChartJS.register(Legend);

const defaultOptions = (): ChartOptions => {
  return {
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        bodyAlign: "center",
        displayColors: false,
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
      x: { reverse: false },
    },
  };
};

export default {
  name: "BarChart",
  components: { BarChartGeneric },
  props: {
    chartData: {
      // Unfortunately we can't use ChartData<"bar"> here,
      // because we sometimes pass mixed charts (line and bar)
      // which chartjs supports, but vue-chartjs doesn't expose
      // types for.
      type: Object as PropType<ChartData<any>>,
      required: true,
    },
    chartOptions: {
      type: Object,
      default: defaultOptions,
    },
    // datasetIdKey: {
    //   type: String,
    //   default: "label",
    // },
  },
};
</script>
