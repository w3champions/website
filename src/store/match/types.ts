import { EGameMode } from "@/store/typings";
import { Match, MatchDetail } from "../typings";

export type MatchState = {
  matches: Match[];
  allOngoingMatches: Match[];
  matchDetail: MatchDetail;
  page: number;
  totalMatches: number;
  loadingMatchDetail: boolean;
  status: MatchStatus;
  gameMode: EGameMode;
  map: string;
  mmr: Mmr;
  sort: string;
  selectedSeason: Season;
};

export enum MatchStatus {
  onGoing = "onGoing",
  past = "past",
}

export enum SortMode {
  startTimeDescending = "startTimeDescending",
  mmrDescending = "mmrDescending",
}

export type Mmr = {
    min: number;
    max: number;
};

export type Season = {
  id: number;
};