import { API_URL } from "@/main";
import { Clan, ClanMembership } from "@/store/clan/types";

export default class ClanService {

  public async retrieveClanForPlayer(battleTag: string): Promise<Clan> {
    const url = `${API_URL}api/clans?battleTag=${encodeURIComponent(
      battleTag
    )}`;

    const response = await fetch(url);
    if (!response) return { id: "", pendingInvites: [], foundingFathers: [], chiefTain: "", clanName: "", isSuccesfullyFounded: false, members: [], shamans: [] };
    return await response.json();
  }

  public async acceptInvite(clanId: string, battleTag: string, token: string): Promise<boolean> {
    const url = `${API_URL}api/clans/${clanId}/invites/${encodeURIComponent(battleTag)}?authorization=${token}`;

    const response = await fetch(url, {
      method: "PUT",
    });
    return response.ok;
  }

  public async rejectInvite(clanId: string, battleTag: string, token: string): Promise<boolean> {
    const url = `${API_URL}api/clans/${clanId}/invites/${encodeURIComponent(battleTag)}?authorization=${token}`;

    const response = await fetch(url, {
      method: "DELETE",
    });
    return response.ok;
  }

  public async addShaman(clanId: string, battleTag: string, token: string): Promise<string> {
    const url = `${API_URL}api/clans/${clanId}/shamans/?authorization=${token}`;

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

  public async removeShaman(clanId: string, battleTag: string, token: string): Promise<string> {
    const url = `${API_URL}api/clans/${clanId}/shamans/${encodeURIComponent(battleTag)}?authorization=${token}`;

    const response = await fetch(url, {
      method: "DELETE",
    });
    return response.ok ? "" : (await response.json()).error;
  }

  public async leaveClan(clanId: string, battleTag: string, token: string): Promise<boolean> {
    const url = `${API_URL}api/clans/${clanId}/members/${encodeURIComponent(battleTag)}?authorization=${token}`;

    const response = await fetch(url, {
      method: "DELETE",
    });
    return response.ok;
  }

  public async retrievePlayerMembership(battleTag: string): Promise<ClanMembership> {
    const url = `${API_URL}api/memberships/${encodeURIComponent(battleTag)}`;

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
