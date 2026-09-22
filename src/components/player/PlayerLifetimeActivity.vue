<template>
  <div class="activity">
    <div class="activity__header" :style="frameWidth">
      <div class="activity__nav">
        <v-btn
          :icon="mdiChevronLeft"
          size="small"
          variant="tonal"
          :disabled="!canGoBack"
          aria-label="Earlier"
          @click="goBack"
        />
        <span class="activity__range">{{ rangeLabel }}</span>
        <v-btn
          :icon="mdiChevronRight"
          size="small"
          variant="tonal"
          :disabled="offset === 0"
          aria-label="Later"
          @click="goForward"
        />
        <span v-if="!countsKnown" class="activity__note">
          game counts unavailable for this period &mdash; showing days played
        </span>
      </div>

      <div v-if="availableRaces.length > 1" class="activity__races">
        <v-btn
          size="34"
          icon
          :variant="selectedRace === null ? 'tonal' : 'text'"
          :class="{ 'activity__race--on': selectedRace === null }"
          title="All races"
          aria-label="All races"
          @click="selectedRace = null"
        >
          <span class="activity__race-all">All</span>
        </v-btn>
        <v-btn
          v-for="race in availableRaces"
          :key="race.race"
          size="34"
          icon
          :variant="selectedRace === race.race ? 'tonal' : 'text'"
          :aria-label="race.label"
          :title="race.label"
          :class="{ 'activity__race--on': selectedRace === race.race }"
          @click="selectedRace = race.race"
        >
          <img class="activity__race-icon" :src="race.icon" :alt="race.label" />
        </v-btn>
      </div>
    </div>

    <div class="activity__frame">
      <!-- Outside the scroller, so the day labels stay put while the year moves. -->
      <div class="activity__weekdays">
        <span v-for="(day, i) in weekdayLabels" :key="i" class="activity__weekday">{{ day }}</span>
      </div>

      <div ref="scroller" class="activity__scroll">
        <div class="activity__months" :style="gridColumns">
          <span
            v-for="month in monthLabels"
            :key="month.key"
            class="activity__month"
            :style="{ gridColumn: month.column }"
          >{{ month.label }}</span>
        </div>

        <div class="activity__grid" :style="gridColumns" @mouseleave="hovered = null">
          <div
            v-for="cell in cells"
            :key="cell.key"
            class="activity__cell"
            :style="{ backgroundColor: cell.color, gridRow: cell.row, gridColumn: cell.column }"
            @mouseenter="onEnter(cell, $event)"
          ></div>
        </div>
      </div>
    </div>

    <!-- One shared tooltip rather than one per day: a year is 365 cells, and
         that many overlay components is not worth the convenience. -->
    <div
      v-if="hovered"
      class="activity__tooltip chartlike-tooltip"
      :style="{ left: `${hovered.x}px`, top: `${hovered.y}px` }"
    >
      <div class="activity__tip-title">{{ hovered.date }}</div>
      <div v-if="!hovered.rows.length">{{ hovered.summary }}</div>
      <template v-else>
        <div class="activity__tip-sub">{{ hovered.summary }}</div>
        <table class="activity__tip-table">
          <tr v-for="row in hovered.rows" :key="row.label">
            <td>
              <span class="activity__swatch" :style="{ backgroundColor: row.color }"></span>
              {{ row.label }}
            </td>
            <td class="activity__tip-value">{{ row.value }}</td>
          </tr>
        </table>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, type PropType, ref, watch } from "vue";
import { addDays, differenceInCalendarDays, format, startOfDay } from "date-fns";
import { mdiChevronLeft, mdiChevronRight } from "@mdi/js";
import type { PlayerLifetimeTimeline } from "@/store/player/types";
import { ERaceEnum } from "@/store/types";
import { raceIconSrc, useRaceColors } from "@/helpers/raceColors";
import { isCombinedSeries, RACE_LABELS, toDayMs } from "@/components/player/lifetime";

// Monday first, so Saturday and Sunday sit together at the bottom instead of
// being split across the top and bottom edges.
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const CELL = 16;
const GAP = 2;
// .activity__weekday width (0.8rem) and .activity__frame's gap.
const WEEKDAY_COLUMN = 13;
const FRAME_GAP = 6;

type DayRace = { race: ERaceEnum; games: number; known: boolean };
type Day = { races: DayRace[]; total: number; known: boolean; top: ERaceEnum };
type TipRow = { label: string; color: string; value: string };
type Cell = { key: number; row: number; column: number; color: string; date: string; summary: string; rows: TipRow[] };

export default defineComponent({
  name: "PlayerLifetimeActivity",
  props: {
    lifetimeTimeline: {
      type: Object as PropType<PlayerLifetimeTimeline>,
      required: true,
    },
  },
  setup(props) {
    const { raceColor } = useRaceColors();
    // 0 is the rolling twelve months up to today; each step back is a whole
    // calendar year, which is how people tend to think about a past season.
    const offset = ref<number>(0);
    const scroller = ref<HTMLElement>();
    const hovered = ref<{ x: number; y: number; date: string; summary: string; rows: TipRow[] } | null>(null);
    /** Null shows every race combined. */
    const selectedRace = ref<ERaceEnum | null>(null);

    // A single combined series has nothing to filter by.
    const availableRaces = computed(() =>
      (props.lifetimeTimeline.series ?? [])
        .filter((s) => s.points.length > 0 && !isCombinedSeries(s.race))
        .map((s) => ({
          race: s.race,
          label: RACE_LABELS[s.race] ?? String(s.race),
          icon: raceIconSrc(s.race),
        })),
    );

    /**
     * What was played each day, split by race. The hue comes from the race that
     * played most, so the mosaic shows what a player was doing as well as how
     * much; where counts were never recorded each race's appearance counts once,
     * which is enough to pick a dominant race but not a volume.
     */
    const byDay = computed(() => {
      const days = new Map<number, Map<ERaceEnum, DayRace>>();

      const series1 = (props.lifetimeTimeline.series ?? [])
        .filter((s) => selectedRace.value === null || s.race === selectedRace.value);

      for (const series of series1) {
        for (const point of series.points) {
          const day = toDayMs(point.date);
          const races = days.get(day) ?? new Map<ERaceEnum, DayRace>();
          const existing = races.get(series.race) ?? { race: series.race, games: 0, known: false };
          races.set(series.race, {
            race: series.race,
            games: existing.games + (point.games ?? 1),
            known: existing.known || point.games != null,
          });
          days.set(day, races);
        }
      }

      const out = new Map<number, Day>();
      for (const [day, races] of days) {
        const list = [...races.values()].sort((a, b) => b.games - a.games);
        out.set(day, {
          races: list,
          total: list.reduce((sum, r) => sum + r.games, 0),
          known: list.some((r) => r.known),
          top: list[0].race,
        });
      }
      return out;
    });

    const earliest = computed<number>(() => {
      const days = [...byDay.value.keys()];
      return days.length ? Math.min(...days) : Date.now();
    });

    const range = computed(() => {
      if (offset.value === 0) {
        const end = startOfDay(new Date());
        return { start: addDays(end, -364), end, label: "Last 12 months" };
      }
      const year = new Date().getFullYear() - offset.value;
      return {
        start: startOfDay(new Date(year, 0, 1)),
        end: startOfDay(new Date(year, 11, 31)),
        label: String(year),
      };
    });

    const canGoBack = computed<boolean>(() => range.value.start.getTime() > earliest.value);

    /** Monday-based weekday index, 0..6. */
    const rowOf = (date: Date): number => (date.getDay() + 6) % 7;

    const cells = computed<Cell[]>(() => {
      const { start, end } = range.value;
      const total = differenceInCalendarDays(end, start) + 1;
      const busiest = Math.max(...[...byDay.value.values()].map((d) => d.total), 1);
      const startRow = rowOf(start);
      const out: Cell[] = [];

      for (let i = 0; i < total; i++) {
        const date = addDays(start, i);
        const day = byDay.value.get(date.getTime());

        out.push({
          key: date.getTime(),
          row: rowOf(date) + 1,
          column: Math.floor((i + startRow) / 7) + 1,
          color: cellColor(day, busiest),
          date: format(date, "EEE d MMM yyyy"),
          summary: !day
            ? "No games"
            : day.known
              ? `${day.total} ${day.total === 1 ? "game" : "games"}`
              : "Played — count not recorded",
          rows: !day || !day.known ? [] : day.races.map((r) => ({
            label: RACE_LABELS[r.race] ?? String(r.race),
            color: raceColor(r.race),
            value: `${r.games}`,
          })),
        });
      }
      return out;
    });

    const weeks = computed<number>(() => Math.max(...cells.value.map((c) => c.column), 1));

    // The grid is a known number of fixed columns, so its width can be derived
    // rather than measured. Capping the header to it puts the race buttons on
    // the grid's right edge; on a narrow screen the cap simply never applies.
    const frameWidth = computed(() => ({
      // n columns have n-1 gaps between them, not n.
      maxWidth: `${WEEKDAY_COLUMN + FRAME_GAP + weeks.value * CELL + (weeks.value - 1) * GAP}px`,
    }));
    const gridColumns = computed(() => ({ gridTemplateColumns: `repeat(${weeks.value}, ${CELL}px)` }));

    /**
     * A label per month, over the column holding that month's 1st. Anchoring on
     * the 1st rather than the first visible day means a range starting mid-month
     * doesn't get a label crammed against the next one. The leading label and
     * every January carry the year, so a column can be placed without reading
     * the header.
     */
    const monthLabels = computed(() => {
      const firsts = cells.value.filter((cell) => new Date(cell.key).getDate() === 1);
      return firsts.map((cell, i) => {
        const date = new Date(cell.key);
        const withYear = i === 0 || date.getMonth() === 0;
        return {
          key: format(date, "yyyy-MM"),
          label: format(date, withYear ? "MMM ''yy" : "MMM"),
          column: cell.column,
        };
      });
    });

    const countsKnown = computed<boolean>(() =>
      [...byDay.value.entries()].some(([day, d]) =>
        d.known && day >= range.value.start.getTime() && day <= range.value.end.getTime()
      )
    );

    function cellColor(day: Day | undefined, busiest: number): string {
      if (!day) return "rgba(150, 150, 150, 0.12)";
      // A flat mid tone where volume is unknown, rather than implying one.
      if (!day.known) return raceColor(day.top, 0.5);
      return raceColor(day.top, Number((0.3 + (day.total / busiest) * 0.7).toFixed(2)));
    }

    function onEnter(cell: Cell, event: MouseEvent): void {
      const target = event.currentTarget as HTMLElement;
      const host = target.closest(".activity") as HTMLElement;
      const box = target.getBoundingClientRect();
      const origin = host.getBoundingClientRect();
      hovered.value = {
        x: box.left - origin.left + box.width / 2,
        y: box.top - origin.top - 6,
        date: cell.date,
        summary: cell.summary,
        rows: cell.rows,
      };
    }

    /** The newest weeks are the interesting ones, so start at that end. */
    const scrollToEnd = async (): Promise<void> => {
      await nextTick();
      if (scroller.value) scroller.value.scrollLeft = scroller.value.scrollWidth;
    };

    onMounted(scrollToEnd);
    watch(() => range.value.label, scrollToEnd);

    const goBack = (): void => { offset.value += 1; };
    const goForward = (): void => { offset.value = Math.max(0, offset.value - 1); };

    return {
      offset,
      cells,
      scroller,
      hovered,
      onEnter,
      gridColumns,
      monthLabels,
      weekdayLabels: WEEKDAYS,
      canGoBack,
      countsKnown,
      rangeLabel: computed(() => range.value.label),
      selectedRace,
      availableRaces,
      frameWidth,
      goBack,
      goForward,
      mdiChevronLeft,
      mdiChevronRight,
    };
  },
});
</script>

<style lang="scss" scoped>
.activity {
  position: relative;
}

.activity__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.85rem;
}

.activity__nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.activity__races {
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity__race-icon {
  height: 28px;
  width: auto;
}

.activity__race--on {
  outline: 1px solid currentcolor;
  outline-offset: -1px;
}

.activity__race-all {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0;
}

.activity__range {
  font-weight: 600;
  min-width: 9rem;
  text-align: center;
}

.activity__scroll {
  min-width: 0;
}

.activity__note {
  opacity: 0.6;
  font-size: 0.75rem;
}

.activity__frame {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.activity__weekdays {
  display: grid;
  grid-template-rows: repeat(7, 16px);
  gap: 2px;
  flex: 0 0 auto;
  // Clears the month row so each label lines up with its weekday.
  padding-top: 18px;
}

.activity__weekday {
  font-size: 0.7rem;
  line-height: 16px;
  opacity: 0.55;
  text-align: right;
  width: 0.8rem;
}

.activity__scroll {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.activity__months {
  display: grid;
  height: 18px;
  gap: 2px;
}

.activity__month {
  font-size: 0.7rem;
  opacity: 0.6;
  white-space: nowrap;
}

.activity__grid {
  display: grid;
  grid-template-rows: repeat(7, 16px);
  gap: 2px;
}

.activity__cell {
  border-radius: 2px;
}

.activity__tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  pointer-events: none;
  white-space: nowrap;
  z-index: 5;
}

.activity__tip-title {
  font-weight: 600;
}

.activity__tip-sub {
  opacity: 0.8;
}

.activity__tip-table {
  border-collapse: collapse;
  margin-top: 2px;
}

.activity__tip-value {
  padding-left: 12px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.activity__swatch {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 5px;
}
</style>
