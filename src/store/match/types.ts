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
  sort: string;
  selectedSeason: Season;
  showHeroIcons: boolean;
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
