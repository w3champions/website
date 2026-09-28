<template>
  <timeline-chart
    :series="series"
    :axes="axes"
    :range-presets="rangePresets"
    :markers="markers"
    :extend-to="now"
    :gap-days="60"
    :min-range-days="30"
    :height="420"
  />
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import TimelineChart from "@/components/common/charts/TimelineChart.vue";
import type { TimelineAxis, TimelineMarker, TimelineRangePreset, TimelineSeries } from "@/components/common/charts/types";
import type { LifetimeRaceSeries, PlayerLifetimeTimeline } from "@/store/player/types";
import { raceIconSrc, useRaceColors } from "@/helpers/raceColors";
import { RACE_LABELS, seasonMarkers, toDayMs } from "@/components/player/lifetime";

export default defineComponent({
  name: "PlayerLifetimeMmrChart",
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
    const series = computed<TimelineSeries[]>(() =>
      (props.lifetimeTimeline.series ?? [])
        .filter((s: LifetimeRaceSeries) => s.points.length > 0)
        .map((s: LifetimeRaceSeries) => ({
          key: String(s.race),
          label: RACE_LABELS[s.race] ?? String(s.race),
          color: raceColor(s.race),
          icon: raceIconSrc(s.race),
          yAxisID: "y",
          points: s.points.map((p) => ({ x: toDayMs(p.date), y: p.mmr })),
          // Supplied only once the player's history has been migrated. Without
          // it the chart falls back to the plain maximum, which would count
          // placement games.
          peak: s.peak ? { x: toDayMs(s.peak.date), y: s.peak.mmr } : undefined,
          format: (value: number) => String(Math.round(value)),
        })),
    );

    const markers = computed<TimelineMarker[]>(() => seasonMarkers(props.lifetimeTimeline));

    const axes: TimelineAxis[] = [{ id: "y", title: "MMR", minRange: 200 }];

    const rangePresets: TimelineRangePreset[] = [
      { key: "3m", label: "3M", months: 3 },
      { key: "6m", label: "6M", months: 6 },
      { key: "1y", label: "1Y", months: 12 },
      { key: "all", label: "All", default: true },
    ];

    // A rating still stands on days with no games, so carry every race forward
    // to today rather than stopping at whenever it was last played.
    const now = Date.now();

    return {
      series,
      axes,
      markers,
      rangePresets,
      now,
    };
  },
});
</script>
