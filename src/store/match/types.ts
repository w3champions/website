import { Match, MatchDetail } from "../typings";
import { Gateways } from "../ranking/types";

export type MatchState = {
  matches: Match[];
  matchDetail: MatchDetail;
  page: number;
  totalMatches: number;
  loadingMatchDetail: boolean;
  gateWay: Gateways;
};
