import {ModeStat, PlayerProfile, RaceStat, WinRate} from "@/store/player/types";
import {API_URL} from "@/main";
import {EGameMode, ERaceEnum} from "@/store/typings";

export default class ProfileService {
  public async retrieveWinRate(battleTag: string): Promise<WinRate> {
    const url = `${API_URL}api/players/${battleTag.replace("#", "%23")}/winrate`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    return data.stats;
  }

  public async retrieveProfile(battleTag: string): Promise<PlayerProfile> {
    const url = `${API_URL}api/players/${battleTag.replace("#", "%23")}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    const profile = {} as PlayerProfile;

    profile.id = data.id;

    const raceStats: RaceStat[] = [];

    const races: { [id: string]: ERaceEnum } = {
      human: ERaceEnum.HUMAN,
      orc: ERaceEnum.ORC,
      undead: ERaceEnum.UNDEAD,
      'night_elf': ERaceEnum.NIGHT_ELF,
      random: ERaceEnum.RANDOM,
      total: ERaceEnum.TOTAL
    };

    data.raceStats.forEach((stat:any) => {
      const percentage =
          (stat.wins * 100) / (stat.wins + stat.losses) || 0;
      raceStats.push({
        race: stat.race,
        wins: stat.wins,
        losses: stat.losses,
        total: stat.wins + stat.losses,
        percentage: percentage > 0 ? Number(percentage.toFixed(1)) : 0
      });
    });


    profile.raceStats = raceStats;

    profile.modeStats = this.getGameModeStats(data.gameModeStats);

    return profile;
  }

  public async retrieveRawProfile(battleTag: string) {
    const url = `${API_URL}api/players/${battleTag.replace("#", "%23")}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    return await response.json();
  }

  private getGameModeStats(gameModeStats: any): ModeStat[] {
    const modeStats: ModeStat[] = [];
    const gameModes: { [id: string]: EGameMode } = {
      solo: EGameMode.GM_1ON1,
      two: EGameMode.GM_2ON2,
      three: EGameMode.GM_3ON3,
      four: EGameMode.GM_4ON4,
      ffa: EGameMode.GM_FFA
    };

    gameModeStats.forEach((mode: ModeStat) => {

      modeStats.push({
        mode: mode.mode,
        wins: mode.wins,
        losses: mode.losses,
        winrate: mode.winrate,
        mmr: mode.mmr,
      });

    });

    return modeStats;
  }
}
