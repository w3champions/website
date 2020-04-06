import { Moment } from 'moment';

export type RootState = {
  darkMode: boolean;
};

export type DataTableOptions = {
  sortBy: object;
  sortDest: boolean;
  page: number;
  itemsPerPage: number;
};

export type PlayerInTeam = {
  wins: number;
  losses: number;
  oldMmr: number;
  currentMmr: number;
  battleTag: string;
  name: string;
  mmrGain: number;
  winrate: number;
}

export type Team = {
  players: PlayerInTeam[];
}

export type Match = {
  map: string;
  id: number;
  durationInSeconds: number;
  startTime: Moment;
  endTime: Moment;
  gameMode: number;
  teams: Team[];
  gateWay: number;
}

export interface MatchPlayer {
  battleTag: string;
  race: ERaceEnum;
  bucket: number;
  won?: boolean;
  xpChange?: number;
}

export enum EGameMode {
  UNDEFINED,
  GM_1ON1,
  GM_2ON2,
  GM_3ON3,
  GM_4ON4,
  GM_FFA
}

export enum ERaceEnum {
  RANDOM = 0,
  HUMAN = 1,
  ORC = 2,
  NIGHT_ELF = 4,
  UNDEAD = 8,
  TOTAL = 16
}
