<template>
  <!-- No range presets: a season is short enough to read whole. -->
  <timeline-chart :series="series" :axes="axes" :extend-to="extendTo" />
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, type PropType } from "vue";
import type { PlayerMmrRpTimeline } from "@/store/player/types";
import { parseJSON, startOfDay } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import TimelineChart from "@/components/common/charts/TimelineChart.vue";
import type { TimelineAxis, TimelineSeries } from "@/components/common/charts/types";
import { usePlayerStore } from "@/store/player/store";
import { useRankingStore } from "@/store/ranking/store";

export default defineComponent({
  name: "PlayerMmrRpTimelineChart",
  components: {
    TimelineChart,
  },
  props: {
    mmrRpTimeline: {
      type: Object as PropType<PlayerMmrRpTimeline>,
      required: true,
    },
  },
  setup(props) {
    const playerStore = usePlayerStore();
    const rankingStore = useRankingStore();

    // Workaround: prevent dates from moving into the next day due to timezone conversion.
    const toDay = (date: string): number => startOfDay(utcToZonedTime(parseJSON(date), "UTC")).getTime();

    onMounted(async (): Promise<void> => {
      await rankingStore.retrieveSeasons(); // No-op once loaded.
    });

    // An ongoing season runs to today, so the time since the last game is
    // visible instead of the chart stopping at the newest match. Past seasons
    // end where their data ends.
    const extendTo = computed<number | null>(() => {
      const currentSeason = rankingStore.seasons[0]?.id;
      if (currentSeason == null || playerStore.selectedSeason?.id !== currentSeason) return null;
      return Date.now();
    });

    // Ranking points were rebuilt on a new scale partway through season 13
    // (2022-11-29): before that a "Level" was in the thousands, after it the
    // ceiling is somewhere in the 60s. Season 13 therefore holds both, and one
    // legacy value flattens the axis for every real one. Where a series mixes
    // the two, keep only the current scale; a series that is entirely legacy
    // (season 12 and earlier) is left alone so those charts still plot.
    const LEGACY_RP_THRESHOLD = 100;

    const currentScaleRp = (entries: { rp: number | null }[]): ((rp: number) => boolean) => {
      const hasCurrentScale = entries.some((e) => e.rp != null && e.rp < LEGACY_RP_THRESHOLD);
      return (rp: number) => !hasCurrentScale || rp < LEGACY_RP_THRESHOLD;
    };

    const series = computed<TimelineSeries[]>(() => {
      const entries = props.mmrRpTimeline.mmrRpAtDates ?? [];
      const keepRp = currentScaleRp(entries);

      return [
        {
          key: "mmr",
          label: "MMR",
          color: "rgb(54, 162, 235)",
          yAxisID: "y",
          points: entries.map((e) => ({ x: toDay(e.date), y: e.mmr })),
          format: (value: number) => String(Math.round(value)),
        },
        {
          key: "rp",
          label: "Level",
          color: "rgb(150, 80, 100)",
          yAxisID: "y1",
          points: entries.filter((e) => e.rp != null && keepRp(e.rp)).map((e) => ({ x: toDay(e.date), y: e.rp })),
          format: (value: number) => value.toFixed(2),
        },
      ].filter((s) => s.points.length > 0);
    });

    // Only declare axes that a series actually uses, so dropping the Level
    // series doesn't leave an orphaned right-hand axis.
    const axes = computed<TimelineAxis[]>(() => {
      const used = new Set(series.value.map((s) => s.yAxisID));
      return ([
        { id: "y", title: "MMR", minRange: 200 },
        // Only meaningful against the current Level scale; a legacy series sits
        // in the thousands, where a floor of 10 is a no-op anyway.
        { id: "y1", title: "Level", position: "right" as const, minRange: 10 },
      ]).filter((axis) => used.has(axis.id));
    });

    return {
      series,
      axes,
      extendTo,
    };
  },
});
</script>
