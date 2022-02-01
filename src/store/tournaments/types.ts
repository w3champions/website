import { ERaceEnum } from "../typings";

export type TournamentsState = {
  tournaments: ITournament[];
};

export enum ConnectionType {
  Default = 1,
  StraightOpen = 2,
  StraightOpenDown = 3,
}

export interface ITournamentPlayer {
  name: string;
  race: ERaceEnum;
  countryCode?: string;
  score?: number;
}

export interface ITournamentMatch {
  id?: string;
  date?: string;
  players: ITournamentPlayer[];
}

export interface ITournamentRound {
  name: string;
  round: number;
  matches: ITournamentMatch[];
  connectionType?: ConnectionType;
  dimensions?: ITournamentRoundDimensions;
}

export interface ITournamentRoundDimensions {
  headerHeight: number;
  cellHeight: number;
}

export interface ITournament {
  id: string;
  name: string;
  winnerBracketRounds: ITournamentRound[];
  loserBracketRounds?: ITournamentRound[];
  createdOn: Date;
  startsOn: Date;
  matcherinoLink: string;
}
