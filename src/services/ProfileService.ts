import {
  ModeStat,
  PlayerMmrRpTimeline,
  PlayerProfile,
  PlayerStatsRaceOnMapVersusRace,
  RaceStat,
} from "@/store/player/types";
import { STATISTIC_SERVICE_URL } from "@/main";
import { Gateways } from "@/store/ranking/types";
import { ERaceEnum, EGameMode } from "@/store/typings";

export default class ProfileService {
  public async retrieveWinRate(
    battleTag: string,
    season: number
  ): Promise<RaceStat> {
    const url = `${STATISTIC_SERVICE_URL}api/players/${encodeURIComponent(
      battleTag
    )}/winrate?season=${season}`;
    const response = await fetch(url);

    const data = await response.json();
    return data.stats;
  }

  public async retrieveProfile(battleTag: string, authCode: string | null): Promise<PlayerProfile> {
    let url = `${STATISTIC_SERVICE_URL}api/players/${encodeURIComponent(battleTag)}`;

    if (authCode) {
      url += `?authorization=${authCode}`
    }

    const response = await fetch(url);

    return await response.json();
  }

  public async searchPlayer(search: string): Promise<PlayerProfile[]> {
    const url = `${STATISTIC_SERVICE_URL}api/players/?search=${encodeURIComponent(search)}`;

    const response = await fetch(url);

    return await response.json();
  }

  public async retrieveGameModeStats(
    battleTag: string,
    gateWay: Gateways,
    season: number
  ): Promise<ModeStat[]> {
    const url = `${STATISTIC_SERVICE_URL}api/players/${encodeURIComponent(
      battleTag
    )}/game-mode-stats?gateWay=${gateWay}&season=${season}`;

    const response = await fetch(url);

    return await response.json();
  }

  public async retrieveRaceStats(
    battleTag: string,
    gateWay: Gateways,
    season: number
  ): Promise<RaceStat[]> {
    const url = `${STATISTIC_SERVICE_URL}api/players/${encodeURIComponent(
      battleTag
    )}/race-stats?gateWay=${gateWay}&season=${season}`;

    const response = await fetch(url);

    return await response.json();
  }
  public async retrievePlayerStatsRaceVersusRaceOnMap(
    battleTag: string,
    season: number
  ): Promise<PlayerStatsRaceOnMapVersusRace> {
    const url = `${STATISTIC_SERVICE_URL}api/player-stats/${encodeURIComponent(
      battleTag
    )}/race-on-map-versus-race?season=${season}`;

    const response = await fetch(url);
    return await response.json();
  }

  public async retrievePlayerMmrRpTimeline(
    battleTag: string,
    race: ERaceEnum,
    gateWay: Gateways,
    season: number,
    gameMode: EGameMode
  ): Promise<PlayerMmrRpTimeline | undefined> {
    const url = `${STATISTIC_SERVICE_URL}api/players/${encodeURIComponent(
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
