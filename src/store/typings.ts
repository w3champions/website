export type RootState = {
  darkMode: boolean;
};

export type DataTableOptions = {
  sortBy: object;
  sortDest: boolean;
  page: number;
  itemsPerPage: number;
};

/**
 * Match interface received from the Api
 */
export interface Match {
  /**
   * unique id of the match
   */
  id: number;

  /**
   * path of the map
   */
  map: string;

  /**
   * Mode of the game
   */
  gameMode: EGameMode;

  /**
   * Battle Tag of the player who hosted
   */
  host: string;

  /**
   * Start time of the match
   */
  startTime: number;

  /**
   * End time of the match. Undefined if match is still ongoing
   */
  endTime?: number;

  /**
   * Players that participated in the match
   */
  players: MatchPlayer[];
}

/**
 * Match Making Rating
 */
export interface Mmr {
  /**
   * Current rating
   */
  rating: number;
  /**
   * rd value - use unknown
   */
  rd: number;
  /**
   * vol value - use unknown
   */
  vol: number;
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
