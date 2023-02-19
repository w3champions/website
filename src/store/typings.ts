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
  mapId?: number;
  mapName: string;
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
  teamIndex: number;
}

export type OngoingMatches = Record<
  string,
  {
    players: string[];
    opponents: string[];
  }
>;

export enum EGameMode {
  UNDEFINED = 0,
  GM_1ON1 = 1,
  GM_2ON2 = 2,
  GM_2ON2_AT = 6,
  GM_4ON4 = 4,
  GM_4ON4_AT = 8,
  GM_FFA = 5,

  GM_LEGION_4v4_X20 = 202,
  GM_LEGION_1v1_x20 = 203,
  GM_LEGION_4v4_X20_AT = 204,
  GM_LEGION_2v2_X20 = 205,

  GM_ROC_1ON1 = 301,
  GM_LTW_1ON1 = 401,

  GM_FROSTCRAFT_4ON4 = 501,

  GM_ATR_1ON1 = 601,

  GM_BANJOBALL_4ON4 = 701,

  GM_PTR_1ON1 = 801,

  GM_DOTA_5ON5 = 901,
  GM_DOTA_5ON5_AT = 902,

  GM_SC_FFA_4 = 1001,
}

export enum EGameModeType {
  MELEE = "MELEE",
  NON_MELEE = "NON_MELEE",
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
  STARTER = 32,
}

export enum EAvatarCategory {
  RANDOM = 0,
  HUMAN = 1,
  ORC = 2,
  NIGHTELF = 4,
  UNDEAD = 8,
  TOTAL = 16,
  SPECIAL = 32,
  STARTER = 64,
}

export enum EColors {
  RED = 0,
  BLUE = 1,
  TEAL = 2,
  PURPLE = 3,
  YELLOW = 4,
  ORANGE = 5,
  GREEN = 6,
  PINK = 7,
  GRAY = 8,
  LIGHT_BLUE = 9,
  DARK_GREEN = 10,
  BROWN = 11,
  MAROON = 12,
  NAVY = 13,
  TURQUOISE = 14,
  VIOLET = 15,
  WHEAT = 16,
  PEATCH = 17,
  MINT = 18,
  LAVENDER = 19,
  COAL = 20,
  SNOW = 21,
  EMERALD = 22,
  PEANUT = 23,
}

export enum EComputer {
  EASY = 0,
  NORMAL = 1,
  INSANE = 2,
}
