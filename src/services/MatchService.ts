import {EGameMode, Match, MatchDetail} from "@/store/typings";
import {API_URL} from "@/main";

export default class MatchService {
  private pageSize: number;

  constructor(pageSize: number) {
    this.pageSize = pageSize;
  }

  public async retrieveMatches(
    page: number,
    gateway: number
  ): Promise<{count: number, matches: Match[]}> {
    const offset = page * this.pageSize;
    const url = `${API_URL}api/matches?offset=${offset}&gateway=${gateway}&pageSize=${this.pageSize}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async retrieveMatchDetail(
    matchId: string
  ): Promise<MatchDetail> {
    const url = `${API_URL}api/matches/${matchId}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async retrievePlayerMatches(
    page: number,
    battleTag: string,
    opponentTag: string,
    gameMode: EGameMode,
  ): Promise<{count: number, matches: Match[]}> {
    const offset = page * 50;
    let url = `${API_URL}api/matches/search?offset=${offset}&playerId=${encodeURIComponent(battleTag)}`;

    if (opponentTag.length) {
      url += `&opponentId=${(encodeURIComponent(opponentTag))}`;
    } else {
      url += `&pageSize=${this.pageSize}`;
    }

    if (gameMode !== EGameMode.UNDEFINED) {
      url += `&gameMode=${gameMode}`;
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });
    return await response.json();
  }
}
