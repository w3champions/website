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

    profile.modeStats = data.gameModeStats;

    return profile;
  }
}
