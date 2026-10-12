<template>
  <div :style="{ height: `${heightPx}px` }">
    <bar-chart :chart-data="chartData" :chart-options="chartOptions" :aria-label="description" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useTheme } from "vuetify";
import type { ChartData, ChartOptions } from "chart.js";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { readChartInkColors, readThemeColor, THEME_FALLBACK_COLOR } from "@/helpers/lag-report-colors";
import type { AggregateBars } from "./fleet";
import { formatMs } from "./format";

const props = defineProps<{ bars: AggregateBars; description: string }>();
const theme = useTheme();

const ROW_HEIGHT_PX = 28;
const AXIS_HEIGHT_PX = 72;
const MIN_HEIGHT_PX = 160;
const P90_ALPHA = 0.6;

const heightPx = computed(() => Math.max(MIN_HEIGHT_PX, props.bars.labels.length * ROW_HEIGHT_PX + AXIS_HEIGHT_PX));

const chartData = computed<ChartData<"bar">>(() => {
  // readThemeColor reads CSS variables, which Vue cannot track; this re-reads them on a theme switch.
  void theme.global.name.value;
  return {
    labels: props.bars.labels,
    datasets: [
      { label: "Median p50", data: props.bars.p50Median, backgroundColor: readThemeColor("primary") ?? THEME_FALLBACK_COLOR },
      { label: "p90 of p50", data: props.bars.p50P90, backgroundColor: readThemeColor("info", P90_ALPHA) ?? THEME_FALLBACK_COLOR },
    ],
  };
});

const chartOptions = computed<ChartOptions<"bar">>(() => {
  void theme.global.name.value;
  const ink = readChartInkColors();
  return {
    indexAxis: "y",
    animation: false,
    maintainAspectRatio: false,
    color: ink.text,
    plugins: {
      legend: { display: true, position: "bottom" },
      tooltip: { callbacks: { label: (item) => `${item.dataset.label ?? ""}: ${formatMs(item.parsed.x)}` } },
    },
    scales: {
      x: { beginAtZero: true, ticks: { color: ink.text }, grid: { color: ink.grid }, title: { display: true, text: "ms", color: ink.text } },
      // The axis shows the cut label; the full name stays in `labels` for the tooltip.
      y: { ticks: { color: ink.text, callback: (_value, index) => props.bars.tickLabels[index] ?? "" }, grid: { color: ink.grid } },
    },
  };
});
</script>
