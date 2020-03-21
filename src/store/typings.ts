export type DataTableOptions = {
  sortBy: object;
  sortDest: boolean;
  page: number;
  itemsPerPage: number;
};

export interface Match {
  id: number;
  map: string;
  gameMode: EGameMode;
  host: string;
  startTime: number;
  endTime?: number;
  players: MatchPlayer[];
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
