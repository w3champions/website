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
  raceStats: RaceStat[];
  ongoingMatch: Match;
  gameModeStats: ModeStat[];
};

export type PlayerProfile = {
  id: string;
  name: string;
  battleTag: string;
  participatedInSeasons: Season[];
  winLosses: RaceStat[];
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
  gateWay: Gateways;
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
