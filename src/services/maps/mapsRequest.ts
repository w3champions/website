import type { GameMap, Map, MapForce } from "@/store/admin/mapsManagement/types";

/**
 * Pure request/response helpers for the admin maps API.
 *
 * They live outside MapsService because `@/config/env` reads `window` at module
 * load, so anything importing MapsService cannot be imported by the Vitest
 * suites (they run in the "node" environment). Same reasoning as
 * `AdminJobService`, which takes its endpoint instead of importing API_URL.
 */

/** Query string for `GET api/maps`, without the leading "?". */
export function buildMapsQuery(filter?: string, includeTemporary?: boolean): string {
  const params = new URLSearchParams();
  if (filter) params.set("filter", filter);
  // Only sent when asked for. Temporary (self-provided) maps are excluded from
  // every catalogue surface by default; the parameter is the admin opt-in.
  if (includeTemporary) params.set("includeTemporary", "true");
  return params.toString();
}

/**
 * The fields the backend accepts when creating or updating a map.
 *
 * `GET api/maps` now also returns server-owned fields - `temporary`,
 * `fileState`, `lastHostedAt`, `uploader`, and untyped keys such as `path` -
 * and the edit dialog works on a deep clone of a table row, so without this
 * whitelist an ordinary "save" would echo them straight back into
 * `POST api/maps` / `PUT api/maps/:id`. `uploader` is stamped by
 * website-backend itself, not the client.
 */
export interface MapWriteContract {
  id: number;
  name: string;
  category?: string;
  maxTeams: number;
  mappedForces?: MapForce[];
  gameMap?: GameMap;
  disabled: boolean;
}

export function toMapWriteContract(map: Map): MapWriteContract {
  return {
    id: map.id,
    name: map.name,
    category: map.category,
    maxTeams: map.maxTeams,
    mappedForces: map.mappedForces,
    gameMap: map.gameMap,
    disabled: map.disabled,
  };
}
