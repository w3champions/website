import { Ranking, Gateways } from "@/store/ranking/types";
import { API_URL } from "@/main";

export default class RankingService {
  private pageSize: number;

  constructor(pageSize: number) {
    this.pageSize = pageSize;
  }

  public async retrieveRankings(
    page: number,
    gateway: Gateways
  ): Promise<Ranking[]> {
    const offset = page * this.pageSize;
    const url = `${API_URL}api/ladder?pageSize=${this.pageSize}&offset=${offset}&gateway=${gateway}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async searchRankings(
    str: string,
    gateway: Gateways
  ): Promise<Ranking[]> {
    const url = `${API_URL}api/ladder?gateway=${gateway}&searchFor=${str}`;

    const response = await fetch(url);
    return await response.json();
  }
}
