import type { GameMap, Map, MapForce } from "@/store/admin/mapsManagement/types";

/**
 * Pure request/response helpers for the admin maps API, plus small shared
 * predicates over the `Map` shape they read and write.
 *
 * They live outside MapsService because `@/config/env` reads `window` at module
 * load, so anything importing MapsService cannot be imported by the Vitest
 * suites (they run in the "node" environment). Same reasoning as
 * `AdminJobService`, which takes its endpoint instead of importing API_URL.
 */

/**
 * Whether a map is temporary (self-provided): its metadata, file and lifetime
 * are owned by the uploader and the expiry sweep, not by an admin, and
 * `PUT api/maps/:id` rejects it outright. The one-line check has two call
 * sites (`AdminMaps.vue`, `BulkMapUpload.vue`); it lives here, rather than
 * being re-spelled in both, so a future second condition only needs changing
 * once.
 */
export function isTemporaryMap(map: Map): boolean {
  return map.temporary === true;
}

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

/**
 * Reads a usable message out of an error body.
 *
 * The backend returns either a bare string - its own HttpRequestException
 * message, which already carries the update or matchmaking service's words,
 * including update-service's 409 "File already exists" - or the raw
 * { errors: [{ msg }] } envelope. Passing the parsed body to new Error() yields
 * "[object Object]", so pull a readable message out of both shapes.
 */
export function errorFromBody(body: unknown, status: number): Error {
  const fallback = `Request failed with status ${status}.`;

  if (typeof body === "string" && body.trim()) return new Error(body);

  const errors = (body as { errors?: { msg?: string }[] })?.errors;
  if (Array.isArray(errors)) {
    const messages = errors.map((error) => error?.msg).filter((msg): msg is string => !!msg);
    if (messages.length) return new Error(messages.join(", "));
  }

  return new Error(fallback);
}
