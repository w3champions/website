import { EGameMode, Match, MatchDetail } from "@/store/typings";
import { API_URL } from "@/main";
import { Gateways } from "@/store/ranking/types";

export default class MatchService {
  private pageSize: number;

  constructor(pageSize: number) {
    this.pageSize = pageSize;
  }

  public async retrieveMatches(
    page: number,
    gateway: number,
    gameMode: EGameMode,
    map: string
  ): Promise<{ count: number; matches: Match[] }> {
    const offset = page * this.pageSize;
    const url = `${API_URL}api/matches?offset=${offset}&gateway=${gateway}&pageSize=${this.pageSize}&gameMode=${gameMode}&map=${map}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async retrieveOnGoingMatchesPaged(
    page: number,
    gateway: number,
    gameMode: EGameMode,
    map: string
  ): Promise<{ count: number; matches: Match[] }> {
    const offset = page * this.pageSize;

    return this.retrieveOnGoingMatches(
      offset,
      this.pageSize,
      gateway,
      gameMode,
      map
    );
  }

  public async retrieveOnGoingMatches(
    offset: number,
    pageSize: number,
    gateway: number,
    gameMode: EGameMode,
    map: string
  ): Promise<{ count: number; matches: Match[] }> {
    const url = `${API_URL}api/matches/ongoing?offset=${offset}&gateway=${gateway}&pageSize=${pageSize}&gameMode=${gameMode}&map=${map}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async retrieveOnGoingPlayerMatch(playerId: string): Promise<Match> {
    const url = `${API_URL}api/matches/ongoing/${encodeURIComponent(playerId)}`;

    const response = await fetch(url);

    if (response.status == 204) {
      return {} as Match;
    }

    return await response.json();
  }

  public async retrieveMatchDetail(matchId: string): Promise<MatchDetail> {
    const url = `${API_URL}api/matches/${matchId}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async retrievePlayerMatches(
    page: number,
    battleTag: string,
    opponentTag: string,
    gameMode: EGameMode,
    gateway: Gateways,
    season: number
  ): Promise<{ count: number; matches: Match[] }> {
    const offset = page * 50;
    let url = `${API_URL}api/matches/search?playerId=${encodeURIComponent(
      battleTag
    )}&gateway=${gateway}`;

    if (opponentTag.length) {
      url += `&offset=${offset}&opponentId=${encodeURIComponent(
        opponentTag
      )}&pageSize=${this.pageSize}`;
    } else {
      url += `&offset=${offset}&pageSize=${this.pageSize}`;
    }

    if (gameMode !== EGameMode.UNDEFINED) {
      url += `&gameMode=${gameMode}`;
    }

    url += `&season=${season}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  }
}
