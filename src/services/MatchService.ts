import { Match } from "@/store/typings";
import { API_URL } from "@/main";

export default class MatchService {
  private pageSize: number;

  constructor(pageSize: number) {
    this.pageSize = pageSize;
  }

  public async retrieveMatches(
    page: number
  ): Promise<Match[]> {
    const offset = page * this.pageSize;
    const url = `${API_URL}/match?limit=${this.pageSize}&offset=${offset}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async retrievePlayerMatches(
    page: number,
    gateway: number,
    battleTag: string
  ): Promise<Match[]> {
    const offset = page * 15;
    const url = `${API_URL}api/matches/search?offset=0&pageSize=2&gateway=${gateway}&playerId=${encodeURIComponent(battleTag)}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });
    return await response.json();
  }
}
