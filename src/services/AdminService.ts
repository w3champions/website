import { API_URL } from "@/main";
import {
  AdminState,
  BannedPlayer,
  LoadingScreenTip,
  NewsMessage,
} from "@/store/admin/types";

export default class AdminService {
  public async getNews(): Promise<NewsMessage[]> {
    const url = `${API_URL}api/admin/news`;
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
    const url = `${API_URL}api/admin/news/${newsMessage.bsonId}?authorization=${token}`;

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
    const url = `${API_URL}api/admin/news/${newsMessage.bsonId}?authorization=${token}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  }

  public async getTips(): Promise<LoadingScreenTip[]> {
    const url = `${API_URL}api/admin/loadingScreenTips`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  }

  public async editTip(
    loadingScreenTip: LoadingScreenTip,
    token: string
  ): Promise<boolean> {
    const url = `${API_URL}api/admin/loadingScreenTips/${loadingScreenTip.bsonId}?authorization=${token}`;

    const data = JSON.stringify(loadingScreenTip);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: data,
    });
    if (response.status == 400) {
      alert(
        "The message was longer than 200 characters. We can't fit that on the loading screen tips frame."
      );
    }
    return response.ok;
  }

  public async deleteTip(
    loadingScreenTip: LoadingScreenTip,
    token: string
  ): Promise<boolean> {
    const url = `${API_URL}api/admin/loadingScreenTips/${loadingScreenTip.bsonId}?authorization=${token}`;
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
    const url = `${API_URL}api/admin/bannedPlayers`;
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
    const url = `${API_URL}api/admin/bannedPlayers/?authorization=${token}`;

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

  public async deleteBan(
    bannedPlayer: BannedPlayer,
    token: string
  ): Promise<string> {
    const url = `${API_URL}api/admin/bannedPlayers/?authorization=${token}`;

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
}
