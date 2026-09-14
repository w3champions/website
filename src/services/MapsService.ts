import { API_URL, LAUNCHER_UPDATE_URL } from "@/config/env";
import { buildMapsQuery, errorFromBody, toMapWriteContract } from "@/services/maps/mapsRequest";
import type { GetMapsResponse, Map, MapFileData } from "@/store/admin/mapsManagement/types";

export default class MapsService {
  private static async errorFromResponse(response: Response): Promise<Error> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return new Error(`Request failed with status ${response.status}.`);
    }

    return errorFromBody(body, response.status);
  }

  public static async getAllMaps(token: string, filter?: string, includeTemporary?: boolean): Promise<GetMapsResponse> {
    const query = buildMapsQuery(filter, includeTemporary);

    const url = `${API_URL}api/maps${query ? `?${query}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw await MapsService.errorFromResponse(response);
    }
    return await response.json();
  }

  public static async createMap(token: string, map: Map): Promise<Map> {
    const url = `${API_URL}api/maps`;

    const data = JSON.stringify(toMapWriteContract(map));
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

    const data = JSON.stringify(toMapWriteContract(map));
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

    return response.ok ? await response.json() : [];
  }

  // Uploads go through XMLHttpRequest rather than fetch: fetch cannot report how
  // much of the request body has been sent, and map files are big enough that a
  // progress bar is worth the older API.
  public static createMapFile(
    token: string,
    form: FormData,
    onProgress?: (percentUploaded: number) => void,
  ): Promise<void> {
    const mapId = form.get("mapId") as string;
    const url = `${API_URL}api/maps/${mapId}/files`;

    return new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", url);
      request.setRequestHeader("Authorization", `Bearer ${token}`);

      request.upload.onprogress = (event: ProgressEvent): void => {
        if (!event.lengthComputable) return;
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      };

      request.onload = (): void => {
        if (request.status >= 200 && request.status < 300) {
          resolve();
          return;
        }

        let body: unknown = request.responseText;
        try {
          body = JSON.parse(request.responseText);
        } catch {
          // Keep the raw text; errorFromBody handles both shapes.
        }
        reject(errorFromBody(body, request.status));
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

    return await response.json();
  }
}
