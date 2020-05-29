import { Match } from "@/store/typings";
import { API_URL } from "@/main";

export default class ClanService {

  public async retrieveClan(
      clanId: string
  ): Promise<{ count: number; matches: Match[] }> {
    const url = `${API_URL}api/clans/${clanId}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async createClan(
      clanName: string,
      authToken: string
  ): Promise<string> {
    const url = `${API_URL}api/clans/?authorization=${authToken}`;

    const post = { clanName };
    const data = JSON.stringify(post);
    const response = await fetch(url, {
      method: "POST",
      body: data,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.ok ? "" : "Could not create clan";
  }
}
