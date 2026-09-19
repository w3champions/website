import { API_URL, LAUNCHER_UPDATE_URL } from "@/config/env";
import type { GetMapsResponse, Map, MapFileData } from "@/store/admin/mapsManagement/types";
import { fetchWithTimeout, timeoutError } from "./http/fetchWithTimeout";

// Budgets, not deadlines: they are there so a request that will never be
// answered fails the row it belongs to instead of holding the bulk upload - and
// with it a dialog that cannot be closed during a run - open forever.
//
// A small JSON call is a round trip through the website backend to the
// matchmaking service and back, which is well under a second in practice; 30 s
// is far past "slow" and squarely in "not coming back".
const JSON_TIMEOUT_MS = 30_000;
// The map list is the one read that is genuinely big: every map with its full
// file metadata, and it is unpaged. It gets its own, longer budget so a slow
// connection does not lose the list that everything else is checked against.
const MAP_LIST_TIMEOUT_MS = 60_000;
// A backstop above the server's own ceiling, not the real limit on an upload.
// The binding limit is website-backend's: it streams this body straight on to
// the update service with a default HttpClient, so its 100 s timeout covers the
// browser's uplink and cuts the request long before anything here would
// (UpdateServiceClient.cs:17 + Program.cs:126 - a large map on a slow uplink
// fails there, and that is a backend fix, not one this file can make). Going
// below 100 s would turn the backend's own error into a client timeout and hide
// it; this sits well above it so it only fires when the backend never answers
// at all.
const FILE_UPLOAD_TIMEOUT_MS = 5 * 60_000;

// A write that times out is not a write that did not happen: the request may
// have reached the server and been applied. Say so, so nobody reads a failed row
// as "nothing was stored".
const RETRY_IS_SAFE = "It may still have been applied on the server; running this again is safe.";
// Deliberately says nothing about retrying. This message is shared by the bulk
// uploader, whose planner re-reads the map's files and reuses one that is
// already stored, and by the single-map editor, which has no such planner - so
// a promise that "running it again is safe" would be false in one of the two.
// What is true in both is that the file list settles the question; each caller
// adds its own recovery hint on top.
const UPLOAD_OUTCOME_UNKNOWN = "It is not known whether the file was stored; "
  + "the map's file list shows whether it was.";

export default class MapsService {
  // The backend returns either a bare string (its own HttpRequestException message,
  // which already carries the matchmaking service's joined errors) or the raw
  // { errors: [{ msg }] } envelope. Passing the parsed body to new Error() yields
  // "[object Object]", so pull a readable message out of both shapes.
  private static async errorFromResponse(response: Response): Promise<Error> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return new Error(`Request failed with status ${response.status}.`);
    }

    return MapsService.errorFromBody(body, response.status);
  }

  private static errorFromBody(body: unknown, status: number): Error {
    const fallback = `Request failed with status ${status}.`;

    if (typeof body === "string" && body.trim()) return new Error(body);

    const errors = (body as { errors?: { msg?: string }[] })?.errors;
    if (Array.isArray(errors)) {
      const messages = errors.map((error) => error?.msg).filter((msg): msg is string => !!msg);
      if (messages.length) return new Error(messages.join(", "));
    }

    return new Error(fallback);
  }

  // Reading the body is part of the request, not something that happens after
  // it: passed to fetchWithTimeout so both the success and the error body are
  // read inside the call's budget.
  //
  // `this: void` because it is handed over as a plain callback; it reaches the
  // class through `MapsService.` rather than through a receiver.
  private static async jsonOrThrow<T>(this: void, response: Response): Promise<T> {
    if (!response.ok) throw await MapsService.errorFromResponse(response);
    return await response.json() as T;
  }

  private static mapFileFromBody(responseText: string): MapFileData | null {
    try {
      const body = JSON.parse(responseText) as MapFileData | null;
      return body?.filePath ? body : null;
    } catch {
      return null;
    }
  }

  public static async getAllMaps(token: string, filter?: string): Promise<GetMapsResponse> {
    const filterParam = filter ? `&filter=${filter}` : "";

    const url = `${API_URL}api/maps?${filterParam}`;
    // An error body has no `items`, which would read as "there are no maps". That
    // is indistinguishable from a real empty list, and the bulk upload verifies
    // its own writes against this list - a swallowed 401 would report every map as
    // missing rather than as unverified. jsonOrThrow keeps that distinction.
    return await fetchWithTimeout<GetMapsResponse>(
      url,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
      { timeoutMs: MAP_LIST_TIMEOUT_MS, describe: "Reading the maps" },
      MapsService.jsonOrThrow,
    );
  }

  public static async createMap(token: string, map: Map): Promise<Map> {
    const url = `${API_URL}api/maps`;

    const data = JSON.stringify(map);
    return await fetchWithTimeout<Map>(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: data,
    }, {
      timeoutMs: JSON_TIMEOUT_MS,
      describe: "Creating the map",
      // Not RETRY_IS_SAFE: creating the same map twice is not the same as
      // applying the same update twice.
      uncertainOutcome: "It may still have been created; check the map list before trying again.",
    }, MapsService.jsonOrThrow);
  }

  public static async updateMap(token: string, mapId: number, map: Map): Promise<Map> {
    const url = `${API_URL}api/maps/${mapId}`;

    const data = JSON.stringify(map);
    return await fetchWithTimeout<Map>(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: data,
    }, {
      timeoutMs: JSON_TIMEOUT_MS,
      describe: `Updating map ${mapId}`,
      uncertainOutcome: RETRY_IS_SAFE,
    }, MapsService.jsonOrThrow);
  }

  public static async getMapFiles(token: string, mapId: number): Promise<MapFileData[]> {
    const url = `${API_URL}api/maps/${mapId}/files`;
    // An empty list and "the list could not be read" have to stay apart: callers
    // decide whether a name is free based on this answer.
    return await fetchWithTimeout<MapFileData[]>(
      url,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
      { timeoutMs: JSON_TIMEOUT_MS, describe: `Reading the stored files of map ${mapId}` },
      MapsService.jsonOrThrow,
    );
  }

  // Uploads go through XMLHttpRequest rather than fetch: fetch cannot report how
  // much of the request body has been sent, and map files are big enough that a
  // progress bar is worth the older API.
  // Resolves with the record the backend stored, so callers do not have to guess
  // which of a map's files the upload became. Older deployments answer without a
  // body; null then means "ask for the map's files instead".
  public static createMapFile(
    token: string,
    form: FormData,
    onProgress?: (percentUploaded: number) => void,
  ): Promise<MapFileData | null> {
    const mapId = form.get("mapId") as string;
    const url = `${API_URL}api/maps/${mapId}/files`;

    return new Promise<MapFileData | null>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", url);
      request.setRequestHeader("Authorization", `Bearer ${token}`);
      // XMLHttpRequest has a timeout of its own, so this one call does not need
      // the AbortController the fetch-based calls use. It covers send() to
      // completion, which is what has to be bounded here: the upload plus the
      // update service parsing the archive.
      request.timeout = FILE_UPLOAD_TIMEOUT_MS;

      request.upload.onprogress = (event: ProgressEvent): void => {
        if (!event.lengthComputable) return;
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      };

      request.onload = (): void => {
        if (request.status >= 200 && request.status < 300) {
          resolve(MapsService.mapFileFromBody(request.responseText));
          return;
        }

        let body: unknown = request.responseText;
        try {
          body = JSON.parse(request.responseText);
        } catch {
          // Keep the raw text; errorFromBody handles both shapes.
        }
        reject(MapsService.errorFromBody(body, request.status));
      };

      request.onerror = (): void => reject(new Error("Network error while uploading the map file."));
      request.onabort = (): void => reject(new Error("Upload cancelled."));
      request.ontimeout = (): void =>
        reject(timeoutError({
          timeoutMs: FILE_UPLOAD_TIMEOUT_MS,
          describe: "Uploading the map file",
          uncertainOutcome: UPLOAD_OUTCOME_UNKNOWN,
        }));

      request.send(form);
    });
  }

  // The update service serves the stored files themselves; this is the same
  // unauthenticated route the launcher downloads maps from.
  public static getMapFileDownloadUrl(filePath: string): string {
    return `${LAUNCHER_UPDATE_URL}maps/download?mapPath=${encodeURIComponent(filePath)}`;
  }

  public static async getTournamentMaps(): Promise<GetMapsResponse> {
    const url = `${API_URL}api/maps/tournaments`;
    return await fetchWithTimeout<GetMapsResponse>(
      url,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
      { timeoutMs: JSON_TIMEOUT_MS, describe: "Reading the tournament maps" },
      MapsService.jsonOrThrow,
    );
  }
}
