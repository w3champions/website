import {Match, MatchDetail} from "../typings";

export type MatchState = {
  matches: Match[];
  matchDetail: MatchDetail;
  page: number;
  totalMatches: number;
  loadingMatchDetail: boolean;
};
