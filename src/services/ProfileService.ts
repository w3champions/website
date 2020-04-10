import {PlayerProfile, PlayerStatsRaceOnMapVersusRace, RaceStat } from "@/store/player/types";
import {API_URL} from "@/main";

export default class ProfileService {
  public async retrieveWinRate(battleTag: string): Promise<RaceStat> {
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

  public async retrievePlayerStatsRaceVersusRaceOnMap(battleTag: string): Promise<PlayerStatsRaceOnMapVersusRace> {
    const url = `${API_URL}api/player-stats/${encodeURIComponent(battleTag)}/race-on-map-versus-race`;

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
