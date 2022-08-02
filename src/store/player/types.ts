import { EGameMode, ERaceEnum, Match } from "../typings";
import { Season, Gateways, PlayerId } from "@/store/ranking/types";
import { Moment } from "moment";

export type PlayerState = {
  isInitialized: boolean;
  playerStatsRaceVersusRaceOnMap: PlayerStatsRaceOnMapVersusRace;
  playerStatsHeroVersusRaceOnMap: PlayerStatsHeroOnMapVersusRace;
  page: number;
  battleTag: string;
  totalMatches: number;
  playerProfile: PlayerProfile;
  matches: Match[];
  loadingRecentMatches: boolean;
  loadingProfile: boolean;
  loadingMmrRpTimeline: boolean;
  loadingPlayerStatsHeroVersusRaceOnMap: boolean;
  opponentTag: string;
  selectedSeason: Season;
  gameMode: EGameMode;
  race: ERaceEnum;
  playerRace: ERaceEnum;
  opponentRace: ERaceEnum;
  raceStats: RaceStat[];
  ongoingMatch: Match;
  gameModeStats: ModeStat[];
  mmrRpTimeline: PlayerMmrRpTimeline | undefined;
};

export type PlayerProfile = {
  id: string;
  name: string;
  battleTag: string;
  participatedInSeasons: Season[];
  winLosses: RaceStat[];
  playerAkaData: AliasData;
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

export type AliasData = {
  id: number;
  name: string;
  main_race: string;
  country: string;
  liquipedia: string;
};

export type ModeStat = {
  id: string;
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
  quantile: number;
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

export interface PlayerStatsHeroOnMapVersusRaceByPatch {
  [key: string]: any;

  patch: string;
  raceWinsOnMap: RaceWinsOnMap[];
}

export interface PlayerStatsRaceOnMapVersusRace {
  raceWinsOnMapByPatch: PlayerStatsRaceOnMapVersusRaceByPatch;
  raceWinsOnMap: RaceWinsOnMap[];
  id: string;
}

export interface PlayerHeroStats {
  heroId: string,
  stats: RaceWinsOnMap[];
}

export interface PlayerStatsHeroOnMapVersusRace {
  heroStatsItemList: PlayerHeroStats[],
  raceWinsOnMapByPatch: PlayerStatsHeroOnMapVersusRaceByPatch;
  raceWinsOnMap: RaceWinsOnMap[];
  id: string;
  season: string;
  battleTag: string;
}

export type MmrRpAtDate = {
  mmr: number;
  rp: number;
  date: Moment;
};

export type PlayerMmrRpTimeline = {
  mmrRpAtDates: MmrRpAtDate[];
};

export type PlayerHeroStatistic = {
  hero: string;
  total: string;
  ud: string;
  orc: string;
  hu: string;
  ne: string;
}
