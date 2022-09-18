import { ERaceEnum, EGameMode } from "../typings";
import { Gateways } from "../ranking/types";

export enum ETournamentFormat {
  SINGLE_ELIM,
  DOUBLE_ELIM,
  ROUND_ROBIN,
}

export enum ETournamentState {
  INIT,
  REGISTRATION,
  MATCH_GENERATION,
  STARTED,
  SHOW_WINNER,
  FINISHED,
  CANCELED,
}

export enum ETournamentType {
  AUTOMATED,
  CUSTOM,
}

export type TournamentsState = {
  tournaments: ITournament[];
};

export interface ITournamentSeed {
  number: number;
  player: ITournamentPlayer;
}

export interface ITournament {
  id: string;
  name: string;
  startDateTime: Date;
  state: ETournamentState;
  mode: EGameMode;
  format: ETournamentFormat;
  type: ETournamentType;
  gateway: Gateways;
  matcherinoLink: string;
  mapPool: number[]; // TODO: return map names
  players: ITournamentPlayer[];
  winner: ITournamentPlayer;
  rounds: ITournamentRound[];
  admins: ITournamentAdmin[];
}

export interface ITournamentAdmin {
  battleTag: string;
  countryCode?: string;
}

export interface ITournamentPlayer {
  battleTag: string;
  race: ERaceEnum;
  countryCode?: string;
  score?: number;
}

// export enum ConnectionType {
//   Default = 1,
//   StraightOpen = 2,
//   StraightOpenDown = 3,
// }
// export interface ITournamentRound {
//   name: string;
//   round: number;
//   matches: ITournamentMatch[];
//   // connectionType?: ConnectionType;
// }
export interface ITournamentRound {
  name: string;
  round: number;
  series: Array<ITournamentSeries>;
}

export interface ITournamentSeries {
  id?: string;
  players?: ITournamentPlayer[];
  matches?: ITournamentMatch[];
}

export interface ISeriesPlayer {
  battleTag: string;
  score?: number;
}

export interface ITournamentMatch {
  id?: string;
  mapId: number;
  players: IMatchPlayer[];
}

export interface IMatchPlayer {
  battleTag: string;
  won?: boolean;
}
