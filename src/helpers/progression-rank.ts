import type { ProgressionRank } from "@/store/ranking/types";

// League index matches the legacy `leagueOrder` scale: 0 = Grandmaster (best) … 8 = Grass (worst).
export const LEAGUE_NAMES = [
  "grandmaster",
  "master",
  "adept",
  "diamond",
  "platinum",
  "gold",
  "silver",
  "bronze",
  "grass",
] as const;

export function leagueName(league: number): string {
  return LEAGUE_NAMES[league] ?? "";
}

// Apex (Master / Grand Master) is distinguished by a non-null apexPoints.
export function isApexRank(progression: ProgressionRank): boolean {
  return progression.apexPoints != null;
}

// Lower result = better rank. Lower league number is better; apex compares by apexPoints,
// otherwise by division (lower better) then points (higher better).
export function compareProgressionRank(a: ProgressionRank, b: ProgressionRank): number {
  if (a.league !== b.league) return a.league - b.league;
  const aApex = isApexRank(a);
  const bApex = isApexRank(b);
  // Within a league, apex (Master/Grand Master) always outranks non-apex.
  if (aApex !== bApex) return aApex ? -1 : 1;
  if (aApex && bApex) return (b.apexPoints ?? 0) - (a.apexPoints ?? 0);
  if (a.division !== b.division) return a.division - b.division;
  return b.points - a.points;
}

function sameProgressionRank(a: ProgressionRank, b: ProgressionRank): boolean {
  return compareProgressionRank(a, b) === 0;
}

// Competition ranking (1, 2, 2, 4) over a list that is ALREADY ordered best-to-worst by
// progression rank (no internal sort is performed; unsorted input produces incorrect ranks).
// Consecutive entries with an identical rank share a position number. Entries without a
// progression rank do not participate in tie-grouping for the entries that follow them.
export function assignDisplayRanks<T>(
  items: T[],
  getProgression: (item: T) => ProgressionRank | null | undefined,
): Array<{ item: T; displayRank: number }> {
  const result: Array<{ item: T; displayRank: number }> = [];
  let lastProgression: ProgressionRank | null = null;
  let lastRank = 0;

  items.forEach((item, index) => {
    const progression = getProgression(item) ?? null;
    let rank: number;
    if (progression !== null && lastProgression !== null && sameProgressionRank(progression, lastProgression)) {
      rank = lastRank;
    } else {
      rank = index + 1;
    }
    result.push({ item, displayRank: rank });
    if (progression !== null) {
      lastProgression = progression;
      lastRank = rank;
    } else {
      // A rankless entry breaks the tie chain so an earlier rank can't bleed onto later entries.
      lastProgression = null;
    }
  });

  return result;
}
