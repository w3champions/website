import { Match } from "@/store/typings";
import { API_URL } from "@/main";

export default class MatchService {
  private pageSize: number;

  constructor(pageSize: number) {
    this.pageSize = pageSize;
  }

  public async retrieveMatches(
    page: number,
    gateway: number
  ): Promise<Match[]> {
    const offset = page * this.pageSize;
    const url = `${API_URL}api/matches?offset=${offset}&gateway=${gateway}&pageSize=${this.pageSize}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async retrievePlayerMatches(
    page: number,
    gateway: number,
    battleTag: string
  ): Promise<Match[]> {
    const offset = page * 15;
    const url = `${API_URL}api/matches/search?offset=${offset}&gateway=${gateway}&playerId=${encodeURIComponent(battleTag)}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });
    return await response.json();
  }
}
