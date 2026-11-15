<template>
  <div class="season-bars">
    <div v-for="bar in bars" :key="bar.season" class="season-bars__col">
      <span class="season-bars__value">{{ bar.value }}</span>
      <div class="season-bars__track">
        <div class="season-bars__bar" :style="{ height: `${bar.height}%`, backgroundColor: bar.color }">
          <v-tooltip
            activator="parent"
            location="top"
            open-delay="80"
            content-class="chartlike-tooltip"
          >
            <div class="season-bars__tip-title">{{ bar.title }}</div>
            <div class="season-bars__tip-sub">{{ bar.range }}</div>
            <table class="season-bars__tip-table">
              <tr v-for="row in bar.rows" :key="row.race">
                <td>
                  <span class="season-bars__swatch" :style="{ backgroundColor: row.color }"></span>
                  {{ row.label }}
                </td>
                <td class="season-bars__tip-value">{{ row.value }}</td>
              </tr>
            </table>
          </v-tooltip>
        </div>
      </div>
      <span class="season-bars__label">{{ bar.label }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import type { PlayerLifetimeTimeline } from "@/store/player/types";
import { useRaceColors } from "@/helpers/raceColors";
import { barHeight, seasonBreakdown } from "@/components/player/lifetime";

/**
 * A bar per season, of either the season's best rating or how much was played.
 * Both read the same per-season breakdown and colour the bar by the race that
 * led that measure, so the strip doubles as a race-usage history.
 */
export default defineComponent({
  name: "PlayerLifetimeSeasonBars",
  props: {
    lifetimeTimeline: {
      type: Object as PropType<PlayerLifetimeTimeline>,
      required: true,
    },
    metric: {
      type: String as PropType<"peak" | "games">,
      required: true,
    },
  },
  setup(props) {
    const { raceColor } = useRaceColors();
    const bars = computed(() => {
      const seasons = seasonBreakdown(props.lifetimeTimeline)
        .filter((s) => props.metric === "peak" || s.gamesKnown);
      if (seasons.length === 0) return [];

      const values = seasons.map((s) => (props.metric === "peak" ? s.peak : s.games));
      const min = Math.min(...values);
      const max = Math.max(...values);

      return seasons.map((s) => {
        const value = props.metric === "peak" ? s.peak : s.games;
        const leadRace = props.metric === "peak" ? s.peakRace : s.topGamesRace;

        // Every race is listed, not just the leader, so a bar's colour can be
        // checked against what the other races were doing that season.
        const rows = [...s.races]
          .sort((a, b) => (props.metric === "peak" ? b.peak - a.peak : b.games - a.games))
          .filter((r) => (props.metric === "peak" ? r.peak > 0 : r.games > 0))
          .map((r) => ({
            race: r.race,
            label: r.label,
            color: raceColor(r.race),
            value: props.metric === "peak" ? `${r.peak} MMR` : `${r.games} games`,
          }));

        return {
          season: s.season,
          label: s.label,
          value,
          title: props.metric === "peak"
            ? `${s.title} — peak ${s.peak} MMR`
            : `${s.title} — ${s.games} games`,
          range: s.range,
          rows,
          color: raceColor(leadRace),
          height: barHeight(value, min, max),
        };
      });
    });

    return { bars };
  },
});
</script>

<style lang="scss">
@use "@/components/player/lifetimeTooltip.scss";
</style>

<style lang="scss" scoped>
.season-bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 112px;
}

.season-bars__col {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.season-bars__track {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
}

.season-bars__bar {
  width: 100%;
  border-radius: 2px 2px 0 0;
  min-height: 2px;
}

.season-bars__value {
  font-size: 0.65rem;
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  // Numbers over narrow bars would otherwise widen the column.
  white-space: nowrap;
}

.season-bars__label {
  font-size: 0.65rem;
  opacity: 0.6;
  padding-top: 2px;
  font-variant-numeric: tabular-nums;
}

.season-bars__tip-title {
  font-weight: 600;
}

.season-bars__tip-sub {
  opacity: 0.8;
  margin-bottom: 3px;
}

.season-bars__tip-table {
  border-collapse: collapse;
}

.season-bars__tip-value {
  padding-left: 10px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.season-bars__swatch {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 5px;
}
</style>
