import { API_URL } from "@/main";
import { Clan } from "@/store/clan/types";

export default class ClanService {
  public async retrieveClan(clanId: string): Promise<Clan> {
    const url = `${API_URL}api/clans/${clanId}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async retrieveClanForPlayer(battleTag: string): Promise<Clan> {
    const url = `${API_URL}api/clans?battleTag=${encodeURIComponent(
      battleTag
    )}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async revokeInvite(
    battleTag: string,
    clanId: string,
    token: string
  ): Promise<string> {
    const url = `${API_URL}api/clans/${clanId}/invites?authorization=${token}`;

    const post = { PlayerBattleTag: battleTag };
    const data = JSON.stringify(post);
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

  public async invitePlayer(
    battleTag: string,
    clanId: string,
    token: string
  ): Promise<string> {
    const url = `${API_URL}api/clans/${clanId}/invites?authorization=${token}`;

    const post = { PlayerBattleTag: battleTag };
    const data = JSON.stringify(post);
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

  public async createClan(
    clanName: string,
    authToken: string
  ): Promise<string> {
    const url = `${API_URL}api/clans/?authorization=${authToken}`;

    const post = { ClanName: clanName };
    const data = JSON.stringify(post);
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
}
