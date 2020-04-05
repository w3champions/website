import {API_URL} from "@/main";
import {GameDay} from "@/store/overallStats/types";

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
}
