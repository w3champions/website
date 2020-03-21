import { Match } from '../typings';

export type PlayerState = {
  page: number,
  battleTag: string;
  totalMatches: number;
  playerProfile: PlayerProfile;
  matches: Match[];
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
  mode: string;
  wins: number;
  losses: number;
  rank: number;
  level: number;
  xp: number;
  bucket?: number;
};

export type RankStat = {
    title: string;
    level: number;
    xp: number;
    rank: number;
}
