import { API_URL } from "@/main";
import { LoungeMute, LoungeMuteResponse } from "@/store/admin/loungeMute/types";
import { authorizedFetch } from "@/helpers/general";

export default class ModerationService {
  public static async getLoungeMutes(token: string): Promise<LoungeMuteResponse[]> {
    const url = `${API_URL}api/moderation/loungeMute?authorization=${token}`;

    const response = await authorizedFetch("GET", url, token);

    return await response.json();
  }

  public static async postLoungeMute(token: string, loungeMute: LoungeMute): Promise<number> {
    const url = `${API_URL}api/moderation/loungeMute/?authorization=${token}`;

    const response = await authorizedFetch("POST", url, token, JSON.stringify(loungeMute));

    return response.status;
  }

  public static async deleteLoungeMute(token: string, battleTag: string): Promise<number> {
    const url = `${API_URL}api/moderation/loungeMute/${encodeURIComponent(battleTag)}?authorization=${token}`;

    const response = await authorizedFetch("DELETE", url, token);

    return response.status;
  }

  public static async getLoungeMutesByBattleTags(battleTags: string[], token: string): Promise<LoungeMuteResponse[]> {
    const url = `${API_URL}api/moderation/loungeMute/batch?authorization=${token}`;
    const response = await authorizedFetch("POST", url, token, JSON.stringify({ battleTags }));
    return await response.json();
  }
}
