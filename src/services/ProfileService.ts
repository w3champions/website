import { ModeStat, PlayerProfile, RaceStat } from "@/store/player/types";
import { API_URL } from "@/main";
import { EGameMode, ERaceEnum } from "@/store/typings";

export default class ProfileService {
  public async retrieveProfile(battleTag: string): Promise<PlayerProfile> {
    const url = `${API_URL}/player/${battleTag.replace('#', '%23')}/stats`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
    });

    const data = await response.json();

    const profile = {} as PlayerProfile;

    profile.account = data.account;
    profile.server = data.server;

    const raceStats: RaceStat[] = [];

    const races: { [id: string]: ERaceEnum } = {
      human: ERaceEnum.HUMAN,
      orc: ERaceEnum.ORC,
      undead: ERaceEnum.UNDEAD,
      'night_elf': ERaceEnum.NIGHT_ELF,
      random: ERaceEnum.RANDOM,
      total: ERaceEnum.TOTAL
    };

    for (const key in data.data.stats) {
      if (Object.prototype.hasOwnProperty.call(data.data.stats, key)) {
        const element = data.data.stats[key];

        const percentage =
          (element.wins * 100) / (element.wins + element.losses) || 0;

        raceStats.push({
          race: races[key],
          wins: element.wins,
          losses: element.losses,
          total: element.wins + element.losses,
          percentage: percentage > 0 ? Number(percentage.toFixed(1)) : 0
        });
      }
    }

    profile.stats = raceStats;

    const modeStats: ModeStat[] = [];
    const gameModes: { [id: string]: EGameMode } = {
      solo: EGameMode.GM_1ON1,
      two: EGameMode.GM_2ON2,
      three: EGameMode.GM_3ON3,
      four: EGameMode.GM_4ON4,
      ffa: EGameMode.GM_FFA
    };

    for (const key in data.data.ladder) {
      if (Object.prototype.hasOwnProperty.call(data.data.ladder, key)) {
        const element = data.data.ladder[key];

        modeStats.push({
          mode: gameModes[key],
          wins: element.wins,
          losses: element.losses,
          rank: element.rank,
          mmr: element.mmr,
        });
      }
    }

    profile.ladder = modeStats;

    return profile;
  }

  public async retrieveRawProfile(battleTag: string) {
    const url = `${API_URL}/player/${battleTag.replace('#', '%23')}/stats`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
    });

    return await response.json();
  }
}
