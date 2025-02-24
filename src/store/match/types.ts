import { EGameMode } from "@/store/types";
import { Match, MatchDetail } from "../types";
import { Season } from "@/store/ranking/types";

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
  sort: SortMode;
  sortDirection: SortDirection;
  selectedSeason: Season;
};

export enum MatchStatus {
  onGoing = "onGoing",
  past = "past",
}

export enum SortMode {
  startTime = "startTime",
  endTime = "endTime",
  mmr = "mmr",
}

export enum SortDirection {
  Ascending = "asc",
  Descending = "desc",
}

export type Mmr = {
  min: number;
  max: number;
};
