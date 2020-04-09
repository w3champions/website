import { EGameMode, ERaceEnum, Match } from "../typings";

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
  id: string;
  name: string;
  battleTag: string;
  raceStats: RaceStat[];
  gameModeStats: ModeStat[];
  ranks: RankStat[];
};

export type WinRate = {
  wins: number;
  losses: number;
  games: number;
  winrate: number;
};

export type RaceStat = {
  /**
   * 'human' | 'orc' | 'undead' | 'night_elf' | 'random' | 'total'
   */
  race: ERaceEnum;
  wins: number;
  losses: number;
  total: number;
  percentage: number;
};

export type ModeStat = {
  mode: EGameMode;
  wins: number;
  losses: number;
  winrate: number;
  mmr: number;
};

export type RankStat = {
  title: string;
  level: number;
  xp: number;
  rank: number;
};
