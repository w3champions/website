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
  oldMmr: number;
  currentMmr: number;
  battleTag: string;
  name: string;
  id: string;
  mmrGain: number;
  race: ERaceEnum;
  won: boolean;
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
  gameMode: EGameMode;
  teams: Team[];
  gateWay: number;
}

export type MatchDetail = {
  match: Match;
  playerScores: PlayerScore[];
}

export interface Player {
  race: number;
  oldMmr: number;
  currentMmr: number;
  battleTag: string;
  name: string;
  id: string;
  mmrGain: number;
  won: boolean;
}

export interface UnitScore {
  unitsProduced: number;
  unitsKilled: number;
  largestArmy: number;
}

export interface Hero {
  icon: string;
  level: number;
}

export interface HeroScore {
  heroesKilled: number;
  itemsObtained: number;
  mercsHired: number;
  expGained: number;
}

export interface ResourceScore {
  goldCollected: number;
  lumberCollected: number;
  goldUpkeepLost: number;
}

export interface PlayerScore {
  battleTag: string;
  unitScore: UnitScore;
  heroes: Hero[];
  heroScore: HeroScore;
  resourceScore: ResourceScore;
}

export enum EGameMode {
  UNDEFINED,
  GM_1ON1 = 1,
  GM_2ON2 = 6,
  GM_4ON4 = 12,
  GM_FFA = 14
}

export enum ERaceEnum {
  RANDOM = 0,
  HUMAN = 1,
  ORC = 2,
  NIGHT_ELF = 4,
  UNDEAD = 8,
  TOTAL = 16
}
