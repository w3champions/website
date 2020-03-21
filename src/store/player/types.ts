import { Match } from "../typings";

export type PlayerState = {
  page: number;
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
  race: Race;
  wins: number;
  losses: number;
  total: number;
  percentage: number;
};

export enum Race {
  human,
  orc,
  undead,
  nightElf,
  random,
  total
}

export type ModeStat = {
  mode: GameMode;
  wins: number;
  losses: number;
  rank: number;
  level: number;
  xp: number;
  bucket?: number;
};

export enum GameMode {
  _1v1,
  _2v2,
  _3v3,
  _4v4,
  ffa
}

export type RankStat = {
  title: string;
  level: number;
  xp: number;
  rank: number;
};
