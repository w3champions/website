import { API_URL } from "@/main";
import { LoungeMute, LoungeMuteResponse } from "@/store/admin/loungeMute/types";
import { authorizedFetch } from "@/helpers/general";
import { LauncherChatMessage } from "@/store/admin/types";

export default class ModerationService {
  public static async getLoungeMutes(token: string): Promise<LoungeMuteResponse[]> {
    const url = `${API_URL}api/moderation/lounge-mute`;

    const response = await authorizedFetch("GET", url, token);

    return await response.json();
  }

  public static async postLoungeMute(token: string, loungeMute: LoungeMute): Promise<number> {
    const url = `${API_URL}api/moderation/lounge-mute`;

    const response = await authorizedFetch("POST", url, token, JSON.stringify(loungeMute));

    return response.status;
  }

  public static async deleteLoungeMute(token: string, battleTag: string): Promise<number> {
    const url = `${API_URL}api/moderation/lounge-mute/${encodeURIComponent(battleTag)}`;

    const response = await authorizedFetch("DELETE", url, token);

    return response.status;
  }

  public static async getLoungeMutesByBattleTags(battleTags: string[], token: string): Promise<LoungeMuteResponse[]> {
    const url = `${API_URL}api/moderation/lounge-mute/batch`;
    const response = await authorizedFetch("POST", url, token, JSON.stringify({ battleTags }));
    return await response.json();
  }

  public static async getLauncherChat(token: string, chatRoom: string): Promise<LauncherChatMessage[]> {
    const url = `${API_URL}api/moderation/launcher-chat/${chatRoom}`;
    const response = await authorizedFetch("GET", url, token);

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}
