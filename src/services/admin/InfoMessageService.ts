import { API_URL } from "@/main";
import { LoadingScreenTip, MessageOfTheDay, NewsMessage } from "@/store/admin/infoMessages/types";
import { authorizedFetch } from "@/helpers/general";

export default class InfoMessageService {
  public static async getNews(): Promise<NewsMessage[]> {
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

  public static async editNews(newsMessage: NewsMessage, token: string): Promise<boolean> {
    const url = `${API_URL}api/admin/news/${newsMessage.bsonId}`;
    const response = await authorizedFetch("PUT", url, token, JSON.stringify(newsMessage));
    return response.ok;
  }

  public static async deleteNews(newsMessage: NewsMessage, token: string): Promise<boolean> {
    const url = `${API_URL}api/admin/news/${newsMessage.bsonId}`;
    const response =  await authorizedFetch("DELETE", url, token);
    return response.ok;
  }

  public static async getTips(): Promise<LoadingScreenTip[]> {
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

  public static async editTip(loadingScreenTip: LoadingScreenTip, token: string): Promise<boolean> {
    const url = `${API_URL}api/admin/loadingScreenTips/${loadingScreenTip.bsonId}`;

    const response = await authorizedFetch("PUT", url, token, JSON.stringify(loadingScreenTip));
    if (response.status == 400) {
      alert("The message was longer than 200 characters. We can't fit that on the loading screen tips frame.");
    }
    return response.ok;
  }

  public static async deleteTip(loadingScreenTip: LoadingScreenTip, token: string): Promise<boolean> {
    const url = `${API_URL}api/admin/loadingScreenTips/${loadingScreenTip.bsonId}`;
    const response = await authorizedFetch("DELETE", url, token);

    return response.ok;
  }

  public static async getMotd(): Promise<MessageOfTheDay> {
    const url = `${API_URL}api/admin/motd/`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.ok) return response.json();
    return {} as MessageOfTheDay;
  }

  public static async putMotd(motd: MessageOfTheDay, token: string): Promise<boolean> {
    const url = `${API_URL}api/admin/motd`;
    const response = await authorizedFetch("PUT", url, token, JSON.stringify(motd));

    return response.ok;
  }
}
