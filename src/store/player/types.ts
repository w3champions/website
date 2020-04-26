import { EGameMode, ERaceEnum, Match } from "../typings";

export type PlayerState = {
  playerStatsRaceVersusRaceOnMap: PlayerStatsRaceOnMapVersusRace;
  page: number;
  battleTag: string;
  totalMatches: number;
  playerProfile: PlayerProfile;
  matches: Match[];
  loadingRecentMatches: boolean;
  loadingProfile: boolean;
  opponentTag: string;
};

export type PlayerProfile = {
  id: string;
  name: string;
  battleTag: string;
  raceStats: RaceStat[];
  gameModeStats: ModeStat[];
  ranks: RankStat[];
};

export type RaceStat = {
  race: ERaceEnum;
  wins: number;
  losses: number;
  games: number;
  winrate: number;
};

export type ModeStat = {
  mode: EGameMode;
  wins: number;
  losses: number;
  games: number;
  winrate: number;
  mmr: number;
  leagueId: number;
  leagueOrder: number;
  rank: number;
  rankingPoints: number;
};

export type RankStat = {
  title: string;
  level: number;
  xp: number;
  rank: number;
};

export interface WinLossesOnMap {
  map: string;
  winLosses: RaceStat[];
}

export interface RaceWinsOnMap {
  race: ERaceEnum;
  winLossesOnMap: WinLossesOnMap[];
}

export interface PlayerStatsRaceOnMapVersusRace {
  raceWinsOnMap: RaceWinsOnMap[];
  id: string;
}
