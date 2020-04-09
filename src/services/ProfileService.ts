import {PlayerProfile, WinRate} from "@/store/player/types";
import {API_URL} from "@/main";

export default class ProfileService {
  public async retrieveWinRate(battleTag: string): Promise<WinRate> {
    const url = `${API_URL}api/players/${battleTag.replace("#", "%23")}/winrate`;
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
    const url = `${API_URL}api/players/${battleTag.replace("#", "%23")}`;

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
