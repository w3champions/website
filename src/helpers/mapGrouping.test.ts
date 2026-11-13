import { describe, expect, it } from "vitest";
import { compareMapGroupKeys, groupMapCounts, groupWinLossesOnMap, hasMapGroup, mapGroupInfos, mapGroupKey, mapGroupKeys, mapSelectOptions, mergeRaceStats, OVERALL_MAP, RARE_MAP_SHARE, winLossesForMapGroup, withoutRareMaps } from "./mapGrouping";
import type { MapCount } from "@/store/overallStats/types";
import type { RaceStat, WinLossesOnMap } from "@/store/player/types";
import { ERaceEnum } from "@/store/types";
import { Gateways } from "@/store/ranking/types";

const ECHO_ISLES_FILES = [
  "1051_w3c_260615_2308_EchoIsles_v2.2.w3x",
  "1051_w3c_260915_0738_EchoIsles_v2.2.w3x",
  "w3c_EchoIsles_v2.2.w3x",
];

function raceStat(race: ERaceEnum, wins: number, losses: number): RaceStat {
  const games = wins + losses;
  return { race, gateWay: Gateways.Europe, season: 25, wins, losses, games, winrate: games ? wins / games : 0 };
}

function onMap(map: string, mapName: string | null | undefined, winLosses: RaceStat[]): WinLossesOnMap {
  return { map, mapName, winLosses };
}

describe("mapGroupKey", () => {
  it("uses the map name, without colour codes", () => {
    expect(mapGroupKey({ map: ECHO_ISLES_FILES[0], mapName: "Echo Isles v2" })).toBe("Echo Isles v2");
    expect(mapGroupKey({ map: ECHO_ISLES_FILES[1], mapName: "|cff00ff00Echo Isles v2|r" })).toBe("Echo Isles v2");
  });

  it("falls back to the file name when there is no name", () => {
    expect(mapGroupKey({ map: "w3c_250622_1057_ShallowGrave_v1.5.w3x" })).toBe("w3c_250622_1057_ShallowGrave_v1.5.w3x");
    expect(mapGroupKey({ map: "LegionTD", mapName: null })).toBe("LegionTD");
    expect(mapGroupKey({ map: "LegionTD", mapName: "" })).toBe("LegionTD");
  });

  it("returns the all-maps key whatever name the entry carries", () => {
    expect(mapGroupKey({ map: OVERALL_MAP })).toBe(OVERALL_MAP);
    expect(mapGroupKey({ map: OVERALL_MAP, mapName: null })).toBe(OVERALL_MAP);
    expect(mapGroupKey({ map: OVERALL_MAP, mapName: "Something else" })).toBe(OVERALL_MAP);
  });

  it("recognises an all-maps entry that has its key only in the name", () => {
    expect(mapGroupKey({ map: null, mapName: OVERALL_MAP })).toBe(OVERALL_MAP);
    expect(mapGroupKey({ mapName: OVERALL_MAP })).toBe(OVERALL_MAP);
  });

  it("does not normalise case or punctuation", () => {
    expect(mapGroupKey({ map: "a.w3x", mapName: "Echo isles" })).not.toBe(mapGroupKey({ map: "b.w3x", mapName: "Echo Isles" }));
    expect(mapGroupKey({ map: "a.w3x", mapName: "Bandits Retreat" })).not.toBe(mapGroupKey({ map: "b.w3x", mapName: "Bandit's Retreat" }));
  });
});

describe("compareMapGroupKeys", () => {
  it("puts the all-maps key first, then sorts by name", () => {
    expect(["Twisted Meadows", OVERALL_MAP, "Echo Isles v2"].sort(compareMapGroupKeys))
      .toEqual([OVERALL_MAP, "Echo Isles v2", "Twisted Meadows"]);
  });
});

describe("mergeRaceStats", () => {
  it("sums per race, recomputes the winrate and keeps the other fields", () => {
    const merged = mergeRaceStats([
      [raceStat(ERaceEnum.HUMAN, 3, 1), raceStat(ERaceEnum.ORC, 0, 2)],
      [raceStat(ERaceEnum.HUMAN, 1, 3)],
    ]);

    expect(merged).toEqual([
      { race: ERaceEnum.HUMAN, gateWay: Gateways.Europe, season: 25, wins: 4, losses: 4, games: 8, winrate: 0.5 },
      { race: ERaceEnum.ORC, gateWay: Gateways.Europe, season: 25, wins: 0, losses: 2, games: 2, winrate: 0 },
    ]);
  });

  it("does not change its input", () => {
    const first = [raceStat(ERaceEnum.HUMAN, 3, 1)];
    mergeRaceStats([first, [raceStat(ERaceEnum.HUMAN, 1, 1)]]);
    expect(first[0].wins).toBe(3);
  });

  it("gives a winrate of 0 without games", () => {
    expect(mergeRaceStats([[raceStat(ERaceEnum.UNDEAD, 0, 0)]])[0].winrate).toBe(0);
  });
});

describe("groupMapCounts", () => {
  it("shows the files of one map as one entry with the sum", () => {
    const maps: MapCount[] = [
      { map: ECHO_ISLES_FILES[0], mapId: 1051, mapName: "Echo Isles v2", count: 27148 },
      { map: "w3c_250622_1057_TwistedMeadows_v1.9.w3x", mapId: 6, mapName: "Twisted Meadows", count: 500 },
      { map: ECHO_ISLES_FILES[1], mapId: 1051, mapName: "Echo Isles v2", count: 950 },
      { map: ECHO_ISLES_FILES[2], mapId: 1051, mapName: "Echo Isles v2", count: 8351 },
    ];

    expect(groupMapCounts(maps)).toEqual([
      { map: "Echo Isles v2", mapName: "Echo Isles v2", count: 36449 },
      { map: "Twisted Meadows", mapName: "Twisted Meadows", count: 500 },
    ]);
  });

  it("merges different ids that share a name, and keeps unnamed files apart", () => {
    const maps: MapCount[] = [
      { map: "a.w3x", mapId: 1, mapName: "Castle Fight", count: 2 },
      { map: "b.w3x", mapId: 2, mapName: "Castle Fight", count: 3 },
      { map: "x.w3x", count: 4 },
    ];

    expect(groupMapCounts(maps)).toEqual([
      { map: "Castle Fight", mapName: "Castle Fight", count: 5 },
      { map: "x.w3x", mapName: "x.w3x", count: 4 },
    ]);
  });
});

describe("groupWinLossesOnMap", () => {
  it("merges the files of one map by race and puts the all-maps entry first", () => {
    const grouped = groupWinLossesOnMap([
      onMap(ECHO_ISLES_FILES[0], "Echo Isles v2", [raceStat(ERaceEnum.HUMAN, 2, 1)]),
      onMap("LegionTD", undefined, [raceStat(ERaceEnum.ORC, 1, 0)]),
      onMap(OVERALL_MAP, undefined, [raceStat(ERaceEnum.HUMAN, 5, 5)]),
      onMap(ECHO_ISLES_FILES[1], "Echo Isles v2", [raceStat(ERaceEnum.HUMAN, 1, 1), raceStat(ERaceEnum.UNDEAD, 0, 1)]),
    ]);

    expect(grouped.map((entry) => entry.map)).toEqual([OVERALL_MAP, "Echo Isles v2", "LegionTD"]);
    expect(grouped[1].winLosses.map((stat) => [stat.race, stat.wins, stat.losses, stat.games]))
      .toEqual([[ERaceEnum.HUMAN, 3, 2, 5], [ERaceEnum.UNDEAD, 0, 1, 1]]);
  });
});

describe("winLossesForMapGroup", () => {
  const list = [
    onMap("LegionTD", undefined, [raceStat(ERaceEnum.ORC, 1, 0)]),
    onMap(OVERALL_MAP, null, [raceStat(ERaceEnum.HUMAN, 5, 5)]),
    onMap(ECHO_ISLES_FILES[0], "Echo Isles v2", [raceStat(ERaceEnum.HUMAN, 2, 1)]),
    onMap(ECHO_ISLES_FILES[2], "Echo Isles v2", [raceStat(ERaceEnum.HUMAN, 1, 0)]),
  ];

  it("finds the all-maps entry by its key, also when it is not first", () => {
    expect(winLossesForMapGroup(list, OVERALL_MAP)?.[0].wins).toBe(5);
  });

  it("merges every file of the map", () => {
    const merged = winLossesForMapGroup(list, "Echo Isles v2");
    expect(merged).toHaveLength(1);
    expect(merged?.[0]).toMatchObject({ wins: 3, losses: 1, games: 4, winrate: 0.75 });
  });

  it("is undefined for a map that is not in the list", () => {
    expect(winLossesForMapGroup(list, "Twisted Meadows")).toBeUndefined();
  });
});

describe("mapGroupKeys and mapGroupInfos", () => {
  const entries = [
    { map: ECHO_ISLES_FILES[0], mapName: "Echo Isles v2" },
    { map: OVERALL_MAP },
    { map: ECHO_ISLES_FILES[1], mapName: "Echo Isles v2" },
    { map: "w3c_250622_1057_TwistedMeadows_v1.9.w3x", mapName: "Twisted Meadows" },
    { map: "", mapName: "" },
  ];

  it("lists each name once, all-maps first, without empty keys", () => {
    expect(mapGroupKeys(entries)).toEqual([OVERALL_MAP, "Echo Isles v2", "Twisted Meadows"]);
  });

  it("labels each name once and keeps the stored name as the value", () => {
    expect(mapGroupInfos(entries.slice(2))).toEqual([
      { map: "Echo Isles v2", mapName: "Echo Isles v2" },
      { map: "Twisted Meadows", mapName: "Twisted Meadows" },
    ]);
  });

  it("keeps colour codes in the value, which the backend compares, and strips them from the label", () => {
    expect(mapGroupInfos([
      { map: "Legion_TD_10.1a.w3x", mapName: "Legion TD 10.1a W3C |cffFFcc00TeamOZE|r" },
      { map: "x.w3x" },
    ])).toEqual([
      { map: "Legion TD 10.1a W3C |cffFFcc00TeamOZE|r", mapName: "Legion TD 10.1a W3C TeamOZE" },
      { map: "x.w3x", mapName: "x.w3x" },
    ]);
  });
});

describe("mapSelectOptions", () => {
  it("sends the stored name and shows it without colour codes, sorted by label", () => {
    expect(mapSelectOptions([
      { map: "|cffff0000Uther Party|r Reforged 1.4", mapName: "|cffff0000Uther Party|r Reforged 1.4" },
      { map: "Echo Isles v2", mapName: "Echo Isles v2" },
    ])).toEqual([
      { label: "Echo Isles v2", value: "Echo Isles v2" },
      { label: "Uther Party Reforged 1.4", value: "|cffff0000Uther Party|r Reforged 1.4" },
    ]);
  });

  it("lists a label once, leaves out the all-maps entry and empty names", () => {
    expect(mapSelectOptions([
      { map: OVERALL_MAP, mapName: OVERALL_MAP },
      { map: "Castle Fight", mapName: "Castle Fight" },
      { map: "Castle Fight", mapName: "Castle Fight" },
      { map: "", mapName: "" },
    ])).toEqual([{ label: "Castle Fight", value: "Castle Fight" }]);
  });
});

describe("hasMapGroup", () => {
  const list = [onMap(ECHO_ISLES_FILES[0], "Echo Isles v2", []), onMap(OVERALL_MAP, null, [])];

  it("finds a group by its key", () => {
    expect(hasMapGroup(list, "Echo Isles v2")).toBe(true);
    expect(hasMapGroup(list, OVERALL_MAP)).toBe(true);
    expect(hasMapGroup(list, "Twisted Meadows")).toBe(false);
  });
});

describe("entries without map or name", () => {
  it("are left out of the grouped counts and win/loss rows", () => {
    expect(groupMapCounts([{ map: "", mapName: null, count: 3 }, { map: "a.w3x", mapName: "A", count: 1 }]))
      .toEqual([{ map: "A", mapName: "A", count: 1 }]);
    expect(groupWinLossesOnMap([onMap("", null, [raceStat(ERaceEnum.ORC, 1, 0)])])).toEqual([]);
  });
});

describe("withoutRareMaps", () => {
  function counts(entries: [string, number][]): MapCount[] {
    return entries.map(([map, count]) => ({ map, mapName: map, count }));
  }

  it("hides a map under the threshold and keeps one exactly at it", () => {
    const groups = counts([
      ["A", 998],
      ["B", 1],
      ["C", 1],
    ]);
    expect(withoutRareMaps(groups, 0.001).map((entry) => entry.map)).toEqual(["A", "B", "C"]);
    expect(withoutRareMaps(groups, 0.002).map((entry) => entry.map)).toEqual(["A"]);
  });

  it("uses 0.1% by default", () => {
    expect(RARE_MAP_SHARE).toBe(0.001);
    const groups = counts([
      ["A", 9_981],
      ["B", 10],
      ["C", 9],
    ]);
    expect(withoutRareMaps(groups).map((entry) => entry.map)).toEqual(["A", "B"]);
  });

  it("hides the few games played while a map pool was switched", () => {
    const groups = counts([
      ["Echo Isles v2", 38_084],
      ["Gloom Stalker", 1],
      ["Last Refuge", 46_106],
      ["Shattered Exile v2", 3],
      ["Terenas Stand LV", 8],
      ["Turtle Rock", 22_923],
    ]);
    expect(withoutRareMaps(groups).map((entry) => entry.map)).toEqual(["Echo Isles v2", "Last Refuge", "Turtle Rock"]);
  });

  it("keeps the order and the counts", () => {
    const groups = counts([
      ["Z", 500],
      ["A", 500],
    ]);
    expect(withoutRareMaps(groups)).toEqual(groups);
  });

  it("always keeps the all-maps entry", () => {
    const groups = counts([
      [OVERALL_MAP, 0],
      ["A", 1_000],
    ]);
    expect(withoutRareMaps(groups).map((entry) => entry.map)).toEqual([OVERALL_MAP, "A"]);
  });

  it("returns empty or count-less lists as they are", () => {
    expect(withoutRareMaps([])).toEqual([]);
    const zeros = counts([
      ["A", 0],
      ["B", 0],
    ]);
    expect(withoutRareMaps(zeros)).toEqual(zeros);
  });
});
