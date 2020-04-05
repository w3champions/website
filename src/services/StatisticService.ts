import {API_URL} from "@/main";
import {GameDay, PlayersPerDay, StatsPerMapAndRace} from "@/store/overallStats/types";

export default class StatisticService {
  public async retrieveGamesPerDay(): Promise<GameDay[]> {
    const url = `${API_URL}api/w3c-stats/games-per-day`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    return await response.json();
  }

  public async retrievePlayersPerDay(): Promise<PlayersPerDay[]> {
    const url = `${API_URL}api/w3c-stats/distinct-players-per-day`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    return await response.json();
  }

  public async retrieveMapAndRaceStats(): Promise<StatsPerMapAndRace> {
    const url = `${API_URL}api/w3c-stats/map-race-wins`;
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
