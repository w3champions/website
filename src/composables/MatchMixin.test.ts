import { describe, expect, it } from "vitest";
import { mapNameFromMatch } from "./MatchMixin";
import { Match } from "@/store/types";

/** Only `mapName`/`map` are read on the path under test. */
function matchWith(mapName: string): Match {
  return { mapName, map: "unused" } as Match;
}

describe("mapNameFromMatch", () => {
  it("returns a clean curated name unchanged", () => {
    expect(mapNameFromMatch(matchWith("Twisted Meadows"))).toBe("Twisted Meadows");
  });

  it("strips Warcraft colour codes rather than printing them raw", () => {
    // Curated ladder names are clean today, but `mapName` is ultimately seeded from
    // map-file metadata, so a code reaching the grid is a matter of one bad import.
    expect(mapNameFromMatch(matchWith("|cff00ff00Echo Isles|r"))).toBe("Echo Isles");
  });

  it("resolves |n and || escapes on the way through", () => {
    expect(mapNameFromMatch(matchWith("A || B"))).toBe("A | B");
  });

  it("falls back to the map file name when there is no name", () => {
    const match = { mapName: "", map: "w3c_250622_1057_ShallowGrave_v1.5.w3x" } as Match;
    expect(mapNameFromMatch(match)).toBe("w3c_250622_1057_ShallowGrave_v1.5.w3x");
  });
});
