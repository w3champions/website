import { describe, expect, it } from "vitest";
import { defaultStatsTab } from "./profile";
import type { RaceStat, RaceWinsOnMap, WinLossesOnMap } from "@/store/player/types";
import { ERaceEnum } from "@/store/types";
import { Gateways } from "@/store/ranking/types";

function raceStat(race: ERaceEnum, games: number): RaceStat {
  return { race, gateWay: Gateways.Europe, season: 25, wins: games, losses: 0, games, winrate: 1 };
}

function onMap(map: string, mapName: string, games: number): WinLossesOnMap {
  return { map, mapName, winLosses: [raceStat(ERaceEnum.HUMAN, games)] };
}

describe("defaultStatsTab", () => {
  it("counts the files of one map together", () => {
    const raceWinsOnMap: RaceWinsOnMap[] = [
      { race: ERaceEnum.ORC, winLossesOnMap: [onMap("cf.w3x", "Castle Fight", 60)] },
      { race: ERaceEnum.HUMAN, winLossesOnMap: [onMap("ltd_a.w3x", "Legion TD", 40), onMap("ltd_b.w3x", "Legion TD", 40)] },
    ];

    expect(defaultStatsTab(raceWinsOnMap)).toBe(`tab-${ERaceEnum.HUMAN}`);
  });

  it("ignores the total and falls back to it without data", () => {
    expect(defaultStatsTab([{ race: ERaceEnum.TOTAL, winLossesOnMap: [onMap("a.w3x", "A", 99)] }])).toBe(`tab-${ERaceEnum.TOTAL}`);
    expect(defaultStatsTab(undefined as unknown as RaceWinsOnMap[])).toBe(`tab-${ERaceEnum.TOTAL}`);
  });
});
