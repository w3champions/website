import { ERaceEnum } from "@/store/types";
import { RaceWinsOnMap, WinLossesOnMap, RaceStat } from "@/store/player/types";

export const races = [
  {
    raceId: ERaceEnum.HUMAN,
    raceName: ERaceEnum[ERaceEnum.HUMAN]
  },
  {
    raceId: ERaceEnum.ORC,
    raceName: ERaceEnum[ERaceEnum.ORC]
  },
  {
    raceId: ERaceEnum.NIGHT_ELF,
    raceName: ERaceEnum[ERaceEnum.NIGHT_ELF]
  },
  {
    raceId: ERaceEnum.UNDEAD,
    raceName: ERaceEnum[ERaceEnum.UNDEAD]
  },
  {
    raceId: ERaceEnum.RANDOM,
    raceName: ERaceEnum[ERaceEnum.RANDOM]
  },
  {
    raceId: ERaceEnum.TOTAL,
    raceName: ERaceEnum[ERaceEnum.TOTAL]
  },
];

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
          .reduce((a: number, b:number) => a + b, 0);

        if (maxGames < gamesOfRace) {
          maxRace = s.race;
          maxGames = gamesOfRace;
        }
      })
    );
  return `tab-${maxRace}`;
}
