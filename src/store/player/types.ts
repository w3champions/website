import { EGameMode, ERaceEnum, Match, Mmr } from "../typings";

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
  ladder: {
    europe: ModeStat[];
    america: ModeStat[];
  };
  ranks: RankStat[];
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
  rank: number;
  mmr: Mmr;
};

export type RankStat = {
  title: string;
  level: number;
  xp: number;
  rank: number;
};
