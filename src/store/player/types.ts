import { EGameMode, ERaceEnum, Match } from "../typings";
import { Season, Gateways, PlayerId } from "@/store/ranking/types";

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
  gameMode: EGameMode;
  gateWay: Gateways;
  race: ERaceEnum;
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
  playerIds: PlayerId[];
};

export interface WinLossesOnMap {
  map: string;
  winLosses: RaceStat[];
}

export interface RaceWinsOnMap {
  race: ERaceEnum;
  winLossesOnMap: WinLossesOnMap[];
}

export interface PlayerStatsRaceOnMapVersusRaceByPatch {
  [key: string]: any;

  patch: string;
  raceWinsOnMap: RaceWinsOnMap[];
}

export interface PlayerStatsRaceOnMapVersusRace {
  raceWinsOnMapByPatch: PlayerStatsRaceOnMapVersusRaceByPatch;
  raceWinsOnMap: RaceWinsOnMap[];
  id: string;
}
