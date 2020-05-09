import {API_URL} from "@/main";
import {
  GameDay,
  GameLength,
  PlayedHero, PlayedHeroByMode,
  PlayersPerDay,
  PopularGameHour,
  StatsPerMapAndRace, WinLoss
} from "@/store/overallStats/types";

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

  public async retrieveMapAndRaceStats(): Promise<StatsPerMapAndRace[]> {
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

  public async retrieveGameTimes(): Promise<GameLength[]> {
    const url = `${API_URL}api/w3c-stats/games-lengths`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    return data.gameLengths;
  }

  public async retrievePlayedHeroes(): Promise<PlayedHeroByMode[]> {
    const url = `${API_URL}api/w3c-stats/heroes-played`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    return await response.json();
  }

  public async retrievePopularGameHours(): Promise<PopularGameHour[]> {
    const url = `${API_URL}api/w3c-stats/play-hours`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    return await response.json();
  }

  public async retrieveHeroWinrates(
      first: string,
      second: string,
      third: string,
      opFirst: string,
      opSecond: string,
      opThird: string,
  ): Promise<WinLoss> {
    const url = `${API_URL}api/w3c-stats/heroes-winrate?first=${first}&second=${second}&third=${third}&opFirst=${opFirst}&opSecond=${opSecond}&opThird=${opThird}`;
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
