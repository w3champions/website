import {WinLoss} from "@/store/overallStats/types";
import {EGameMode} from "@/store/typings";

export type RankingState = {
  gateway: Gateways;
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
  leagues: League[];
};

export type Season = {
  id: number;
};

export type League = {
  id: number,
  name: string,
  order: number,
  division: number,
  maxParticipantCount: number
}

export type Ranking = {
  gateway: number;
  league: number;
  rankNumber: number;
  rankingPoints: number;
  player: PlayerOverview;
};

export interface PlayerId {
  name: string;
  battleTag: string;
}

export interface PlayerOverview extends WinLoss{
  id: string;
  name: string;
  mmr: number;
  gateWay: number;
  playerIds: PlayerId[]
}

export enum Gateways {
  America = 10,
  Europe = 20,
  Asia = 30
}
