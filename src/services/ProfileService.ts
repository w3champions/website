import {PlayerProfile, WinRate} from "@/store/player/types";
import {API_URL} from "@/main";

export default class ProfileService {
  public async retrieveWinRate(battleTag: string): Promise<WinRate> {
    const url = `${API_URL}api/players/${encodeURIComponent(battleTag)}/winrate`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    return data.stats;
  }

  public async retrieveProfile(battleTag: string): Promise<PlayerProfile> {
    const url = `${API_URL}api/players/${encodeURIComponent(battleTag)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    return await response.json();
  }
}
