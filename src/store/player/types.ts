import { Match } from '../typings';

export type PlayerState = {
  playerProfile: PlayerProfile;
  recentMatches: Match[];
  loadingRecentMatches: boolean;
  loadingProfile: boolean;
};

export type PlayerProfile = {
  account: string;
  server: number;
  stats: RaceStat[];
  ladder: ModeStat[];
  ranks: RankStat[];
};

export type RaceStat = {
  /**
   * 'human' | 'orc' | 'undead' | 'night_elf' | 'random' | 'total'
   */
  race: string;
  wins: number;
  losses: number;
  total: number;
  percentage: number;
};

export type ModeStat = {
  type: "Wins" | "Losses" | "Percentage";
  solo: number;
  twoOnTwo: number;
  threeOnThree: number;
  fourOnFour: number;
  ffa: number;
};

export type RankStat = {
    title: string;
    level: number;
    xp: number;
    rank: number;
}
