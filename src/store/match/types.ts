import type { EGameMode } from "@/store/types";
import type { Match, MatchDetail } from "../types";
import type { Season } from "@/store/ranking/types";

export type MatchState = {
  matches: Match[];
  allOngoingMatches: Match[];
  matchDetail: MatchDetail;
  mapNames: string[];
  mapNamesCache: Record<string, string[]>;
  page: number;
  totalMatches: number;
  loadingMatches: boolean;
  loadingMatchDetail: boolean;
  lastMatchesRequestId: number;
  status: MatchStatus;
  gameMode: EGameMode;
  map: string;
  mmr: Mmr;
  duration: { min: number; max: number };
  sort: string;
  selectedSeason: Season;
  selectedHeroFilter: number[];
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
