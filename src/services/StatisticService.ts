import { API_URL } from "@/main";
import {
  GameDayPerMode,
  GameLength,
  MatchesOnMapPerSeason,
  MatchupLength,
  MmrDistribution,
  PlayedHeroByMode,
  PlayersPerDay,
  PopularHours,
  StatsPerWinrate,
  WinLoss,
} from "@/store/overallStats/types";
import { EGameMode } from "@/store/types";
import { Gateways } from "@/store/ranking/types";

export default class StatisticService {
  public static async retrieveMapsPerSeason(): Promise<MatchesOnMapPerSeason[]> {
    const url = `${API_URL}api/w3c-stats/matches-on-map`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public static async retrieveGamesPerDay(): Promise<GameDayPerMode[][]> {
    const url = `${API_URL}api/w3c-stats/games-per-day`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public static async retrievePlayersPerDay(): Promise<PlayersPerDay[]> {
    const url = `${API_URL}api/w3c-stats/distinct-players-per-day`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public static async retrieveMapAndRaceStats(): Promise<StatsPerWinrate[]> {
    const url = `${API_URL}api/w3c-stats/map-race-wins`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public static async retrieveGameLengths(): Promise<GameLength[]> {
    const url = `${API_URL}api/w3c-stats/games-lengths`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public static async retrieveMatchupLengths(race1 = 1, race2 = 1, season = "all"): Promise<MatchupLength> {
    const url = `${API_URL}api/w3c-stats/matchup-lengths?season=${season}&race1=${race1}&race2=${race2}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public static async retrievePlayedHeroes(): Promise<PlayedHeroByMode[]> {
    const url = `${API_URL}api/w3c-stats/heroes-played`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public static async retrievePopularGameHours(): Promise<PopularHours[]> {
    const url = `${API_URL}api/w3c-stats/popular-hours`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public static async retrieveMmrDistribution(
    season: number,
    gameMode: EGameMode,
    gateWay: Gateways
  ): Promise<MmrDistribution> {
    const url = `${API_URL}api/w3c-stats/mmr-distribution?season=${season}&gateWay=${gateWay}&gameMode=${gameMode}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public static async retrieveHeroWinrates(
    first: string,
    second: string,
    third: string,
    opFirst: string,
    opSecond: string,
    opThird: string
  ): Promise<WinLoss> {
    const url = `${API_URL}api/w3c-stats/heroes-winrate?first=${first}&second=${second}&third=${third}&opFirst=${opFirst}&opSecond=${opSecond}&opThird=${opThird}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }
}
