import { EColors, EComputer, ERaceEnum } from "@/store/types";

export type AdminMapsState = {
  totalMaps: number;
  maps: Map[];
  mapsFilter?: string;
  mapFiles: MapFileData[];
};

export interface GetMapsResponse {
  total: number;
  items: Map[];
}

export interface Map {
  id: number;
  name: string;
  category?: string;
  maxTeams: number;
  mappedForces?: MapForce[];
  gameMap?: GameMap;
  disabled: boolean;
}

export interface MapForce {
  team: number;
  slots: number[];
  computers?: MapForceComputer[];
}

export interface MapForceComputer {
  slot: number;
  color: EColors;
  race: ERaceEnum;
  difficulty: EComputer;
}

export interface GameMap {
  sha1: string;
  checksum?: number;
  name: string;
  crc32: number;
  description: string;
  author: string;
  path: string;
  width: number;
  height: number;
  suggested_players: string;
  players: GameMapPlayer[];
  forces: GameMapForce[];
  num_players: number;
  twelve_p: boolean;
}

export interface GameMapPlayer {
  name: string;
  type: number;
  race: number;
  flags: number;
}

export interface GameMapForce {
  name: string;
  flags: number;
  player_set: number;
}

export interface MapFileData {
  id: string;
  mapId: number;
  filePath: string;
  metaData: GameMap;
}

export interface AdminMapsFilters {
  hideDisabled: boolean;
}
