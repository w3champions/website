import { API_URL, LAUNCHER_UPDATE_URL } from "@/config/env";
import type { GetMapsResponse, Map, MapFileData } from "@/store/admin/mapsManagement/types";

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
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // An error body has no `items`, which would read as "there are no maps". That
    // is indistinguishable from a real empty list, and the bulk upload verifies
    // its own writes against this list - a swallowed 401 would report every map as
    // missing rather than as unverified.
    if (!response.ok) {
      throw await MapsService.errorFromResponse(response);
    }
    return await response.json();
  }

  public static async createMap(token: string, map: Map): Promise<Map> {
    const url = `${API_URL}api/maps`;

    const data = JSON.stringify(map);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: data,
    });

    if (!response.ok) {
      throw await MapsService.errorFromResponse(response);
    }
    return await response.json();
  }

  public static async updateMap(token: string, mapId: number, map: Map): Promise<Map> {
    const url = `${API_URL}api/maps/${mapId}`;

    const data = JSON.stringify(map);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: data,
    });

    if (!response.ok) {
      throw await MapsService.errorFromResponse(response);
    }
    return await response.json();
  }

  public static async getMapFiles(token: string, mapId: number): Promise<MapFileData[]> {
    const url = `${API_URL}api/maps/${mapId}/files`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // An empty list and "the list could not be read" have to stay apart: callers
    // decide whether a name is free based on this answer.
    if (!response.ok) {
      throw await MapsService.errorFromResponse(response);
    }
    return await response.json();
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
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw await MapsService.errorFromResponse(response);
    }
    return await response.json();
  }
}
