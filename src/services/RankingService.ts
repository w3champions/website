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

  public toRank(rank: number) {
    if (rank === 0) {
      return '-';
    }

    const j = rank % 10,
      k = rank % 100;
    if (j == 1 && k != 11) {
      return rank + "st";
    }
    if (j == 2 && k != 12) {
      return rank + "nd";
    }
    if (j == 3 && k != 13) {
      return rank + "rd";
    }
    return rank + "th";
  }
}
