import { ERaceEnum } from "@/store/types";
import { RaceStat, RaceWinsOnMap, WinLossesOnMap } from "@/store/player/types";

export function defaultStatsTab(raceWinsOnMap: RaceWinsOnMap[]): string {
  let maxRace = ERaceEnum.TOTAL;
  let maxGames = 0;

  if (!raceWinsOnMap) return `tab-${maxRace}`;

  raceWinsOnMap
    .filter((s: RaceWinsOnMap) => s.race !== ERaceEnum.TOTAL)
    .forEach((s: RaceWinsOnMap) =>
      s.winLossesOnMap.forEach((w: WinLossesOnMap) => {
        const gamesOfRace = w.winLosses
          .map((wl: RaceStat) => wl.games)
          .reduce((a: number, b: number) => a + b, 0);

        if (maxGames < gamesOfRace) {
          maxRace = s.race;
          maxGames = gamesOfRace;
        }
      })
    );
  return `tab-${maxRace}`;
}

export const battleTagToName = (battleTag: string): string =>
  battleTag ? battleTag.split("#")[0] : "";
