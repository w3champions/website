import { Ranking } from "@/store/ranking/types";

export default class RankingService {
  private pageSize: number;

  constructor(pageSize: number) {
    this.pageSize = pageSize;
  }

  public async retrieveRankings(
    page: number
  ): Promise<{ total: number; items: Ranking[] }> {
    const offset = page * this.pageSize;
    const url = `http://w3champions.com:25059/rank?limit=${this.pageSize}&offset=${offset}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async searchRankings(str: string): Promise<Ranking[]> {
    const url = `/rank?filter=${str}&limit=5`;

    const response = await fetch(url);
    return await response.json();


    // return this.createSearchFakeData(str);
  }

  private createFakeData(page: number) {
    const data: Ranking[] = [];

    for (let i = page * this.pageSize; i < (page + 1) * this.pageSize; i++) {
      data.push({
        rank: i + 1,
        battleTag: `Player ${i + 1}`,
        wins: i,
        losses: i,
        level: Math.floor(Math.random() * 50),
        levelProgress: Math.random()
      });
    }

    return data;
  }

  private createSearchFakeData(str: string) {
    const data: Ranking[] = [];

    for (let i = 0; i < 5; i++) {
      data.push({
        rank: i + 1,
        battleTag: `${str}-Player ${Math.floor(Math.random() * 50)}`,
        wins: i,
        losses: i,
        level: Math.floor(Math.random() * 50),
        levelProgress: Math.random()
      });
    }

    return data;
  }
}
