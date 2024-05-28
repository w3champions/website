import { API_URL } from "@/main";
import { GetMapsResponse, Map, MapFileData } from "@/store/admin/mapsManagement/types";

export default class MapsService {
  public static async getAllMaps(token: string, filter?: string): Promise<GetMapsResponse> {
    const filterParam = filter ? `&filter=${filter}` : "";

    const url = `${API_URL}api/maps?${filterParam}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
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
        Authorization: `Bearer ${token}`
      },
      body: data,
    });

    if (!response.ok) {
      const msg = await response.json();
      throw new Error(msg);
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
        Authorization: `Bearer ${token}`
      },
      body: data,
    });

    return await response.json();
  }

  public static async getMapFiles(token: string, mapId: number): Promise<MapFileData[]> {
    const url = `${API_URL}api/maps/${mapId}/files`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
    });

    return await response.json();
  }

  public static async createMapFile(token: string, form: FormData): Promise<Map> {
    const mapId = form.get("mapId");
    const url = `${API_URL}api/maps/${mapId}/files`;

    const response = await fetch(url, {
      method: "POST",
      body: form,
      headers: {
        Authorization: `Bearer ${token}`
      },
    });

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
