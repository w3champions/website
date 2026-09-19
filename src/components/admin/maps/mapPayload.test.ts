import { describe, expect, it } from "vitest";
import { cloneMapForEdit, withSelectedMapFile } from "./mapPayload";
import type { GameMap, Map, MapFileData } from "@/store/admin/mapsManagement/types";

const SHA = "d3486ae9136e7856bc42212385ea797094475802";

function adminMap(overrides: Partial<Map> = {}): Map {
  return {
    id: 5110,
    name: "Twisted Meadows",
    category: "Ladder",
    maxTeams: 2,
    disabled: false,
    mappedForces: [{ team: 0, slots: [{ index: 0 }] }],
    gameMap: { sha1: SHA, path: "maps\\W3Champions\\old.w3x" } as unknown as GameMap,
    ...overrides,
  };
}

function storedFile(filePath: string, metaData: Partial<GameMap> = {}): MapFileData {
  return {
    id: filePath,
    mapId: 5110,
    filePath,
    metaData: { sha1: SHA, name: "Twisted Meadows", ...metaData } as unknown as GameMap,
  };
}

describe("cloneMapForEdit", () => {
  it("detaches the nested objects, so editing the copy leaves the store's row alone", () => {
    const stored = adminMap();

    const copy = cloneMapForEdit(stored);
    copy.mappedForces![0].team = 1;
    copy.gameMap!.path = "maps\\W3Champions\\new.w3x";

    expect(stored.mappedForces![0].team).toBe(0);
    expect(stored.gameMap!.path).toBe("maps\\W3Champions\\old.w3x");
  });

  it("keeps fields this app's types do not know about", () => {
    // The update replaces the whole document, so anything dropped on the way
    // into the editor is erased from the map when it is saved.
    const stored = { ...adminMap(), somethingTheBackendAdded: 7 } as Map & { somethingTheBackendAdded: number };

    const copy = cloneMapForEdit(stored) as typeof stored;

    expect(copy.somethingTheBackendAdded).toBe(7);
  });
});

describe("withSelectedMapFile", () => {
  it("points the map at the stored file's game path", () => {
    const result = withSelectedMapFile(adminMap(), storedFile("W3Champions/5110_twisted_meadows.w3x"));

    expect(result.gameMap?.path).toBe("maps\\W3Champions\\5110_twisted_meadows.w3x");
    expect(result.gameMap?.sha1).toBe(SHA);
  });

  it("carries the rest of the map over untouched, including fields it does not know", () => {
    const stored = { ...adminMap(), somethingTheBackendAdded: 7 } as Map & { somethingTheBackendAdded: number };

    const result = withSelectedMapFile(stored, storedFile("W3Champions/a.w3x")) as typeof stored;

    expect(result).toMatchObject({
      id: 5110,
      name: "Twisted Meadows",
      category: "Ladder",
      maxTeams: 2,
      disabled: false,
      somethingTheBackendAdded: 7,
    });
    expect(result.mappedForces).toEqual(stored.mappedForces);
  });

  it("carries metadata fields it does not know over into the update too", () => {
    const file = storedFile("W3Champions/a.w3x", { forces: [{ name: "Force 1", flags: 0, playerSet: 4294967295 }] });

    const result = withSelectedMapFile(adminMap(), file);

    expect(result.gameMap?.forces).toEqual([{ name: "Force 1", flags: 0, playerSet: 4294967295 }]);
  });

  it("leaves the stored file record alone", () => {
    // The metadata object belongs to the store's file list; writing the game
    // path into it would quietly edit that list.
    const file = storedFile("W3Champions/a.w3x");

    withSelectedMapFile(adminMap(), file);

    expect(file.metaData.path).toBeUndefined();
  });

  it("does not edit the map it was given", () => {
    const stored = adminMap();

    withSelectedMapFile(stored, storedFile("W3Champions/a.w3x"));

    expect(stored.gameMap?.path).toBe("maps\\W3Champions\\old.w3x");
  });
});
