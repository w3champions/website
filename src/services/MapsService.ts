import { API_URL } from "@/main";
import { GetMapsResponse, Map, MapFileData, GetSeasonMapsResponse } from "@/store/admin/maps/types";

export default class MapsService {
  public async getAllMaps(token: string, filter?: string): Promise<GetMapsResponse> {
    const filterParam = filter ? `&filter=${filter}` : "";

    const url = `${API_URL}api/maps?authorization=${token}${filterParam}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      }
    });

    return await response.json();
  }

  public async createMap(token: string, map: Map): Promise<Map> {
    const url = `${API_URL}api/maps?authorization=${token}`;

    const data = JSON.stringify(map);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: data,
    });

    return await response.json();
  }

  public async updateMap(token: string, mapId: number, map: Map): Promise<Map> {
    const url = `${API_URL}api/maps/${mapId}?authorization=${token}`;

    const data = JSON.stringify(map);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: data,
    });

    return await response.json();
  }

  public async getMapFiles(token: string, mapId: number): Promise<MapFileData[]> {
    const url = `${API_URL}api/maps/${mapId}/files?authorization=${token}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public async createMapFile(token: string, form: FormData): Promise<Map> {
    const mapId = form.get("mapId");
    const url = `${API_URL}api/maps/${mapId}/files?authorization=${token}`;

    const response = await fetch(url, {
      method: "POST",
      body: form,
    });

    return await response.json();
  }

  public async getMapsForCurrentSeason(): Promise<GetSeasonMapsResponse> {
    const url = `${API_URL}api/maps/currentseason`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      }
    });

    return await response.json();
  }
}
