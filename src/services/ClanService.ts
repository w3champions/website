import { API_URL } from "@/main";
import { Clan, ClanMembership } from "@/store/clan/types";
import { authorizedFetch } from "@/helpers/general";

export default class ClanService {
  public static async retrieveClanForPlayer(battleTag: string): Promise<Clan> {
    const url = `${API_URL}api/clans?battleTag=${encodeURIComponent(battleTag)}`;
    const response = await fetch(url);
    if (response.status === 204) return {} as Clan;
    return await response.json();
  }

  public static async acceptInvite(clanId: string, battleTag: string, token: string): Promise<boolean> {
    const response = await authorizedFetch(
      "PUT",
      `${API_URL}api/clans/${clanId}/invites/${encodeURIComponent(battleTag)}`,
      token,
    );

    return response.ok;
  }

  public static async rejectInvite(clanId: string, battleTag: string, token: string): Promise<boolean> {
    const response = await authorizedFetch(
      "DELETE",
      `${API_URL}api/clans/${clanId}/invites/${encodeURIComponent(battleTag)}`,
      token,
    );

    return response.ok;
  }

  public static async addShaman(clanId: string, battleTag: string, token: string): Promise<string> {
    const response = await authorizedFetch(
      "POST",
      `${API_URL}api/clans/${clanId}/shamans`,
      token,
      JSON.stringify({ PlayerBattleTag: battleTag }),
    );
    return response.ok ? "" : (await response.json()).error;
  }

  public static async removeShaman(clanId: string, battleTag: string, token: string): Promise<string> {
    const response = await authorizedFetch(
      "DELETE",
      `${API_URL}api/clans/${clanId}/shamans/${encodeURIComponent(battleTag)}`,
      token,
    );
    return response.ok ? "" : (await response.json()).error;
  }

  public static async switchChieftain(clanId: string, battleTag: string, token: string): Promise<string> {
    const response = await authorizedFetch(
      "PUT",
      `${API_URL}api/clans/${clanId}/chieftain`,
      token,
      JSON.stringify({ PlayerBattleTag: battleTag }),
    );

    return response.ok ? "" : (await response.json()).error;
  }

  public static async leaveClan(clanId: string, battleTag: string, token: string): Promise<boolean> {
    const response = await authorizedFetch(
      "DELETE",
      `${API_URL}api/clans/${clanId}/members/${encodeURIComponent(battleTag)}`,
      token,
    );
    return response.ok;
  }

  public static async deleteClan(clanId: string, token: string): Promise<boolean> {
    const response = await authorizedFetch(
      "DELETE",
      `${API_URL}api/clans/${clanId}`,
      token,
    );
    return response.ok;
  }

  public static async retrievePlayerMembership(battleTag: string): Promise<ClanMembership> {
    const url = `${API_URL}api/memberships/${encodeURIComponent(battleTag)}`;
    const response = await fetch(url);
    if (response.status === 204) return {} as ClanMembership;
    return await response.json();
  }

  public static async revokeInvite(battleTag: string, clanId: string, token: string): Promise<string> {
    const response = await authorizedFetch(
      "DELETE",
      `${API_URL}api/clans/${clanId}/invites`,
      token,
      JSON.stringify({ PlayerBattleTag: battleTag }),
    );
    return response.ok ? "" : (await response.json()).error;
  }

  public static async invitePlayer(battleTag: string, clanId: string, token: string): Promise<string> {
    const response = await authorizedFetch(
      "POST",
      `${API_URL}api/clans/${clanId}/invites`,
      token,
      JSON.stringify({ PlayerBattleTag: battleTag }),
    );

    return response.ok ? "" : (await response.json()).error;
  }

  public static async kickPlayer(battleTag: string, clanId: string, token: string): Promise<string> {
    const response = await authorizedFetch(
      "PUT",
      `${API_URL}api/clans/${clanId}/members/${encodeURIComponent(battleTag)}`,
      token,
    );

    if (response.ok) return "";

    return (await response.json()).error;
  }

  public static async createClan(clanName: string, abbreviation: string, authToken: string): Promise<string> {
    const response = await authorizedFetch(
      "POST",
      `${API_URL}api/clans`,
      authToken,
      JSON.stringify({ ClanName: clanName, ClanAbbrevation: abbreviation }),
    );

    if (response.ok) return "";

    const error = (await response.json()).error;
    return error;
  }
}
