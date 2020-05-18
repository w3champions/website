import { Match, MatchDetail } from "../typings";
import { Gateways } from "../ranking/types";

export type MatchState = {
  matches: Match[];
  allOngoingMatches: Match[];
  matchDetail: MatchDetail;
  page: number;
  totalMatches: number;
  loadingMatchDetail: boolean;
  gateWay: Gateways;
  status: MatchStatus
};

export enum MatchStatus {
  onGoing = "onGoing",
  past = 'past',
}