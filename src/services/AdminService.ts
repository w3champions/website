import { API_URL } from "@/main";
import {
  AdminState,
  BannedPlayer,
  LoadingScreenTip,
  NewsMessage,
  QueueData,
  Proxy,
  SearchedPlayer,
  ProxySettings,
  GloballyMutedPlayer,
  GlobalMute,
  PortraitDefinition,
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

  public async getQueueData(token: string): Promise<QueueData[]> {
    const url = `${API_URL}api/admin/queue-data/?authorization=${token}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  }

  public async getAvailableProxies(token: string): Promise<Proxy[]> {
    const url = `${API_URL}api/admin/proxies/?authorization=${token}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  }

  public async searchByTag(
    battleTagFragment: string,
    token: string
  ): Promise<SearchedPlayer[]> {
    const url = `${API_URL}api/admin/search/${encodeURIComponent(
      battleTagFragment
    )}?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  }

  public async getProxiesForBattletag(
    battleTag: string,
    token: string
  ): Promise<ProxySettings> {
    const url = `${API_URL}api/admin/proxies-for/${encodeURIComponent(
      battleTag
    )}?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  }

  public async putProxies(
    proxies: ProxySettings,
    battleTag: string,
    token: string
  ): Promise<Response> {
    const url = `${API_URL}api/admin/update-proxies/${encodeURIComponent(
      battleTag
    )}?authorization=${token}`;

    const data = JSON.stringify(proxies);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: data,
    });

    return response;
  }

  public async getAltsForBattletag(
    btag: string,
    token: string
  ): Promise<string[]> {
    const url = `${API_URL}api/admin/alts/${encodeURIComponent(
      btag
    )}?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public async getGlobalMutes(token: string): Promise<GloballyMutedPlayer[]> {
    const url = `${API_URL}api/admin/globalChatBans?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json",
      },
    });

    return await response.json();
  }

  public async deleteGlobalMute(token: string, id: string): Promise<number> {
    const url = `${API_URL}api/admin/globalChatBans/${id}?authorization=${token}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.status;
  }

  public async putGlobalMute(
    token: string,
    globalMutedPlayer: GlobalMute
  ): Promise<number> {
    const url = `${API_URL}api/admin/globalChatBans/?authorization=${token}`;

    const data = JSON.stringify(globalMutedPlayer);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: data,
    });

    return response.status;
  }

  public async getAllSpecialPortraits(token: string): Promise<PortraitDefinition[]> {
    const url = `${API_URL}api/admin/portraitDefinitions?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.json();
  }

  public async putPortraits(
    token: string,
    btag: string,
    portraitIds: number[],
    tooltip: string
    ): Promise<void> {
    const url = `${API_URL}api/admin/portraitDefinitions?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.json();
  }

  public async deletePortraits(
    token: string,
    btag: string,
    portraitIds: number[]
    ): Promise<void> {
    const url = `${API_URL}api/admin/portraitDefinitions?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.json();
  }
}
