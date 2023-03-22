import {
  ModeStat,
  PlayerMmrRpTimeline,
  PlayerProfile,
  PlayerStatsHeroOnMapVersusRace,
  PlayerStatsRaceOnMapVersusRace,
  RaceStat,
} from "@/store/player/types";
import { API_URL } from "@/main";
import { Gateways } from "@/store/ranking/types";
import { ERaceEnum, EGameMode } from "@/store/typings";

export default class ProfileService {
  public static async retrieveWinRate(
    battleTag: string,
    season: number
  ): Promise<RaceStat> {
    const url = `${API_URL}api/players/${encodeURIComponent(
      battleTag
    )}/winrate?season=${season}`;
    const response = await fetch(url);

    const data = await response.json();
    return data.stats;
  }

  public static async retrieveProfile(
    battleTag: string,
    authCode: string | null
  ): Promise<PlayerProfile> {
    let url = `${API_URL}api/players/${encodeURIComponent(battleTag)}`;

    if (authCode) {
      url += `?authorization=${authCode}`;
    }

    const response = await fetch(url);

    return await response.json();
  }

  public static async searchPlayer(search: string): Promise<PlayerProfile[]> {
    const url = `${API_URL}api/players/?search=${encodeURIComponent(search)}`;

    const response = await fetch(url);

    return await response.json();
  }

  public static async invitePlayer(
    battleTag: string,
    clanId: string,
    token: string
  ): Promise<string> {
    const url = `${API_URL}api/clans/${clanId}/invites?authorization=${token}`;

    const post = { PlayerBattleTag: battleTag };
    const data = JSON.stringify(post);
    const response = await fetch(url, {
      method: "POST",
      body: data,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.ok ? "" : (await response.json()).error;
  }

  public static async retrieveGameModeStats(
    battleTag: string,
    gateWay: Gateways,
    season: number
  ): Promise<ModeStat[]> {
    const url = `${API_URL}api/players/${encodeURIComponent(
      battleTag
    )}/game-mode-stats?gateWay=${gateWay}&season=${season}`;

    const response = await fetch(url);

    return await response.json();
  }

  public static async retrieveRaceStats(
    battleTag: string,
    gateWay: Gateways,
    season: number
  ): Promise<RaceStat[]> {
    const url = `${API_URL}api/players/${encodeURIComponent(
      battleTag
    )}/race-stats?gateWay=${gateWay}&season=${season}`;

    const response = await fetch(url);

    return await response.json();
  }
  public static async retrievePlayerStatsRaceVersusRaceOnMap(
    battleTag: string,
    season: number
  ): Promise<PlayerStatsRaceOnMapVersusRace> {
    const url = `${API_URL}api/player-stats/${encodeURIComponent(
      battleTag
    )}/race-on-map-versus-race?season=${season}`;

    const response = await fetch(url);
    return await response.json();
  }

  public static async retrievePlayerStatsHeroVersusRaceOnMap(
    battleTag: string,
    season: number
  ): Promise<PlayerStatsHeroOnMapVersusRace> {
    const url = `${API_URL}api/player-stats/${encodeURIComponent(
      battleTag
    )}/hero-on-map-versus-race?season=${season}`;

    const response = await fetch(url);
    return await response.json();
  }

  public static async retrievePlayerMmrRpTimeline(
    battleTag: string,
    race: ERaceEnum,
    gateWay: Gateways,
    season: number,
    gameMode: EGameMode
  ): Promise<PlayerMmrRpTimeline | undefined> {
    const url = `${API_URL}api/players/${encodeURIComponent(
      battleTag
    )}/mmr-rp-timeline?race=${race}&gateWay=${gateWay}&season=${season}&gameMode=${gameMode}`;

    const response = await fetch(url);
    if (response.ok && response.status == 200) {
      return await response.json();
    } else {
      return undefined;
    }
  }
}
