import { ERaceEnum, EGameMode } from "../typings";
import { Gateways } from "../ranking/types";
import { Map } from "../admin/maps/types";

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

export enum ESeriesState {
  INIT,
  VETO,
  IN_PROGRESS,
  FINISHED,
  BYE,
  CANCELED,
}

export type TournamentsState = {
  tournaments: ITournament[];
  maps: Map[];
  activeMaps: Map[];
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
  registrationTimeMinutes: number;
  readyTimeSeconds: number;
  vetoTimeSeconds: number;
  showWinnerTimeHours: number;
  matcherinoUrl?: string;
}

export interface ITournamentAdmin {
  battleTag: string;
  countryCode?: string;
}

export interface ITournamentPlayer {
  battleTag: string;
  race: ERaceEnum;
  countryCode?: string;
}

export interface ITournamentRound {
  name: string;
  number: number;
  series: ITournamentSeries[];
}

export interface ITournamentSeries {
  id: string;
  state: ESeriesState;
  players?: ISeriesPlayer[];
  matches?: ITournamentMatch[];
}

export interface ISeriesPlayer {
  battleTag: string;
  team: number;
  score?: number;
  won?: boolean;
  race: ERaceEnum; // copied from ITournamentPlayer
  countryCode?: string; // copied from ITournamentPlayer
}

export interface ITournamentMatch {
  id?: string;
  mapId: number;
  players: IMatchPlayer[];
}

export interface IMatchPlayer {
  battleTag: string;
  team: number,
  won?: boolean;
}
