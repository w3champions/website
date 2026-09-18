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
});
