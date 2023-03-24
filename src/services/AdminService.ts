import { API_URL } from "@/main";
import {
  BannedPlayer,
  BannedPlayersResponse,
  QueueData,
  Proxy,
  SearchedPlayer,
  ProxySettings,
  GloballyMutedPlayer,
  GlobalMute,
  PortraitDefinition,
  ChangePortraitsCommand,
  ChangePortraitsDto,
  PortraitDefinitionGroup,
  PortraitDefinitionDTO,
  ReplayChatLog,
} from "@/store/admin/types";

import { LoungeMute, LoungeMuteResponse } from "@/store/admin/loungeMute/types";

export default class AdminService {
  public static async getBannedPlayers(): Promise<BannedPlayersResponse> {
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

  public static async postBan(bannedPlayer: BannedPlayer, token: string): Promise<string> {
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

    return response.ok ? "" : await response.json();
  }

  public static async deleteBan(bannedPlayer: BannedPlayer, token: string): Promise<string> {
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

  public static async getQueueData(token: string): Promise<QueueData[]> {
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

  public static async getAvailableProxies(token: string): Promise<Proxy[]> {
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

  public static async searchByTag(battleTagFragment: string, token: string): Promise<SearchedPlayer[]> {
    const url = `${API_URL}api/admin/search/${encodeURIComponent(battleTagFragment)}?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  }

  public static async getProxiesForBattletag(battleTag: string, token: string): Promise<ProxySettings> {
    const url = `${API_URL}api/admin/proxies-for/${encodeURIComponent(battleTag)}?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  }

  public static async putProxies(proxies: ProxySettings, battleTag: string, token: string): Promise<Response> {
    const url = `${API_URL}api/admin/update-proxies/${encodeURIComponent(battleTag)}?authorization=${token}`;

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

  public static async getAltsForBattletag(btag: string, token: string): Promise<string[]> {
    const url = `${API_URL}api/admin/alts/${encodeURIComponent(btag)}?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public static async getGlobalMutes(token: string): Promise<GloballyMutedPlayer[]> {
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

  public static async deleteGlobalMute(token: string, id: string): Promise<number> {
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

  public static async putGlobalMute(token: string, globalMutedPlayer: GlobalMute): Promise<number> {
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

  public static async getLoungeMutes(token: string): Promise<LoungeMuteResponse[]> {
    const url = `${API_URL}api/admin/loungeMutes?authorization=${token}`;

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
    const url = `${API_URL}api/admin/loungeMutes/?authorization=${token}`;

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
    const url = `${API_URL}api/admin/loungeMutes/${encodeURIComponent(battleTag)}?authorization=${token}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.ok ? "" : await response.json();
  }

  public static async getAllSpecialPortraits(token: string): Promise<PortraitDefinition[]> {
    const url = `${API_URL}api/rewards/portrait-definitions?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.json();
  }

  public static async putPortraits(token: string, command: ChangePortraitsCommand): Promise<number> {
    const url = `${API_URL}api/rewards/portraits?authorization=${token}`;

    const data = {
      BnetTags: command.battleTags,
      Portraits: command.portraitIds,
      Tooltip: command.mouseover,
    } as ChangePortraitsDto;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return response.status;
  }

  public static async deletePortraits(token: string, command: ChangePortraitsCommand): Promise<number> {
    const url = `${API_URL}api/rewards/portraits?authorization=${token}`;

    const data = {
      BnetTags: command.battleTags,
      Portraits: command.portraitIds,
    } as ChangePortraitsDto;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return response.status;
  }

  public static async getAllPortraitDefinitionGroups(): Promise<PortraitDefinitionGroup[]> {
    const url = `${API_URL}api/rewards/portrait-groups`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.json();
  }

  public static async postPortraitDefinitions(token: string, definitions: PortraitDefinitionDTO): Promise<number> {
    const url = `${API_URL}api/rewards/portrait-definitions?authorization=${token}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(definitions),
    });
    return response.status;
  }

  public static async putPortraitDefinitions(token: string, definitions: PortraitDefinitionDTO): Promise<number> {
    const url = `${API_URL}api/rewards/portrait-definitions?authorization=${token}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(definitions),
    });
    return response.status;
  }

  public static async deletePortraitDefinitions(token: string, definitions: PortraitDefinitionDTO): Promise<number> {
    const url = `${API_URL}api/rewards/portrait-definitions?authorization=${token}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(definitions),
    });
    return response.status;
  }

  public static async getChatLog(token: string, matchId: string): Promise<ReplayChatLog> {
    const url = `${API_URL}api/replays/${matchId}/chats?authorization=${token}`;

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
