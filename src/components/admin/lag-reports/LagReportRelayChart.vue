<template>
  <figure class="relay-chart ma-0">
    <div class="d-flex align-center justify-end ga-2 mb-1">
      <span class="text-caption text-medium-emphasis font-italic">Scroll to zoom, drag to pan, hover a marker for details</span>
      <v-btn size="x-small" variant="text" @click="resetZoom">Reset zoom</v-btn>
    </div>
    <div role="img" :aria-label="description">
      <bar-chart ref="chartRef" :chart-data="chartData" :chart-options="chartOptions" :chart-plugins="[zoomPlugin]" />
    </div>
    <figcaption>
      <lag-report-relay-legend :groups="groups" :hidden="hidden" @toggle="toggle" />
    </figcaption>
  </figure>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType, reactive, ref } from "vue";
import { useTheme } from "vuetify";
import { Chart as ChartJS, type ChartData, type ChartDataset, type ChartOptions, LineController, LineElement, PointElement, type ScriptableContext, TimeScale } from "chart.js";
import "chartjs-adapter-date-fns";
import type { AnnotationOptions, EventContext } from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { readLagChipColors } from "@/helpers/lag-report-colors";
import LagReportRelayLegend from "./LagReportRelayLegend.vue";
import type { EventMarkerInfo } from "./chartMarkers";
import { formatWallClock } from "./chartMarkers";
import type { PauseInterval } from "./gameTimeline";
import type { LegendGroup, RelayChartSeries } from "./relayChartSeries";

// BarChart only registers the bar pieces; this chart is lines on a time axis.
ChartJS.register(LineController, LineElement, PointElement, TimeScale);

const STALL_FILL_ALPHA = "55";
const RETRANSMIT_POINT_RADIUS = 4;

export default defineComponent({
  name: "LagReportRelayChart",
  components: { BarChart, LagReportRelayLegend },
  props: {
    series: { type: Array as PropType<RelayChartSeries[]>, required: true },
    groups: { type: Array as PropType<LegendGroup[]>, required: true },
    pauses: { type: Array as PropType<PauseInterval[]>, default: () => [] },
    markers: { type: Array as PropType<EventMarkerInfo[]>, default: () => [] },
    /** Text alternative for the canvas. */
    description: { type: String, required: true },
  },
  setup(props) {
    const theme = useTheme();
    const chartRef = ref<{ chart?: { resetZoom(): void } } | null>(null);
    const hidden = reactive(new Set<string>());

    function toggle(key: string) {
      if (hidden.has(key)) hidden.delete(key);
      else hidden.add(key);
    }

    function dataset(s: RelayChartSeries): ChartDataset<"line"> {
      const base = {
        type: "line" as const,
        label: s.label,
        data: s.points,
        borderColor: s.color,
        borderDash: s.dash,
        borderWidth: s.width,
        spanGaps: false,
        yAxisID: s.yAxis,
        hidden: hidden.has(s.legendKey),
      };
      if (s.style === "stall") {
        return { ...base, stepped: "before", fill: "origin", backgroundColor: `${s.color}${STALL_FILL_ALPHA}`, pointRadius: 0, pointHitRadius: 6, order: 3 };
      }
      const retransmitAt = s.retransmitAt ?? [];
      return {
        ...base,
        backgroundColor: s.color,
        tension: 0.15,
        pointStyle: "triangle",
        pointRadius: (ctx: ScriptableContext<"line">) => (retransmitAt[ctx.dataIndex] ? RETRANSMIT_POINT_RADIUS : 0),
        pointHoverRadius: 4,
        pointHitRadius: 8,
        order: s.style === "felt" ? 1 : 2,
      };
    }

    const chartData = computed<ChartData<"line">>(() => ({ datasets: props.series.map(dataset) }));

    function showLabel(display: boolean) {
      return (ctx: EventContext) => {
        const label = ctx.element.label;
        if (!label) return false;
        label.options.display = display;
        return true;
      };
    }

    const annotations = computed(() => {
      // readLagChipColors reads CSS variables, which Vue cannot track; this re-reads them on a theme switch.
      void theme.current.value.dark;
      const chips = readLagChipColors();
      const out: Record<string, AnnotationOptions> = {};
      props.pauses.forEach((p, i) => {
        out[`pause-${i}`] = {
          type: "box",
          xMin: p.startMs,
          xMax: p.endMs,
          backgroundColor: chips.warning.bgColor,
          borderWidth: 0,
          label: {
            display: false,
            content: [`Game paused (${p.battleTags.map((t) => t.split("#")[0]).join(", ")})`, `${formatWallClock(p.startMs)} – ${formatWallClock(p.endMs)}`],
            position: "start",
            font: { size: 11 },
          },
          enter: showLabel(true),
          leave: showLabel(false),
        };
      });
      for (const m of props.markers) {
        out[m.id] = {
          type: "line",
          xMin: m.ts,
          xMax: m.ts,
          borderColor: m.style.border,
          borderWidth: 2,
          borderDash: m.dashed ? [4, 2] : undefined,
          hitTolerance: 8,
          label: {
            display: false,
            content: [m.shortLabel, ...m.detailLines],
            backgroundColor: m.style.bgColor,
            color: m.style.textColor,
            font: { size: 11 },
          },
          enter: showLabel(true),
          leave: showLabel(false),
        };
      }
      return out;
    });

    const chartOptions = computed<ChartOptions<"line">>(() => ({
      animation: false,
      maintainAspectRatio: true,
      aspectRatio: 4,
      interaction: { mode: "nearest", intersect: false, axis: "xy" },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (items) => (items.length ? formatWallClock(items[0].parsed.x ?? 0) : ""),
            label: (item) => {
              const y = item.parsed.y;
              if (y == null) return `${item.dataset.label}: gap`;
              if (item.dataset.yAxisID === "yStall") return `${item.dataset.label}: ${y} s`;
              const retransmits = props.series[item.datasetIndex]?.retransmits?.[item.dataIndex] ?? 0;
              const suffix = retransmits > 0 ? `, ${retransmits} retransmits` : "";
              return `${item.dataset.label}: ${Math.round(y)} ms${suffix}`;
            },
          },
        },
        annotation: { annotations: annotations.value },
        zoom: {
          pan: { enabled: true, mode: "x" },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
        },
      },
      scales: {
        x: { type: "time", time: { tooltipFormat: "HH:mm:ss", displayFormats: { second: "HH:mm:ss", minute: "HH:mm" } } },
        y: { beginAtZero: true, title: { display: true, text: "ms" } },
        yStall: {
          position: "right",
          beginAtZero: true,
          suggestedMax: 5,
          title: { display: true, text: "stall s" },
          grid: { drawOnChartArea: false },
        },
      },
    }));

    function resetZoom() {
      chartRef.value?.chart?.resetZoom();
    }

    return { chartRef, chartData, chartOptions, hidden, toggle, resetZoom, zoomPlugin };
  },
});
</script>
