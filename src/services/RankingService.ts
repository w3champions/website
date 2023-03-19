import {
  Ranking,
  Gateways,
  Ladder,
  Season,
  CountryRanking,
} from "@/store/ranking/types";
import { API_URL } from "@/main";
import { EGameMode } from "@/store/typings";

export default class RankingService {
  public static async retrieveRankings(
    leagueId: number,
    gateway: Gateways,
    gameMode: EGameMode,
    season: number
  ): Promise<Ranking[]> {
    const url = `${API_URL}api/ladder/${leagueId}?gateWay=${gateway}&gameMode=${gameMode}&season=${season}`;

    const response = await fetch(url);
    return await response.json();
  }

  public static async retrieveCountryRankings(
    countryCode: string,
    gateway: Gateways,
    gameMode: EGameMode,
    season: number
  ): Promise<CountryRanking[]> {
    const url = `${API_URL}api/ladder/country/${countryCode}?gateWay=${gateway}&gameMode=${gameMode}&season=${season}`;

    const response = await fetch(url);
    return await response.json();
  }

  public static async searchRankings(
    str: string,
    gateway: Gateways,
    gameMode: EGameMode,
    season: number
  ): Promise<Ranking[]> {
    const url = `${API_URL}api/ladder/search?gateWay=${gateway}&searchFor=${str}&gameMode=${gameMode}&season=${season}`;

    const response = await fetch(url);
    return await response.json();
  }

  public static async retrieveLadders(season: number): Promise<Ladder[]> {
    const url = `${API_URL}api/ladder/league-constellation?season=${season}`;

    const response = await fetch(url);
    return await response.json();
  }

  public static async retrieveSeasons(): Promise<Season[]> {
    const url = `${API_URL}api/ladder/seasons`;

    const response = await fetch(url);
    return await response.json();
  }
}
