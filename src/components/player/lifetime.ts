import { format, parseJSON, startOfDay } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { ERaceEnum } from "@/store/types";
import type { TimelineMarker } from "@/components/common/charts/types";
import type { PlayerLifetimeTimeline } from "@/store/player/types";

/**
 * Ranking points were rebuilt on a new scale partway through season 13. Values
 * on the old system run into the thousands; the current one tops out in the
 * sixties, so magnitude tells the two apart more reliably than a season number.
 */
export const LEGACY_RP_THRESHOLD = 100;

export const RACE_LABELS: Record<number, string> = {
  [ERaceEnum.HUMAN]: "Human",
  [ERaceEnum.ORC]: "Orc",
  [ERaceEnum.NIGHT_ELF]: "Night Elf",
  [ERaceEnum.UNDEAD]: "Undead",
  [ERaceEnum.RANDOM]: "Random",
  // Modes outside 1v1 keep one rating whatever race is picked, so the backend
  // returns a single combined series rather than one per race.
  [ERaceEnum.TOTAL]: "All races",
};

/** True for the single combined series returned for non race-split modes. */
export const isCombinedSeries = (race: ERaceEnum): boolean => race === ERaceEnum.TOTAL;

/** Prevents a date sliding into the next day under a negative UTC offset. */
export const toDayMs = (date: string): number => startOfDay(utcToZonedTime(parseJSON(date), "UTC")).getTime();

/** Season 0 was the beta, and reads better as such than as a zero. */
export const seasonLabel = (season: number): string => (season === 0 ? "\u03b2" : String(season));

/** Marker captions are terser than the strip's, so they don't crowd the plot. */
export const seasonMarkerLabel = (season: number): string => (season === 0 ? "\u03b2" : `S${season}`);

/**
 * One reference line per season, placed where the season begins. Every season
 * is included, including the first: the chart also uses these to name the
 * season a hovered point falls in, and skipping the first would leave the
 * earliest games unlabelled.
 */
export const seasonMarkers = (timeline: PlayerLifetimeTimeline): TimelineMarker[] => (timeline.seasons ?? []).map((s) => ({ x: toDayMs(s.start), label: seasonMarkerLabel(s.season) }));

export type SeasonRaceStat = {
  race: ERaceEnum;
  label: string;
  peak: number;
  games: number;
  /** False where the period predates game counting, so games is a floor of 0. */
  known: boolean;
};

export type SeasonBreakdown = {
  season: number;
  label: string;
  title: string;
  range: string;
  races: SeasonRaceStat[];
  peak: number;
  peakRace: ERaceEnum;
  games: number;
  gamesKnown: boolean;
  /** Most played that season, falling back to the peak holder when nothing is counted. */
  topGamesRace: ERaceEnum;
};

/**
 * Per-season, per-race peaks and game counts, which is what both season bar
 * charts need. Peaks here are ungated highs read off the plotted points, unlike
 * the single all-time peak the server computes, so an early season can be
 * flattered by placement games.
 */
export const seasonBreakdown = (timeline: PlayerLifetimeTimeline): SeasonBreakdown[] => {
  const bySeason = new Map<number, Map<ERaceEnum, SeasonRaceStat>>();

  for (const season of timeline.seasons ?? []) {
    const from = toDayMs(season.start);
    const to = toDayMs(season.end);
    const races = new Map<ERaceEnum, SeasonRaceStat>();

    for (const series of timeline.series ?? []) {
      for (const point of series.points) {
        const at = toDayMs(point.date);
        if (at < from || at > to) continue;
        const existing = races.get(series.race) ?? {
          race: series.race,
          label: RACE_LABELS[series.race] ?? String(series.race),
          peak: 0,
          games: 0,
          known: false,
        };
        races.set(series.race, {
          ...existing,
          peak: Math.max(existing.peak, point.mmr),
          games: existing.games + (point.games ?? 0),
          known: existing.known || point.games != null,
        });
      }
    }

    if (races.size > 0) bySeason.set(season.season, races);
  }

  const spans = new Map((timeline.seasons ?? []).map((s) => [s.season, s]));

  return [...bySeason.entries()]
    .map(([season, races]) => {
      const list = [...races.values()].sort((a, b) => b.peak - a.peak);
      const span = spans.get(season);
      const byGames = [...list].sort((a, b) => b.games - a.games);
      return {
        season,
        label: seasonLabel(season),
        title: season === 0 ? "Beta season" : `Season ${season}`,
        range: span ? `${format(toDayMs(span.start), "MMM yyyy")} – ${format(toDayMs(span.end), "MMM yyyy")}` : "",
        races: list,
        peak: list[0].peak,
        peakRace: list[0].race,
        games: list.reduce((sum, r) => sum + r.games, 0),
        gamesKnown: list.some((r) => r.known),
        // Most played, falling back to the peak holder when nothing is counted.
        topGamesRace: byGames[0].games > 0 ? byGames[0].race : list[0].race,
      };
    })
    .sort((a, b) => a.season - b.season);
};

/** Scales bars within the observed band; from zero they would all look alike. */
export const barHeight = (value: number, min: number, max: number): number => 15 + ((value - min) / Math.max(max - min, 1)) * 85;
