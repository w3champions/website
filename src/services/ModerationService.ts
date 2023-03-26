import { API_URL } from "@/main";
import { LoungeMute, LoungeMuteResponse } from "@/store/admin/loungeMute/types";

export default class ModerationService {
  public static async getLoungeMutes(token: string): Promise<LoungeMuteResponse[]> {
    const url = `${API_URL}api/moderation/loungeMute?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json",
      },
    });

    return await response.json();
  }

  public static async postLoungeMute(token: string, loungeMute: LoungeMute): Promise<number> {
    const url = `${API_URL}api/moderation/loungeMute/?authorization=${token}`;

    const data = JSON.stringify(loungeMute);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: data,
    });

    return response.status;
  }

  public static async deleteLoungeMute(token: string, battleTag: string): Promise<number> {
    const url = `${API_URL}api/moderation/loungeMute/${encodeURIComponent(battleTag)}?authorization=${token}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.status;
  }
}
