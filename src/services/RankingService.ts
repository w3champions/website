import { Ranking } from "@/store/ranking/types";
import { API_URL } from '@/main';

export default class RankingService {
  private pageSize: number;

  constructor(pageSize: number) {
    this.pageSize = pageSize;
  }

  public async retrieveRankings(
    page: number
  ): Promise<{ total: number; items: Ranking[] }> {
    const offset = page * this.pageSize;
    const url = `${API_URL}/rank?limit=${this.pageSize}&offset=${offset}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async searchRankings(str: string): Promise<{ total: number, items: Ranking[] }> {
    const url = `${API_URL}/rank?filter=${str}&limit=5`;

    const response = await fetch(url);
    return await response.json();
  }

  public async getRanksAroundRanking(rank: number): Promise<{total: number, items: Ranking[]}> {
    const url = `${API_URL}/rank?limit=${this.pageSize}&offset=${rank - (Math.floor(this.pageSize / 2))}`
    const response = await fetch(url);
    return await response.json();
  }
}
