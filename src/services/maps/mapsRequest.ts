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
 *
 * This is the single choke point: the builders in
 * `@/components/admin/maps/mapPayload` deliberately copy a whole map (a map
 * update replaces the whole document, so nothing may be lost on the way to the
 * editor), and the narrowing happens here, once, in MapsService. A field the
 * backend has to receive has to be added here too.
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
 * Turns an error response's raw text into the body `errorFromBody` reads: the
 * parsed JSON when it is JSON, otherwise the text itself, and `undefined` for an
 * empty or whitespace-only body.
 *
 * The raw-text fallback matters: website-backend's maps controller answers a
 * failed upstream call with a bare text/plain message, which JSON.parse (and
 * so `Response.json()`) rejects. MapsService's fetch calls and its XHR upload
 * both read error bodies through here, so the two paths cannot drift apart.
 */
export function parseErrorBody(text: string): unknown {
  if (!text.trim()) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Reads a usable message out of an error body (see `parseErrorBody`).
 *
 * Passing a parsed body to new Error() yields "[object Object]", so the first
 * of these shapes that carries non-blank text wins:
 *
 * 1. A bare string. website-backend's maps controller answers a failed
 *    upstream call with the HttpRequestException's message as the body, and
 *    that message already carries the update or matchmaking service's words
 *    (for example update-service's 409 "File already exists").
 * 2. `{ errors: [{ msg }] }` - matchmaking-service's validation envelope, when
 *    website-backend relays matchmaking's response body as that message.
 * 3. `{ error }` - website-backend's `ErrorResult`, which its global
 *    HttpRequestExceptionFilter writes for an HttpRequestException that a
 *    controller does not catch itself.
 * 4. `{ message }` - update-service's own error body, should one reach the
 *    browser without website-backend unwrapping it first.
 *
 * Anything else falls back to naming the status.
 */
export function errorFromBody(body: unknown, status: number): Error {
  const fallback = `Request failed with status ${status}.`;

  if (typeof body === "string" && body.trim()) return new Error(body);

  const shaped = body as { errors?: { msg?: string }[]; error?: unknown; message?: unknown } | null | undefined;

  const errors = shaped?.errors;
  if (Array.isArray(errors)) {
    const messages = errors.map((error) => error?.msg).filter((msg): msg is string => !!msg);
    if (messages.length) return new Error(messages.join(", "));
  }

  const error = shaped?.error;
  if (isNonBlankString(error)) return new Error(error);

  const message = shaped?.message;
  if (isNonBlankString(message)) return new Error(message);

  return new Error(fallback);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}
