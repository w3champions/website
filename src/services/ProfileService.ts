import {PlayerProfile, PlayerStatsRaceOnMapVersusRace, RaceStat } from "@/store/player/types";
import {API_URL} from "@/main";

export default class ProfileService {
  public async retrieveWinRate(battleTag: string, season: number): Promise<RaceStat> {
    const url = `${API_URL}api/players/${encodeURIComponent(battleTag)}/winrate?season=${season}`;
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

  public async retrieveProfile(battleTag: string, season: number): Promise<PlayerProfile> {
    const url = `${API_URL}api/players/${encodeURIComponent(battleTag)}?season=${season}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    return await response.json();
  }

  public async retrievePlayerStatsRaceVersusRaceOnMap(battleTag: string, season: number): Promise<PlayerStatsRaceOnMapVersusRace> {
    const url = `${API_URL}api/player-stats/${encodeURIComponent(battleTag)}/race-on-map-versus-race?season=${season}`;

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
