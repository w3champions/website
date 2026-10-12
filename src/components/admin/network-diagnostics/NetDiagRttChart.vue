<template>
  <div>
    <bar-chart :chart-data="chartData" :chart-options="chartOptions" :aria-label="description" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useTheme } from "vuetify";
import { Chart as ChartJS, type ChartData, type ChartDataset, type ChartOptions, LineController, LineElement, PointElement } from "chart.js";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { readChartInkColors } from "@/helpers/lag-report-colors";
import { formatMs } from "./format";
import type { RttSeries } from "./measurementView";

// BarChart registers the bar pieces and the linear/category scales; this chart is lines.
ChartJS.register(LineController, LineElement, PointElement);

const props = defineProps<{ series: RttSeries[]; description: string }>();
const theme = useTheme();

function dataset(s: RttSeries): ChartDataset<"line"> {
  return {
    type: "line",
    label: s.label,
    data: s.points,
    borderColor: s.color,
    backgroundColor: s.color,
    borderDash: s.dash,
    borderWidth: 1.5,
    pointRadius: 0,
    pointHitRadius: 6,
    spanGaps: false,
    tension: 0,
  };
}

const chartData = computed<ChartData<"line">>(() => ({ datasets: props.series.map(dataset) }));

const chartOptions = computed<ChartOptions<"line">>(() => {
  // readChartInkColors reads CSS variables, which Vue cannot track; this re-reads them on a theme switch.
  void theme.global.name.value;
  const ink = readChartInkColors();
  return {
    animation: false,
    maintainAspectRatio: true,
    aspectRatio: 3,
    color: ink.text,
    interaction: { mode: "nearest", intersect: false, axis: "x" },
    plugins: {
      legend: { display: true, position: "bottom" },
      tooltip: {
        callbacks: {
          title: (items) => (items.length ? `${Math.round(items[0].parsed.x ?? 0)} s into the window` : ""),
          label: (item) => `${item.dataset.label ?? ""}: ${formatMs(item.parsed.y)}`,
        },
      },
    },
    scales: {
      x: { type: "linear", beginAtZero: true, ticks: { color: ink.text }, grid: { color: ink.grid }, title: { display: true, text: "seconds into the window", color: ink.text } },
      y: { beginAtZero: true, ticks: { color: ink.text }, grid: { color: ink.grid }, title: { display: true, text: "RTT (ms)", color: ink.text } },
    },
  };
});
</script>
