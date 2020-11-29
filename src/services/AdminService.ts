import { CHAT_SERVICE_URL, STATISTIC_SERVICE_URL } from "@/main";
import { AdminState, BannedPlayer, NewsMessage } from "@/store/admin/types";

export default class AdminService {
  public async getNews(): Promise<NewsMessage[]> {
    const url = `${STATISTIC_SERVICE_URL}api/admin/news`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public async editNews(
    newsMessage: NewsMessage,
    token: string
  ): Promise<boolean> {
    const url = `${STATISTIC_SERVICE_URL}api/admin/news/${newsMessage.bsonId}?authorization=${token}`;

    const data = JSON.stringify(newsMessage);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: data,
    });

    return response.ok;
  }

  public async deleteNews(
    newsMessage: NewsMessage,
    token: string
  ): Promise<boolean> {
    const url = `${STATISTIC_SERVICE_URL}api/admin/news/${newsMessage.bsonId}?authorization=${token}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  }

  public async getBannedPlayers(): Promise<AdminState> {
    const url = `${STATISTIC_SERVICE_URL}api/admin/bannedPlayers`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public async getBannedChats(): Promise<AdminState> {
    const url = `${CHAT_SERVICE_URL}api/bans`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public async postBan(
    bannedPlayer: BannedPlayer,
    token: string
  ): Promise<string> {
    const url = `${STATISTIC_SERVICE_URL}api/admin/bannedPlayers/?authorization=${token}`;

    const data = JSON.stringify(bannedPlayer);
    const response = await fetch(url, {
      method: "POST",
      body: data,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.ok ? "" : (await response.json()).error;
  }

  public async postChatBan(
    bannedPlayer: BannedPlayer,
    token: string
  ): Promise<string> {
    const url = `${CHAT_SERVICE_URL}api/bans?authorization=${token}`;

    const data = JSON.stringify(bannedPlayer);
    const response = await fetch(url, {
      method: "PUT",
      body: data,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.ok ? "" : (await response.json()).error;
  }

  public async deleteBan(
    bannedPlayer: BannedPlayer,
    token: string
  ): Promise<string> {
    const url = `${STATISTIC_SERVICE_URL}api/admin/bannedPlayers/?authorization=${token}`;

    const data = JSON.stringify(bannedPlayer);
    const response = await fetch(url, {
      method: "DELETE",
      body: data,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.ok ? "" : (await response.json()).error;
  }

  public async deleteChatBan(
    bannedPlayer: BannedPlayer,
    token: string
  ): Promise<string> {
    const url = `${CHAT_SERVICE_URL}api/bans/${bannedPlayer.battleTag}?authorization=${token}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.ok ? "" : (await response.json()).error;
  }
}
