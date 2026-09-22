import { ActiveGameMode, CountryRanking, Gateways, Ladder, RankInContext, Ranking, Season } from "@/store/ranking/types";
import { API_URL } from "@/config/env";
import { EGameMode } from "@/store/types";

export default class RankingService {
  public static async retrieveRankings(
    leagueId: number,
    gateway: Gateways,
    gameMode: EGameMode,
    season: number,
  ): Promise<Ranking[]> {
    const url = `${API_URL}api/ladder/${leagueId}?gateWay=${gateway}&gameMode=${gameMode}&season=${season}`;

    const response = await fetch(url);
    return await response.json();
  }

  public static async retrieveCountryRankings(
    countryCode: string,
    gateway: Gateways,
    gameMode: EGameMode,
    season: number,
  ): Promise<CountryRanking[]> {
    const url = `${API_URL}api/ladder/country/${countryCode}?gateWay=${gateway}&gameMode=${gameMode}&season=${season}`;

    const response = await fetch(url);
    return await response.json();
  }

  public static async searchRankings(
    str: string,
    gateway: Gateways,
    gameMode: EGameMode,
    season: number,
  ): Promise<Ranking[]> {
    const url = `${API_URL}api/ladder/search?gateWay=${gateway}&searchFor=${encodeURIComponent(str)}&gameMode=${gameMode}&season=${season}`;

    const response = await fetch(url);
    if (!response.ok) {
      // Error bodies are plain text, not JSON — surface them as the error they are.
      throw new Error(`ladder search failed (${response.status}): ${await response.text()}`);
    }
    return await response.json();
  }

  // Rank-in-context enrichment for the consolidated search: given a page of battleTags, returns the
  // rank for each one that is ranked in {season, gateway, gameMode}. Unranked tags are simply absent.
  public static async searchRanksForPlayers(
    battleTags: string[],
    gateway: Gateways,
    gameMode: EGameMode,
    season: number,
  ): Promise<RankInContext[]> {
    const url = `${API_URL}api/ladder/ranks-for-players`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ battleTags, season, gateWay: gateway, gameMode }),
    });
    if (!response.ok) {
      throw new Error(`ranks-for-players failed (${response.status}): ${await response.text()}`);
    }
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

  public static async retrieveActiveGameModes(): Promise<ActiveGameMode[] | null> {
    const url = `${API_URL}api/ladder/active-modes`;

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  }
}
