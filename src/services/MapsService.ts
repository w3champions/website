import { API_URL } from "@/main";
import { FloMap } from "@/store/admin/maps/types";

export default class AdminService {
  public async getAllMaps(token: string): Promise<FloMap[]> {
    const url = `${API_URL}api/maps?authorization=${token}`;
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
