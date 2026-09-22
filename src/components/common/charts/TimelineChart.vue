<template>
  <div class="timeline-chart">
    <!-- Always shown: the grid toggle applies to every chart, even one with no
         range presets or markers of its own. -->
    <div class="timeline-chart__ranges" :style="{ paddingRight: `${rightGutter}px` }">
      <v-chip-group v-model="activeRange" mandatory selected-class="text-primary" density="comfortable">
        <v-chip
          v-for="preset in rangePresets"
          :key="preset.key"
          :value="preset.key"
          size="small"
          variant="outlined"
        >
          {{ preset.label }}
        </v-chip>
      </v-chip-group>
      <div class="timeline-chart__toolbar-end">
        <v-chip
          v-if="markers.length"
          size="small"
          variant="outlined"
          :style="showMarkers ? { borderColor: markerHue, color: markerHue } : undefined"
          @click="showMarkers = !showMarkers"
        >
          Seasons
        </v-chip>
        <v-chip
          size="small"
          variant="outlined"
          :class="{ 'text-primary': showGrid }"
          @click="showGrid = !showGrid"
        >
          Grid
        </v-chip>
        <v-btn
          v-if="zoomed"
          size="small"
          variant="text"
          density="comfortable"
          @click="resetZoom"
        >
          Reset zoom
        </v-btn>
      </div>
    </div>

    <div class="timeline-chart__canvas" :style="{ height: `${height}px` }">
      <line-chart-generic ref="chartRef" :data="chartData" :options="chartOptions" :plugins="localPlugins" />
    </div>

    <ul class="timeline-chart__legend">
      <li
        v-for="entry in legendEntries"
        :key="entry.key"
        class="timeline-chart__legend-item"
        :class="{ 'timeline-chart__legend-item--off': entry.hidden }"
        :style="{ backgroundColor: entry.tint, borderColor: entry.edge }"
        role="button"
        tabindex="0"
        @click="toggleSeries(entry.key)"
        @keydown.enter="toggleSeries(entry.key)"
        @keydown.space.prevent="toggleSeries(entry.key)"
      >
        <img v-if="entry.icon" class="timeline-chart__icon" :src="entry.icon" :alt="entry.label" />
        <span v-else class="timeline-chart__swatch" :style="{ backgroundColor: entry.color }"></span>
        <span class="timeline-chart__legend-label">{{ entry.label }}</span>
        <span class="timeline-chart__legend-value">{{ entry.current }}</span>
        <template v-if="entry.peak">
          <span class="timeline-chart__legend-sep">·</span>
          <span class="timeline-chart__legend-peak">peak {{ entry.peak.value }} on {{ entry.peak.date }}</span>
        </template>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType, ref } from "vue";
import {
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  type ScriptableLineSegmentContext,
  Tooltip,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import annotationPlugin from "chartjs-plugin-annotation";
import { Line as LineChartGeneric } from "vue-chartjs";
import { useTheme } from "vuetify";
import { format } from "date-fns";
import "@/lib/chart-timestack";
import { DEF_TICK_GENERATORS } from "@/lib/chart-timestack";
import { resyncPointer, timelineCrosshairPlugin } from "@/components/common/charts/timelineCrosshair";
import { timelineWheelPanPlugin } from "@/components/common/charts/timelineWheelPan";
import { withAlpha } from "@/components/common/charts/colors";
import type { TimelineAxis, TimelineMarker, TimelinePoint, TimelineRangePreset, TimelineSeries } from "@/components/common/charts/types";

ChartJS.register(LineController, LineElement, PointElement, LinearScale, Filler, Tooltip);

// Scoped to this chart rather than registered globally: both draw and handle
// events on every chart they are registered against, and the other charts on
// the site neither want a crosshair nor expect to be zoomable.
const sharedPlugins = [zoomPlugin, annotationPlugin, timelineCrosshairPlugin, timelineWheelPanPlugin];

const DAY_MS = 24 * 60 * 60 * 1000;

// One point per calendar day is all the data has, so drop the generators that
// would label hours and minutes: they invent a precision that isn't there.
const dayResolutionTicks = (): typeof DEF_TICK_GENERATORS => DEF_TICK_GENERATORS.filter((gen) => gen.top.size >= DAY_MS);

// A single neutral grey can't be subtle on one theme and visible on the other,
// so tint from the background: light lines on dark, dark lines on light.
const gridColors = (isDark: boolean): { grid: string; border: string } =>
  isDark
    ? { grid: "rgba(255, 255, 255, 0.12)", border: "rgba(255, 255, 255, 0.28)" }
    : { grid: "rgba(0, 0, 0, 0.12)", border: "rgba(0, 0, 0, 0.30)" };

// Season boundaries and the like. Outside the race palette so a boundary can't
// be mistaken for a series, and darkened on the light theme where a bright amber
// all but disappears.
/** Grid-friendly step for the span: hundreds for ratings, units for levels. */
const roundingStep = (span: number): number => Math.max(10 ** (Math.floor(Math.log10(span || 1)) - 1), 1);

const markerColor = (isDark: boolean): string => (isDark ? "rgba(255, 193, 7, 0.65)" : "rgba(168, 94, 0, 0.75)");

// Ring around the peak marker, so it reads against the plot on either theme.
const markerRingColor = (isDark: boolean): string => (isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.7)");

export default defineComponent({
  name: "TimelineChart",
  components: { LineChartGeneric },
  props: {
    series: {
      type: Array as PropType<TimelineSeries[]>,
      required: true,
    },
    axes: {
      type: Array as PropType<TimelineAxis[]>,
      required: true,
    },
    rangePresets: {
      type: Array as PropType<TimelineRangePreset[]>,
      default: () => [],
    },
    /** Segments spanning more than this many days are drawn dashed, so a long
     * inactivity gap doesn't read as a held rating. */
    gapDays: {
      type: Number,
      default: 14,
    },
    fill: {
      type: Boolean,
      default: false,
    },
    /** Vertical reference lines, e.g. season boundaries. */
    markers: {
      type: Array as PropType<TimelineMarker[]>,
      default: () => [],
    },
    /** Floor on how far the x axis can be zoomed in, in days. */
    minRangeDays: {
      type: Number,
      default: 7,
    },
    /** Carries every series flat to this time (epoch ms) with a synthetic
     * trailing point. A rating still stands on days with no games, so an
     * ongoing season should run to today rather than stopping at the last
     * match. Excluded from peaks, markers and tooltip dates. */
    extendTo: {
      type: Number as PropType<number | null>,
      default: null,
    },
    height: {
      type: Number,
      default: 360,
    },
  },
  setup(props) {
    const theme = useTheme();
    const chartRef = ref<{ chart?: ChartJS<"line"> }>();
    const hiddenKeys = ref<Set<string>>(new Set());
    const zoomed = ref<boolean>(false);
    const showMarkers = ref<boolean>(true);
    const showGrid = ref<boolean>(true);

    // Distance from the canvas edge to the plot area, so the toolbar lines up
    // with the plot rather than sitting over a right-hand axis. Measured rather
    // than guessed, because it depends on the widest tick label.
    const rightGutter = ref<number>(0);

    const localPlugins = [
      ...sharedPlugins,
      {
        id: "timelineGutter",
        afterLayout(chart: ChartJS) {
          rightGutter.value = Math.max(chart.width - chart.chartArea.right, 0);
        },
      },
    ];

    const visibleSeries = computed<TimelineSeries[]>(() => props.series.filter((s) => s.points.length > 0));

    const chart = (): ChartJS<"line"> | undefined => chartRef.value?.chart;

    /**
     * The full vertical extent of each axis, so zooming along x leaves the y
     * axis alone. Letting it rescale to whatever is in view makes the line jump
     * as you zoom, which reads as the data changing rather than the window.
     * Hiding a series does recompute it, since that is a deliberate ask.
     */
    const axisBounds = computed<Record<string, { min: number; max: number; dataMin: number }>>(() => {
      const bounds: Record<string, { min: number; max: number; dataMin: number }> = {};

      for (const s of visibleSeries.value) {
        if (hiddenKeys.value.has(s.key)) continue;
        const id = s.yAxisID ?? props.axes[0].id;
        for (const point of s.points) {
          const current = bounds[id];
          bounds[id] = current
            ? { min: Math.min(current.min, point.y), max: Math.max(current.max, point.y), dataMin: 0 }
            : { min: point.y, max: point.y, dataMin: 0 };
        }
      }

      // A little air so a peak or trough doesn't sit against the frame, then
      // snapped outwards to round numbers: pinning the axis means the extremes
      // are labelled exactly, and raw padded values read as 2,794.1.
      for (const id of Object.keys(bounds)) {
        const { min, max } = bounds[id];
        const padded = Math.max((max - min) * 0.06, 1);
        const step = roundingStep(max - min + padded * 2);
        bounds[id] = {
          min: Math.floor((min - padded) / step) * step,
          max: Math.ceil((max + padded) / step) * step,
          dataMin: min,
        };
      }
      return bounds;
    });

    const peakOf = (s: TimelineSeries): { point: TimelinePoint; index: number } => {
      if (s.peak) {
        const index = s.points.findIndex((p) => p.x === s.peak?.x);
        return { point: s.peak, index };
      }
      let index = 0;
      for (let i = 1; i < s.points.length; i++) {
        if (s.points[i].y > s.points[index].y) index = i;
      }
      return { point: s.points[index], index };
    };

    const extendedPoints = (s: TimelineSeries): TimelinePoint[] => {
      const last = s.points[s.points.length - 1];
      if (props.extendTo == null || props.extendTo <= last.x) return s.points;
      return [...s.points, { x: props.extendTo, y: last.y }];
    };

    const chartData = computed<ChartData<"line">>(() => ({
      datasets: visibleSeries.value.map((s) => {
        const peakIndex = peakOf(s).index;
        const real = s.points.length;

        // Only the peak gets a marker. Dots on every point added nothing the
        // steps and the crosshair don't already show, and a density threshold
        // meant a heavily played race lost its dots while the others kept
        // theirs, which just looked broken.
        const radiusAt = (index: number): number => (index === peakIndex && index < real ? 5 : 0);
        const data = extendedPoints(s);

        return {
          label: s.label,
          data,
          yAxisID: s.yAxisID ?? props.axes[0].id,
          hidden: hiddenKeys.value.has(s.key),
          borderColor: s.color,
          backgroundColor: s.color,
          borderWidth: 1.5,
          // 'before' holds each point's value until the next point and steps
          // there, which is how a rating actually behaves. 'after' would step
          // at the point itself, drawing the *next* value across the interval.
          stepped: "before" as const,
          fill: props.fill,
          pointRadius: (ctx: { dataIndex: number }) => radiusAt(ctx.dataIndex),
          // Matched to pointRadius so nothing resizes under the cursor. Left at
          // zero, the active point vanished as the crosshair passed over it.
          pointHoverRadius: (ctx: { dataIndex: number }) => radiusAt(ctx.dataIndex),
          pointStyle: "rectRot" as const,
          pointBorderWidth: (ctx: { dataIndex: number }) => (ctx.dataIndex === peakIndex ? 1.5 : 0),
          pointBorderColor: markerRingColor(theme.current.value.dark),
          segment: {
            borderDash: (ctx: ScriptableLineSegmentContext) => {
              const from = ctx.p0.parsed.x;
              const to = ctx.p1.parsed.x;
              if (from == null || to == null) return undefined;
              return to - from > props.gapDays * DAY_MS ? [3, 3] : undefined;
            },
          },
        };
      }),
    }));

    const chartOptions = computed<ChartOptions<"line">>(() => {
      const { grid, border } = gridColors(theme.current.value.dark);
      const markerLine = markerColor(theme.current.value.dark);

      return {
        maintainAspectRatio: false,
        animation: false,
        normalized: true,
        parsing: false,
        // Room for a peak marker sitting on the newest point or at the very top.
        layout: { padding: { right: 6, top: 6 } },
        interaction: {
          mode: "steppedIndex",
          intersect: false,
        },
        scales: {
          x: {
            type: "timestack",
            bounds: "data",
            timestack: { make_tick_generators: dayResolutionTicks },
            // No vertical gridlines: they run parallel to the season markers
            // and make it hard to pick those out.
            grid: { display: false },
            border: { color: border },
          },
          ...Object.fromEntries(props.axes.map((axis) => [
            axis.id,
            {
              type: "linear",
              position: axis.position ?? "left",
              beginAtZero: axis.beginAtZero ?? false,
              min: axisBounds.value[axis.id]?.min,
              max: axisBounds.value[axis.id]?.max,
              title: axis.title ? { display: true, text: axis.title } : undefined,
              ticks: {
                // The padded range may dip below zero to leave room for the
                // season captions, but neither a rating nor a level can be
                // negative, so leave those ticks unlabelled rather than
                // implying the value is possible.
                callback(this: { getLabelForValue: (v: number) => string }, value: string | number) {
                  const numeric = Number(value);
                  const bounds = axisBounds.value[axis.id];
                  if (bounds && bounds.dataMin >= 0 && numeric < 0) return null;
                  return this.getLabelForValue(numeric);
                },
              },
              // Only the first axis paints gridlines, or a second scale's lines
              // cross the first's at unrelated values.
              grid: { display: showGrid.value, drawOnChartArea: axis.id === props.axes[0].id, color: grid },
              border: { color: border },
              // Runs again after every zoom, so the vertical scale stays honest
              // instead of magnifying a few points into dramatic swings.
              afterDataLimits: (scale: { min: number; max: number }) => {
                if (!axis.minRange) return;
                const padding = (axis.minRange - (scale.max - scale.min)) / 2;
                if (padding <= 0) return;
                scale.min -= padding;
                scale.max += padding;
              },
            },
          ])),
        },
        plugins: {
          legend: { display: false }, // Replaced by the HTML legend below the chart.
          annotation: {
            // Drawn under the data so a boundary never obscures a rating.
            drawTime: "beforeDatasetsDraw",
            annotations: Object.fromEntries((showMarkers.value ? props.markers : []).map((marker, i) => [
              `marker${i}`,
              {
                type: "line",
                xMin: marker.x,
                xMax: marker.x,
                borderColor: markerLine,
                borderWidth: 1,
                borderDash: [2, 3],
                label: marker.label
                  ? {
                    display: true,
                    content: marker.label,
                    position: "start",
                    backgroundColor: "transparent",
                    color: markerLine,
                    font: { size: 9 },
                    padding: 2,
                  }
                  : { display: false },
              },
            ])),
          },
          tooltip: {
            position: "crosshair",
            displayColors: true,
            titleFont: { size: 13 },
            bodyFont: { size: 13 },
            padding: 8,
            // Highest first, so the rows sit in the same order as the lines do
            // on screen at that moment.
            itemSort: (a, b) => (b.parsed.y ?? 0) - (a.parsed.y ?? 0),
            callbacks: {
            // The heading is the most recent day played at or before the
            // crosshair, not the crosshair's own date: between games nothing
            // changed, so that day is what these values actually describe.
              title: (items) => {
                const played = Math.max(...items.map((item) => {
                  const s = visibleSeries.value[item.datasetIndex];
                  // A synthetic trailing point is not a game; report the last real one.
                  return item.dataIndex >= s.points.length
                    ? s.points[s.points.length - 1].x
                    : (item.raw as { x: number }).x;
                }));
                if (!Number.isFinite(played)) return "";

                // The marker at or before this point names the period it falls
                // in, so a reading part way through a long series is placed
                // without counting boundaries by eye.
                const marker = [...props.markers].reverse().find((m) => m.x <= played);
                const date = format(new Date(played), "MMM d, yyyy");
                return marker?.label ? `${date}  ·  ${marker.label}` : date;
              },
              label: (item) => {
                const series = visibleSeries.value[item.datasetIndex];
                const raw = (item.raw as { y: number }).y;
                return `${item.dataset.label}: ${series?.format ? series.format(raw) : raw}`;
              },
            },
          },
          zoom: {
            // Both gestures slide the data under a stationary pointer, so the
            // readout has to be re-resolved as they go, or it keeps reporting
            // whatever was under the cursor when the gesture began.
            pan: { enabled: true, mode: "x", onPan: ({ chart }) => resyncPointer(chart) },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x",
              onZoom: ({ chart }) => resyncPointer(chart),
              onZoomComplete: () => { zoomed.value = true; },
            },
            // Never zoom past the resolution of the data itself.
            limits: { x: { min: "original", max: "original", minRange: props.minRangeDays * DAY_MS } },
          },
        },
      };
    });

    const selectedRange = ref<string | undefined>(props.rangePresets.find((p) => p.default)?.key ?? props.rangePresets[0]?.key);

    const activeRange = computed<string | undefined>({
      get: () => selectedRange.value,
      set: (key?: string) => {
        if (!key) return;
        selectedRange.value = key;
        applyRange(key);
      },
    });

    function dataExtent(): { min: number; max: number } | null {
      let min = Infinity;
      let max = -Infinity;
      for (const s of visibleSeries.value) {
        if (hiddenKeys.value.has(s.key)) continue;
        min = Math.min(min, s.points[0].x);
        max = Math.max(max, s.points[s.points.length - 1].x);
      }
      return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : null;
    }

    function applyRange(key: string): void {
      const instance = chart();
      const preset = props.rangePresets.find((p) => p.key === key);
      if (!instance || !preset) return;

      if (preset.months == null) {
        instance.resetZoom("none");
        zoomed.value = false;
        return;
      }

      const extent = dataExtent();
      if (!extent) return;

      const from = new Date(extent.max);
      from.setMonth(from.getMonth() - preset.months);
      instance.zoomScale("x", { min: Math.max(from.getTime(), extent.min), max: extent.max }, "none");
      zoomed.value = false;
    }

    function resetZoom(): void {
      chart()?.resetZoom("none");
      zoomed.value = false;
    }

    function toggleSeries(key: string): void {
      const next = new Set(hiddenKeys.value);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      hiddenKeys.value = next;
    }

    const legendEntries = computed(() => visibleSeries.value.map((s) => {
      const last = s.points[s.points.length - 1];
      const peak = peakOf(s).point;
      return {
        key: s.key,
        label: s.label,
        color: s.color,
        icon: s.icon,
        tint: withAlpha(s.color, 0.16),
        edge: withAlpha(s.color, 0.55),
        hidden: hiddenKeys.value.has(s.key),
        current: s.format ? s.format(last.y) : String(last.y),
        peak: {
          value: s.format ? s.format(peak.y) : String(peak.y),
          date: format(new Date(peak.x), "MMM d, yyyy"),
        },
      };
    }));

    return {
      localPlugins,
      rightGutter,
      showMarkers,
      showGrid,
      markerHue: computed(() => markerColor(theme.current.value.dark)),
      chartRef,
      chartData,
      chartOptions,
      activeRange,
      legendEntries,
      resetZoom,
      toggleSeries,
      zoomed,
    };
  },
});
</script>

<style lang="scss" scoped>
.timeline-chart__ranges {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.timeline-chart__toolbar-end {
  display: flex;
  align-items: center;
  gap: 4px;
}

.timeline-chart__canvas {
  position: relative;
}

.timeline-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  list-style: none;
  padding: 12px 0 0;
  margin: 0;
}

.timeline-chart__legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1.6;
  // A tinted pill carries the series colour even when an icon replaces the
  // swatch, which is otherwise the only thing tying a row to its line.
  padding: 2px 10px;
  border: 1px solid transparent;
  border-radius: 999px;

  &--off {
    opacity: 0.4;
  }
}

.timeline-chart__icon {
  height: 22px;
  width: auto;
  flex: 0 0 auto;
  align-self: center;
}

.timeline-chart__swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex: 0 0 auto;
  align-self: center;
}

.timeline-chart__legend-value {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.timeline-chart__legend-peak {
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}

.timeline-chart__legend-sep {
  opacity: 0.45;
}
</style>
