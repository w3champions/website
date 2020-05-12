import {Ranking, Gateways, Ladder, Season} from "@/store/ranking/types";
import { API_URL } from "@/main";
import {EGameMode} from "@/store/typings";

export default class RankingService {
  public async retrieveRankings(
    leagueId: number,
    gateway: Gateways,
    gameMode: EGameMode
  ): Promise<Ranking[]> {
    const url = `${API_URL}api/ladder/${leagueId}?gateWay=${gateway}&gameMode=${gameMode}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async searchRankings(
    str: string,
    gateway: Gateways,
    gameMode: EGameMode
  ): Promise<Ranking[]> {
    const url = `${API_URL}api/ladder/search?gateWay=${gateway}&searchFor=${str}&gameMode=${gameMode}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async retrieveLadders(): Promise<Ladder[]> {
    const url = `${API_URL}api/ladder/league-constellation`;

    const response = await fetch(url);
    return await response.json();
  }

  public async retrieveSeasons(): Promise<Season[]> {
    const url = `${API_URL}api/ladder/seasons`;

    const response = await fetch(url);
    return await response.json();
  }
}
