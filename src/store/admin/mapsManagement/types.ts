import { EColors, EComputer, ERaceEnum } from "@/store/types";

export type AdminMapsState = {
  totalMaps: number;
  maps: Map[];
  mapsFilter?: string;
  includeTemporary: boolean;
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
  // Server-owned and read-only here. `uploader` is stamped by website-backend
  // on admin create/update and on temporary-map upload; `temporary`,
  // `fileState`, and `lastHostedAt` exist only on temporary (self-provided)
  // maps. website-backend serialises nulls on permanent rows.
  temporary?: boolean;
  uploader?: string | null;
  fileState?: "present" | "deleted" | null;
  lastHostedAt?: number | null;
}

export interface MapForce {
  team: number;
  slots: MapForceSlot[];
  computers?: MapForceComputer[];
}

export interface MapForceSlot {
  index: number;
  color?: EColors | null;
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
  /**
   * Bitmask of the lobby slots that belong to this force.
   *
   * Camel case, unlike the snake_case fields on GameMap above, because the
   * browser boundary is System.Text.Json and only this field is missing the
   * attribute that would rename it: W3C.Contracts/Matchmaking/GameMapForce.cs
   * carries `[JsonProperty("player_set")]` (Newtonsoft, which is what the
   * backend uses to talk to the matchmaking service) but no
   * `[JsonPropertyName]`, so on the way to the browser it falls back to the
   * camelCase policy. Its siblings in GameMap.cs carry both attributes, which
   * is why they stay snake_case here.
   *
   * The website only ever echoes this value back - it spreads what it was sent
   * rather than rebuilding the force - so the name matters for reading, not for
   * writing. If the backend ever adds the missing `[JsonPropertyName]`, the
   * wire key flips to `player_set` and this has to change in lockstep; reads go
   * through playerSetOf() in MapFileDetails.vue, which accepts either.
   */
  playerSet: number;
}

export interface MapFileData {
  id: string;
  mapId: number;
  filePath: string;
  metaData: GameMap;
}

export type MapStatus = "Ladder" | "Custom" | "Disabled";

export interface AdminMapsFilters {
  statuses: MapStatus[];
  category: string | null;
  onlyMissingFile: boolean;
}
