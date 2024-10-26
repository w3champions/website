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
  Legend,
  ChartArea,
  ScriptableContext,
  ChartData,
} from "chart.js";
import "chartjs-adapter-date-fns";
import chartJSPluginAnnotation from "chartjs-plugin-annotation";
import { PropType } from "vue";
import { Line as LineChartGeneric } from "vue-chartjs";

ChartJS.register(LineController);
ChartJS.register(LineElement);
ChartJS.register(PointElement);
ChartJS.register(TimeScale);
ChartJS.register(LinearScale);
ChartJS.register(Filler);
ChartJS.register(Tooltip);
ChartJS.register(chartJSPluginAnnotation);
ChartJS.register(Legend);

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
        display: window.innerWidth > 680 // Don't display legends for mobile devices, because they overflow into the chart area.
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
        radius: 1.2,
      },
    },
  };
};

const getGradient = (ctx: CanvasRenderingContext2D, chartArea: ChartArea, color: string): CanvasGradient => {
    const regex = /\((\d*,\s?){2}\d*/g;
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0.0, "rgba" + color.match(regex) + ", 0.0)");
    gradient.addColorStop(0.3, "rgba" + color.match(regex) + ", 0.25)");
    gradient.addColorStop(0.8, "rgba" + color.match(regex) + ", 0.50)");
    gradient.addColorStop(1, "rgba" + color.match(regex) + ", 0.75)");
    return gradient;
};

export const getBackgroundColor = (context: ScriptableContext<"line">, color: string) => {
  const chart = context.chart;
  const { ctx, chartArea } = chart;

  if (!chartArea) return; // This case happens on initial chart load
  return getGradient(ctx, chartArea, color);
};

export default {
  name: "LineChart",
  components: { LineChartGeneric },
  props: {
    chartData: {
      type: Object as PropType<ChartData<"line">>,
      required: true,
    },
    chartOptions: {
      type: Object,
      default: defaultOptions,
    },
  }
};
</script>
