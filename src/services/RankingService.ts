import { Ranking, Gateways } from "@/store/ranking/types";
import { API_URL } from "@/main";

export default class RankingService {
  public async retrieveRankings(
    leagueId: number,
    gateway: Gateways
  ): Promise<Ranking[]> {
    const url = `${API_URL}api/ladder/${leagueId}?gateWay=${gateway}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async searchRankings(
    str: string,
    gateway: Gateways
  ): Promise<Ranking[]> {
    const url = `${API_URL}api/ladder/search?gateWay=${gateway}&searchFor=${str}`;

    const response = await fetch(url);
    return await response.json();
  }
}
