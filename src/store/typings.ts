import { Moment } from "moment";
import { Gateways } from "./ranking/types";

export type RootState = {
  darkMode: boolean;
  gateway: Gateways;
  locale: string;
};

export type DataTableOptions = {
  sortDest: boolean;
  page: number;
  itemsPerPage: number;
};

export type PlayerInTeam = {
  oldMmr: number;
  currentMmr: number;
  battleTag: string;
  name: string;
  mmrGain: number;
  race: ERaceEnum;
  rndRace: ERaceEnum;
  won: boolean;
  location?: string;
  countryCode?: string;
  twitch?: string | null;
};

export type Team = {
  players: PlayerInTeam[];
  won?: boolean;
};

export type Match = {
  map: string;
  id: number;
  durationInSeconds: number;
  number: number;
  startTime: Moment;
  endTime: Moment;
  gameMode: EGameMode;
  teams: Team[];
  gateWay: number;
  season: number;
  serverInfo: ServerInfo;
};

export type ServerInfo = {
  provider: string;
  countryCode: string;
  location: string;
  name: string;
  nodeId: number;
  playerServerInfos: PlayerServerInfo[];
};

export type PlayerServerInfo = {
  battleTag: string;
  averagePing: number;
  currentPing: number;
};

export type MatchDetail = {
  match: Match;
  playerScores: PlayerScore[];
};

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

export type OngoingMatches=Record<string,{
  players: string[];
  opponents: string[];
}>

export enum EGameMode {
  UNDEFINED,
  GM_1ON1 = 1,
  GM_2ON2 = 2,
  GM_2ON2_AT = 6,
  GM_4ON4 = 4,
  GM_FFA = 5,
  GM_FOOTMEN_FRENZY = 101,

  GM_LEGION_4v4_X3 = 201,
  GM_LEGION_4v4_X20 = 202,
  GM_LEGION_1v1_x20 = 203,
  
  GM_ROC_1ON1 = 301
}

export enum EPick {
  OVERALL,
  FIRST = 1,
  SECOND = 2,
  THIRD = 3,
}

export enum ERaceEnum {
  RANDOM = 0,
  HUMAN = 1,
  ORC = 2,
  NIGHT_ELF = 4,
  UNDEAD = 8,
  TOTAL = 16,
}

export enum EAvatarCategory {
  RANDOM = 0,
  HUMAN = 1,
  ORC = 2,
  NIGHT_ELF = 4,
  UNDEAD = 8,
  TOTAL = 16,
  SPECIAL = 32,
}

export enum ELocaleFlags {
  EN = 'src/assets/localeFlags/en.svg',
  DE = 'src/assets/localeFlags/de.svg'
}
