import { WinLoss } from "@/store/overallStats/types";
import { EGameMode, ERaceEnum } from "@/store/typings";

export type RankingState = {
  league: number;
  working: boolean;
  page: number;
  totalRanks: number;
  ladders: Ladder[];
  rankings: Ranking[];
  topFive: Ranking[];
  searchRanks: Ranking[];
  gameMode: EGameMode;
  seasons: Season[];
  selectedSeason: Season;
};

export type Ladder = {
  gateway: Gateways;
  gameMode: EGameMode;
  season: number;
  leagues: League[];
};

export type Season = {
  id: number;
};

export type League = {
  id: number;
  name: string;
  order: number;
  division: number;
  maxParticipantCount: number;
};

export type Ranking = {
  gateway: number;
  league: number;
  leagueDivision: number;
  leagueOrder: number;
  leagueName: string;
  rankNumber: number;
  rankingPoints: number;
  player: PlayerOverview;
  playersInfo: PlayerInfo[];
};

export interface PlayerInfo {
  calculatedRace: ERaceEnum;
  twitchName: string;
}

export interface PlayerId {
  name: string;
  battleTag: string;
}

export interface PlayerOverview extends WinLoss {
  id: string;
  name: string;
  mmr: number;
  gateWay: number;
  playerIds: PlayerId[];
}

export enum Gateways {
  America = 10,
  Europe = 20,
  Asia = 30,
}
