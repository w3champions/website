import { API_URL } from "@/config/env";
import type { GetMapsResponse, Map, MapFileData } from "@/store/admin/mapsManagement/types";

export default class MapsService {
  // The backend returns either a bare string (its own HttpRequestException message,
  // which already carries the matchmaking service's joined errors) or the raw
  // { errors: [{ msg }] } envelope. Passing the parsed body to new Error() yields
  // "[object Object]", so pull a readable message out of both shapes.
  private static async errorFromResponse(response: Response): Promise<Error> {
    const fallback = `Request failed with status ${response.status}.`;

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return new Error(fallback);
    }

    if (typeof body === "string" && body.trim()) return new Error(body);

    const errors = (body as { errors?: { msg?: string }[] })?.errors;
    if (Array.isArray(errors)) {
      const messages = errors.map((error) => error?.msg).filter((msg): msg is string => !!msg);
      if (messages.length) return new Error(messages.join(", "));
    }

    return new Error(fallback);
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

    return response.ok ? await response.json() : [];
  }

  public static async createMapFile(token: string, form: FormData): Promise<Map> {
    const mapId = form.get("mapId") as string;
    const url = `${API_URL}api/maps/${mapId}/files`;

    const response = await fetch(url, {
      method: "POST",
      body: form,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw await MapsService.errorFromResponse(response);
    }
    return await response.json();
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
