import { API_URL } from "@/main";
import { GetMapsResponse } from "@/store/admin/maps/types";

export default class MapsService {
  public async getAllMaps(token: string, filter?: string): Promise<GetMapsResponse> {
    const filterParam = filter ? `&filter=${filter}` : "";

    const url = `${API_URL}api/maps?authorization=${token}${filterParam}`;
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
