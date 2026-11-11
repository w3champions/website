import { stripWc3Text } from "@/components/common/wc3Text";
import type { MapInfo } from "@/store/common/types";
import type { MapCount } from "@/store/overallStats/types";
import type { RaceStat, WinLossesOnMap } from "@/store/player/types";
import type { ERaceEnum } from "@/store/types";

// The statistics endpoints return one entry per map file. A map can have many
// files (one per version), so the views group entries by map name, falling back
// to the file name when an entry has no name. Names are compared exactly: no
// case or punctuation normalisation, and different map ids sharing a name merge.

/** Key of the all-maps entry in the statistics lists. */
export const OVERALL_MAP = "Overall";

type MapEntry = {
  map?: string | null;
  mapName?: string | null;
};

type RaceCounts = {
  race: ERaceEnum;
  wins: number;
  losses: number;
  games: number;
  winrate: number;
};

/** The group an entry belongs to: its map name without colour codes, else its file name. */
export function mapGroupKey(entry: MapEntry): string {
  // Older all-maps entries carry the key in `mapName` and have no `map`.
  if (entry.map === OVERALL_MAP || (!entry.map && entry.mapName === OVERALL_MAP)) {
    return OVERALL_MAP;
  }
  return stripWc3Text(entry.mapName ?? undefined) || entry.map || "";
}

/** Sort order for group keys: the all-maps entry first, then by name. */
export function compareMapGroupKeys(a: string, b: string): number {
  if (a === b) return 0;
  if (a === OVERALL_MAP) return -1;
  if (b === OVERALL_MAP) return 1;
  return a.localeCompare(b);
}

/** Sums wins, losses and games per race; the winrate is recomputed from the sums. */
export function mergeRaceStats<T extends RaceCounts>(lists: T[][]): T[] {
  const byRace = new Map<ERaceEnum, T>();
  for (const list of lists) {
    for (const stat of list) {
      const existing = byRace.get(stat.race);
      if (!existing) {
        byRace.set(stat.race, { ...stat });
        continue;
      }
      existing.wins += stat.wins;
      existing.losses += stat.losses;
      existing.games += stat.games;
    }
  }
  return Array.from(byRace.values()).map((stat) => ({
    ...stat,
    winrate: stat.wins + stat.losses !== 0 ? stat.wins / (stat.wins + stat.losses) : 0,
  }));
}

/** One entry per map name with the summed count, sorted by name. */
export function groupMapCounts(maps: MapCount[]): MapCount[] {
  const counts = new Map<string, number>();
  for (const entry of maps) {
    const key = mapGroupKey(entry);
    counts.set(key, (counts.get(key) ?? 0) + entry.count);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => compareMapGroupKeys(a, b))
    .map(([key, count]) => ({ map: key, mapName: key, count }));
}

/** Smallest share of a mode's games a map needs to get its own bar in the played-maps chart. */
export const RARE_MAP_SHARE = 0.001;

/**
 * Drops entries with less than `minShare` of the total count, keeping the order and the
 * all-maps entry. A few games played while a map pool was being switched would otherwise
 * show as bars close to zero.
 */
export function withoutRareMaps(groups: MapCount[], minShare = RARE_MAP_SHARE): MapCount[] {
  const total = groups.reduce((sum, entry) => sum + entry.count, 0);
  if (total === 0) return groups;
  return groups.filter((entry) => entry.map === OVERALL_MAP || entry.count / total >= minShare);
}

/** One entry per map name with the wins and losses merged by race; the all-maps entry first. */
export function groupWinLossesOnMap(list: WinLossesOnMap[]): WinLossesOnMap[] {
  const groups = new Map<string, RaceStat[][]>();
  for (const entry of list) {
    const key = mapGroupKey(entry);
    const group = groups.get(key);
    if (group) {
      group.push(entry.winLosses);
    } else {
      groups.set(key, [entry.winLosses]);
    }
  }
  const grouped = Array.from(groups.entries()).map(([key, winLosses]) => ({
    map: key,
    mapName: key,
    winLosses: mergeRaceStats(winLosses),
  }));
  return [
    ...grouped.filter((entry) => entry.map === OVERALL_MAP),
    ...grouped.filter((entry) => entry.map !== OVERALL_MAP),
  ];
}

/** The merged wins and losses of every entry in the given group, or undefined when there is none. */
export function winLossesForMapGroup(list: WinLossesOnMap[], key: string): RaceStat[] | undefined {
  const matching = list.filter((entry) => mapGroupKey(entry) === key);
  if (matching.length === 0) return undefined;
  return mergeRaceStats(matching.map((entry) => entry.winLosses));
}

/** Distinct group keys of the entries, sorted, as map select options. */
export function mapGroupKeys(entries: MapEntry[]): string[] {
  return [...new Set(entries.map(mapGroupKey))].filter((key) => key !== "").sort(compareMapGroupKeys);
}

/** One map select option per map name; the value is the name, used as the matches filter. */
export function mapGroupInfos(entries: MapEntry[]): MapInfo[] {
  return mapGroupKeys(entries).map((key) => ({ map: key, mapName: key }));
}
