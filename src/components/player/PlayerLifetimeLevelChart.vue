<template>
  <div>
    <timeline-chart
      v-if="series.length"
      :series="series"
      :axes="axes"
      :markers="markers"
      :range-presets="rangePresets"
      :gap-days="60"
      :min-range-days="30"
      :height="300"
    />
    <div v-else class="text-medium-emphasis">
      No Level history on the current system for this player.
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import TimelineChart from "@/components/common/charts/TimelineChart.vue";
import type { TimelineAxis, TimelineMarker, TimelineRangePreset, TimelineSeries } from "@/components/common/charts/types";
import type { LifetimeRaceSeries, PlayerLifetimeTimeline } from "@/store/player/types";
import { raceIconSrc, useRaceColors } from "@/helpers/raceColors";
import { LEGACY_RP_THRESHOLD, RACE_LABELS, seasonMarkers, toDayMs } from "@/components/player/lifetime";

export default defineComponent({
  name: "PlayerLifetimeLevelChart",
  components: {
    TimelineChart,
  },
  props: {
    lifetimeTimeline: {
      type: Object as PropType<PlayerLifetimeTimeline>,
      required: true,
    },
  },
  setup(props) {
    const { raceColor } = useRaceColors();
    // Ranking points were rebuilt on a new scale partway through season 13. The
    // old values run into the thousands, so mixing them in would flatten every
    // real one against the axis. Only the current scale is plotted.
    const series = computed<TimelineSeries[]>(() =>
      (props.lifetimeTimeline.series ?? [])
        .map((s: LifetimeRaceSeries) => {
          const points = s.points
            .filter((p) => p.rp != null && p.rp < LEGACY_RP_THRESHOLD)
            .map((p) => ({ x: toDayMs(p.date), y: p.rp as number }));

          return {
            key: String(s.race),
            label: RACE_LABELS[s.race] ?? String(s.race),
            color: raceColor(s.race),
            icon: raceIconSrc(s.race),
            yAxisID: "y",
            points,
            format: (value: number) => value.toFixed(2),
          };
        })
        .filter((s) => s.points.length > 0),
    );

    // Only boundaries the plotted data actually spans, so the pre-change
    // seasons don't crowd the left edge with lines that mark nothing.
    const markers = computed<TimelineMarker[]>(() => {
      const earliest = Math.min(...series.value.map((s) => s.points[0].x));
      return seasonMarkers(props.lifetimeTimeline).filter((m) => m.x >= earliest);
    });

    const axes: TimelineAxis[] = [{ id: "y", title: "Level", minRange: 10 }];

    const rangePresets: TimelineRangePreset[] = [
      { key: "6m", label: "6M", months: 6 },
      { key: "1y", label: "1Y", months: 12 },
      { key: "all", label: "All", default: true },
    ];

    return { series, axes, markers, rangePresets };
  },
});
</script>
