import { LEAGUE_NAMES } from "@/helpers/progression-rank";

// Apex leagues (Grand Master, Master) have no divisions; every other league has 4.
export const APEX_LEAGUES = [0, 1] as const;
export const DIVISIONS_PER_LEAGUE = 4;
const LOWEST_LEAGUE = LEAGUE_NAMES.length - 1; // 8 = Grass

export type ProgressionTier = {
  league: number;
  // Apex tiers (Grand Master / Master) carry no division.
  division?: number;
};

// True for the apex tiers (Grand Master = 0, Master = 1), which are rendered as the
// apex leaderboard and have no divisions.
export function isApexTier(tier: ProgressionTier): boolean {
  return APEX_LEAGUES.includes(tier.league as (typeof APEX_LEAGUES)[number]);
}

// The display label for a tier: the league name, plus the division number for non-apex tiers.
export function tierLabel(tier: ProgressionTier): string {
  const name = LEAGUE_NAMES[tier.league] ?? "";
  if (isApexTier(tier) || tier.division == null) {
    return name;
  }
  return `${name} ${tier.division}`;
}

// Stable identity for a tier, usable as a list key.
export function tierKey(tier: ProgressionTier): string {
  return isApexTier(tier) ? `apex-${tier.league}` : `${tier.league}-${tier.division}`;
}

// The ordered list of progression tiers, best to worst:
//   Grand Master, Master, then leagues 2..8 each split into divisions 1..4.
export function progressionTiers(): ProgressionTier[] {
  const tiers: ProgressionTier[] = APEX_LEAGUES.map((league) => ({ league }));

  for (let league = APEX_LEAGUES.length; league <= LOWEST_LEAGUE; league++) {
    for (let division = 1; division <= DIVISIONS_PER_LEAGUE; division++) {
      tiers.push({ league, division });
    }
  }

  return tiers;
}

// Tiers grouped by league for a grouped selector: an ordered list of leagues, each with its
// label, league index (icon), and the tiers under it (a single tier for apex leagues).
export type ProgressionTierGroup = {
  league: number;
  label: string;
  tiers: ProgressionTier[];
};

export function progressionTierGroups(): ProgressionTierGroup[] {
  const groups = new Map<number, ProgressionTierGroup>();
  for (const tier of progressionTiers()) {
    let group = groups.get(tier.league);
    if (!group) {
      group = { league: tier.league, label: LEAGUE_NAMES[tier.league] ?? "", tiers: [] };
      groups.set(tier.league, group);
    }
    group.tiers.push(tier);
  }
  return [...groups.values()];
}
