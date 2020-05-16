import { EGameMode, ERaceEnum, Match } from "../typings";
import { Season, Gateways } from "@/store/ranking/types";

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
  selectedSeason: Season;
  gateway: Gateways;
  gameMode: EGameMode;
};

export type PlayerProfile = {
  id: string;
  name: string;
  battleTag: string;
  participatedInSeasons: Season[];
  raceStats: RaceStat[];
  gateWayStats: GateWayStats[];
  ranks: RankStat[];
};

export type RaceStat = {
  race: ERaceEnum;
  gateWay: Gateways;
  season: number;
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
  division: number;
  rank: number;
  season: number;
  rankingPoints: number;
};

export type GateWayStats = {
  gateWay: number;
  season: number;
  gameModeStats: ModeStat[];
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
