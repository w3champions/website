import { LEAGUE_NAMES } from "@/helpers/progression-rank";
import { EProgressionLeague } from "@/store/types";

// Apex leagues (Grand Master, Master) have no divisions; every other league has 4.
export const APEX_LEAGUES = [EProgressionLeague.GrandMaster, EProgressionLeague.Master] as const;
export const FIRST_DIVISION = 1;
export const DIVISIONS_PER_LEAGUE = 4;
// The regular (non-apex) league range, best to worst, driven by the enum.
const FIRST_NON_APEX_LEAGUE = EProgressionLeague.Adept;
const LOWEST_LEAGUE = EProgressionLeague.Grass;

export type ProgressionTier = {
  league: EProgressionLeague;
  // Apex tiers (Grand Master / Master) carry no division.
  division?: number;
};

// True for the apex leagues (Grand Master, Master), which render as the apex leaderboard and
// have no divisions.
export function isApexLeague(league: EProgressionLeague): boolean {
  return league === EProgressionLeague.GrandMaster || league === EProgressionLeague.Master;
}

// True for the apex tiers (their league is an apex league).
export function isApexTier(tier: ProgressionTier): boolean {
  return isApexLeague(tier.league);
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
//   Grand Master, Master, then each remaining league split into divisions 1..DIVISIONS_PER_LEAGUE.
export function progressionTiers(): ProgressionTier[] {
  const tiers: ProgressionTier[] = APEX_LEAGUES.map((league) => ({ league }));

  for (let league = FIRST_NON_APEX_LEAGUE; league <= LOWEST_LEAGUE; league++) {
    for (let division = FIRST_DIVISION; division < FIRST_DIVISION + DIVISIONS_PER_LEAGUE; division++) {
      tiers.push({ league, division });
    }
  }

  return tiers;
}

// The default landing tier for a progression mode: the first division of the first non-apex league.
export const DEFAULT_PROGRESSION_TIER: ProgressionTier = {
  league: FIRST_NON_APEX_LEAGUE,
  division: FIRST_DIVISION,
};

// Tiers grouped by league for a grouped selector: an ordered list of leagues, each with its
// label, league index (icon), and the tiers under it (a single tier for apex leagues).
export type ProgressionTierGroup = {
  league: EProgressionLeague;
  label: string;
  tiers: ProgressionTier[];
};

export function progressionTierGroups(): ProgressionTierGroup[] {
  const groups = new Map<EProgressionLeague, ProgressionTierGroup>();
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
