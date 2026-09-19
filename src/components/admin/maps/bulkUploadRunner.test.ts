import { describe, expect, it, vi } from "vitest";
import { BulkSelectItem, BulkUploadItem, reconcileFailedUpload, selectMapFiles, uploadMapFiles } from "./bulkUploadRunner";
import type { GameMap, Map, MapFileData } from "@/store/admin/mapsManagement/types";
import { timeoutError } from "@/services/http/fetchWithTimeout";

const SHA_A = "d3486ae9136e7856bc42212385ea797094475802";
const SHA_B = "0a0a9f2a6772942557ab5355d76af442f8f65e01";

function mapFile(filePath: string, sha1 = SHA_A): MapFileData {
  return {
    id: filePath,
    mapId: 5110,
    filePath,
    metaData: { sha1, name: "Twisted Meadows" } as unknown as GameMap,
  };
}

function uploadItem(overrides: Partial<BulkUploadItem> & Pick<BulkUploadItem, "key">): BulkUploadItem {
  return {
    mapId: 5110,
    fileName: "5110_twisted_meadows.w3x",
    storeAs: "5110_twisted_meadows.w3x",
    sha1: SHA_A,
    file: new Blob(["map bytes"]),
    ...overrides,
  };
}

function adminMap(id: number, path?: string, sha1?: string): Map {
  return {
    id,
    name: `Map ${id}`,
    maxTeams: 2,
    disabled: false,
    gameMap: path === undefined ? undefined : ({ path, sha1 } as unknown as GameMap),
  };
}

describe("uploadMapFiles", () => {
  it("uploads each file once and reports the record the server stored", async () => {
    const stored = mapFile("W3Champions/5110_twisted_meadows.w3x");
    const uploadFile = vi.fn().mockResolvedValue(stored);

    const results = await uploadMapFiles([uploadItem({ key: "a" })], {
      uploadFile,
      fetchMapFiles: vi.fn(),
    });

    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(results).toEqual([{ key: "a", ok: true, reused: false, mapFile: stored }]);
  });

  it("does not upload a file the plan decided to reuse", async () => {
    const stored = mapFile("W3Champions/5110_twisted_meadows.w3x");
    const uploadFile = vi.fn();

    const results = await uploadMapFiles([uploadItem({ key: "a", reuseMapFile: stored })], {
      uploadFile,
      fetchMapFiles: vi.fn(),
    });

    expect(uploadFile).not.toHaveBeenCalled();
    expect(results[0]).toMatchObject({ key: "a", ok: true, reused: true, mapFile: stored });
  });

  it("re-reads the map's files when the upload itself returns no record", async () => {
    const stored = mapFile("W3Champions/5110_twisted_meadows.w3x");
    const fetchMapFiles = vi.fn().mockResolvedValue([mapFile("W3Champions/other.w3x"), stored]);

    const results = await uploadMapFiles([uploadItem({ key: "a" })], {
      uploadFile: vi.fn().mockResolvedValue(null),
      fetchMapFiles,
    });

    expect(fetchMapFiles).toHaveBeenCalledWith(5110);
    expect(results[0]).toMatchObject({ ok: true, mapFile: stored });
  });

  it("fails the row when the uploaded file cannot be found afterwards", async () => {
    const results = await uploadMapFiles([uploadItem({ key: "a" })], {
      uploadFile: vi.fn().mockResolvedValue(null),
      fetchMapFiles: vi.fn().mockResolvedValue([]),
    });

    expect(results[0].ok).toBe(false);
    expect(results[0].message).toContain("5110_twisted_meadows.w3x");
  });

  it("fails the row when the stored record is a namesake rather than this file", async () => {
    const results = await uploadMapFiles([uploadItem({ key: "a" })], {
      uploadFile: vi.fn().mockResolvedValue(mapFile("W3Champions/5110_twisted_meadows.w3x", SHA_B)),
      fetchMapFiles: vi.fn(),
    });

    expect(results[0].ok).toBe(false);
    expect(results[0].message).toContain(SHA_B);
  });

  it("fails the row when the stored record carries no checksum at all", async () => {
    const results = await uploadMapFiles([uploadItem({ key: "a" })], {
      uploadFile: vi.fn().mockResolvedValue(mapFile("W3Champions/5110_twisted_meadows.w3x", "")),
      fetchMapFiles: vi.fn(),
    });

    expect(results[0].ok).toBe(false);
    expect(results[0].message).toContain("missing");
  });

  it("fails only the row that threw and keeps uploading the rest", async () => {
    const stored = mapFile("W3Champions/5111_turtle_rock.w3x");
    const uploadFile = vi.fn()
      .mockRejectedValueOnce(new Error("File already exists: `/uploads/maps/W3Champions/a.w3x`"))
      .mockResolvedValueOnce(stored);

    const results = await uploadMapFiles(
      [uploadItem({ key: "a" }), uploadItem({ key: "b", mapId: 5111, storeAs: "5111_turtle_rock.w3x" })],
      { uploadFile, fetchMapFiles: vi.fn() },
    );

    expect(results[0]).toMatchObject({ key: "a", ok: false });
    expect(results[0].message).toContain("File already exists");
    expect(results[1]).toMatchObject({ key: "b", ok: true, mapFile: stored });
  });

  it("reports a timed-out upload on its row, verbatim, and carries on with the batch", async () => {
    // What the runner owes a timeout is the same as any other failure: fail that
    // row, keep the reason intact - a timed-out POST may still have been stored,
    // and only the message says so - and keep going. Built by the real producer
    // rather than retyped, so a reworded message cannot pass a stale assertion.
    const timeout = timeoutError({
      timeoutMs: 300_000,
      describe: "Uploading the map file",
      uncertainOutcome: "It is not known whether the file was stored; the map's file list shows whether it was.",
    });
    const stored = mapFile("W3Champions/5111_turtle_rock.w3x");
    const uploadFile = vi.fn()
      .mockRejectedValueOnce(timeout)
      .mockResolvedValueOnce(stored);

    const results = await uploadMapFiles(
      [uploadItem({ key: "a" }), uploadItem({ key: "b", mapId: 5111, storeAs: "5111_turtle_rock.w3x" })],
      { uploadFile, fetchMapFiles: vi.fn() },
    );

    expect(results[0]).toMatchObject({ key: "a", ok: false, message: timeout.message });
    expect(results[1]).toMatchObject({ key: "b", ok: true, mapFile: stored });
  });

  it("keeps a separate result for two files that share a name", async () => {
    const uploadFile = vi.fn()
      .mockResolvedValueOnce(mapFile("W3Champions/5110_twisted_meadows.w3x"))
      .mockRejectedValueOnce(new Error("boom"));

    const results = await uploadMapFiles(
      [uploadItem({ key: "1v1" }), uploadItem({ key: "2v2" })],
      { uploadFile, fetchMapFiles: vi.fn() },
    );

    expect(results.map((result) => [result.key, result.ok])).toEqual([["1v1", true], ["2v2", false]]);
  });

  it("reports progress against the row that is uploading", async () => {
    const onProgress = vi.fn();

    await uploadMapFiles(
      [uploadItem({ key: "a" })],
      {
        uploadFile: (_item, report) => {
          report(42);
          return Promise.resolve(mapFile("W3Champions/5110_twisted_meadows.w3x"));
        },
        fetchMapFiles: vi.fn(),
      },
      { onProgress },
    );

    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ key: "a" }), 42);
  });
});

function selectItem(key: string, map: Map, file: MapFileData): BulkSelectItem {
  return { key, mapId: map.id, mapFile: file };
}

// The update replaces the whole map document, so the maps are read once before
// writing and once afterwards to verify. Most tests only care about the second.
function reloads(...answers: Map[][]) {
  const reload = vi.fn();
  for (const answer of answers) reload.mockResolvedValueOnce(answer);
  reload.mockResolvedValue(answers[answers.length - 1] ?? []);
  return reload;
}

describe("selectMapFiles", () => {
  it("points the map at the uploaded file and verifies that it stuck", async () => {
    const updateMap = vi.fn().mockResolvedValue(undefined);
    const file = mapFile("W3Champions/5110_twisted_meadows.w3x");

    const results = await selectMapFiles([selectItem("a", adminMap(5110), file)], {
      updateMap,
      reloadMaps: reloads(
        [adminMap(5110)],
        [adminMap(5110, "maps\\W3Champions\\5110_twisted_meadows.w3x", SHA_A)],
      ),
    });

    expect(updateMap).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 5110,
        gameMap: expect.objectContaining({ path: "maps\\W3Champions\\5110_twisted_meadows.w3x", sha1: SHA_A }),
      }),
    );
    expect(results[0]).toMatchObject({ key: "a", ok: true });
  });

  it("sends every field of the map back, including ones this app does not know", async () => {
    // The matchmaking service replaces the whole map document with the request
    // body, so a field the update leaves out is erased from the map. Anything
    // the backend sends has to come back untouched, whether or not the Map type
    // has heard of it.
    const updateMap = vi.fn().mockResolvedValue(undefined);
    const current = {
      ...adminMap(5110),
      category: "Ladder",
      mappedForces: [{ team: 0, slots: [{ index: 0 }] }],
      somethingTheBackendAdded: 7,
    } as Map & { somethingTheBackendAdded: number };
    const file = mapFile("W3Champions/5110_twisted_meadows.w3x");
    // Metadata fields the app does not model either - the whole gameMap
    // subdocument is replaced by what is sent here.
    (file.metaData as unknown as Record<string, unknown>).forces = [
      { name: "Force 1", flags: 0, playerSet: 4294967295 },
    ];

    await selectMapFiles([selectItem("a", current, file)], {
      updateMap,
      reloadMaps: reloads([current], [adminMap(5110, "maps\\W3Champions\\5110_twisted_meadows.w3x", SHA_A)]),
    });

    expect(updateMap).toHaveBeenCalledWith({
      ...current,
      gameMap: {
        ...file.metaData,
        path: "maps\\W3Champions\\5110_twisted_meadows.w3x",
      },
    });
  });

  it("leaves the stored file record untouched while building the update", async () => {
    // The metadata object belongs to the store's file list; writing the game path
    // into it would quietly edit that list.
    const file = mapFile("W3Champions/5110_twisted_meadows.w3x");

    await selectMapFiles([selectItem("a", adminMap(5110), file)], {
      updateMap: vi.fn().mockResolvedValue(undefined),
      reloadMaps: vi.fn().mockResolvedValue([adminMap(5110, "maps\\W3Champions\\5110_twisted_meadows.w3x", SHA_A)]),
    });

    expect(file.metaData.path).toBeUndefined();
  });

  it("builds the update from the map as it is now, not as it was when the file was picked", async () => {
    // The update replaces the whole document, so a stale snapshot would revert
    // whatever another admin changed while the batch was running.
    const updateMap = vi.fn().mockResolvedValue(undefined);
    const stale = { ...adminMap(5110), name: "Old name", disabled: false, category: "old" };
    const fresh = { ...adminMap(5110), name: "New name", disabled: true, category: "melee" };

    await selectMapFiles([{ key: "a", mapId: 5110, mapFile: mapFile("W3Champions/a.w3x") }], {
      updateMap,
      reloadMaps: reloads([fresh], [adminMap(5110, "maps\\W3Champions\\a.w3x", SHA_A)]),
    });

    expect(stale.name).toBe("Old name"); // the snapshot is never consulted
    expect(updateMap).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5110, name: "New name", disabled: true, category: "melee" }),
    );
  });

  it("fails the row when the map is gone by the time the update is written", async () => {
    const updateMap = vi.fn();

    const results = await selectMapFiles([selectItem("a", adminMap(5110), mapFile("W3Champions/a.w3x"))], {
      updateMap,
      reloadMaps: reloads([adminMap(5111)]),
    });

    expect(updateMap).not.toHaveBeenCalled();
    expect(results[0].ok).toBe(false);
    expect(results[0].message).toContain("no longer");
  });

  it("writes nothing when the maps cannot be read before the update", async () => {
    const updateMap = vi.fn();

    const results = await selectMapFiles([selectItem("a", adminMap(5110), mapFile("W3Champions/a.w3x"))], {
      updateMap,
      reloadMaps: vi.fn().mockRejectedValue(new Error("Request failed with status 503.")),
    });

    expect(updateMap).not.toHaveBeenCalled();
    expect(results[0].ok).toBe(false);
    expect(results[0].message).toContain("503");
  });

  it("reports a failed map update as an error for that row", async () => {
    const results = await selectMapFiles([selectItem("a", adminMap(5110), mapFile("W3Champions/a.w3x"))], {
      updateMap: vi.fn().mockRejectedValue(new Error("Request failed with status 500.")),
      reloadMaps: reloads([adminMap(5110)]),
    });

    expect(results[0].ok).toBe(false);
    expect(results[0].message).toContain("500");
  });

  it("turns a map that did not actually change into an error", async () => {
    // The PUT answers 200 and the map keeps its old file - the failure that was
    // invisible before the maps were read back.
    const results = await selectMapFiles([selectItem("a", adminMap(5110), mapFile("W3Champions/5110_new.w3x"))], {
      updateMap: vi.fn().mockResolvedValue(undefined),
      reloadMaps: reloads([adminMap(5110)], [adminMap(5110, "maps\\W3Champions\\5110_old.w3x")]),
    });

    expect(results[0].ok).toBe(false);
    expect(results[0].message).toContain("5110_old.w3x");
  });

  it("turns a checksum that does not match into an error", async () => {
    const results = await selectMapFiles([selectItem("a", adminMap(5110), mapFile("W3Champions/5110_new.w3x", SHA_A))], {
      updateMap: vi.fn().mockResolvedValue(undefined),
      reloadMaps: reloads([adminMap(5110)], [adminMap(5110, "maps\\W3Champions\\5110_new.w3x", SHA_B)]),
    });

    expect(results[0].ok).toBe(false);
    expect(results[0].message).toContain("checksum");
  });

  it("fails the rows it could not verify when the maps cannot be re-read", async () => {
    const reloadMaps = vi.fn()
      .mockResolvedValueOnce([adminMap(5110)])
      .mockRejectedValue(new Error("Request failed with status 502."));

    const results = await selectMapFiles([selectItem("a", adminMap(5110), mapFile("W3Champions/a.w3x"))], {
      updateMap: vi.fn().mockResolvedValue(undefined),
      reloadMaps,
    });

    expect(results[0].ok).toBe(false);
    expect(results[0].message).toContain("502");
  });

  it("keeps the rows apart when two maps were updated and only one took", async () => {
    const results = await selectMapFiles(
      [
        selectItem("a", adminMap(5110), mapFile("W3Champions/5110_new.w3x")),
        selectItem("b", adminMap(5111), mapFile("W3Champions/5111_new.w3x")),
      ],
      {
        updateMap: vi.fn().mockResolvedValue(undefined),
        reloadMaps: vi.fn().mockResolvedValue([
          adminMap(5110, "maps\\W3Champions\\5110_new.w3x", SHA_A),
          adminMap(5111, "maps\\W3Champions\\5111_old.w3x", SHA_A),
        ]),
      },
    );

    expect(results.map((result) => [result.key, result.ok])).toEqual([["a", true], ["b", false]]);
  });

  it("reports the earlier of two files for one map as superseded, not as a failure", async () => {
    // Two different files for one map is documented as "the last one wins", so the
    // first row must not be turned into an error by the verification pass.
    const results = await selectMapFiles(
      [
        selectItem("a", adminMap(5110), mapFile("W3Champions/5110_a.w3x")),
        selectItem("b", adminMap(5110), mapFile("W3Champions/5110_b.w3x")),
      ],
      {
        updateMap: vi.fn().mockResolvedValue(undefined),
        reloadMaps: vi.fn().mockResolvedValue([adminMap(5110, "maps\\W3Champions\\5110_b.w3x", SHA_A)]),
      },
    );

    expect(results.map((result) => result.ok)).toEqual([true, true]);
    expect(results[0].message).toContain("afterwards");
  });

  it("checks the earlier file on its own merits when the later one did not land", async () => {
    const results = await selectMapFiles(
      [
        selectItem("a", adminMap(5110), mapFile("W3Champions/5110_a.w3x")),
        selectItem("b", adminMap(5110), mapFile("W3Champions/5110_b.w3x")),
      ],
      {
        updateMap: vi.fn().mockResolvedValue(undefined),
        // Neither update took: the map still holds the file it had before.
        reloadMaps: vi.fn().mockResolvedValue([adminMap(5110, "maps\\W3Champions\\5110_old.w3x", SHA_A)]),
      },
    );

    expect(results.map((result) => result.ok)).toEqual([false, false]);
    expect(results[0].message).toContain("5110_old.w3x");
  });

  it("does not read the maps back when every update failed", async () => {
    // One read to build the updates, none to verify them: there is nothing to verify.
    const reloadMaps = reloads([adminMap(5110)]);

    await selectMapFiles([selectItem("a", adminMap(5110), mapFile("W3Champions/a.w3x"))], {
      updateMap: vi.fn().mockRejectedValue(new Error("nope")),
      reloadMaps,
    });

    expect(reloadMaps).toHaveBeenCalledTimes(1);
  });
});

describe("reconcileFailedUpload", () => {
  const item = { storeAs: "5110_twisted_meadows.w3x", sha1: SHA_A };

  it("confirms the upload when the stored file matches by name and checksum", () => {
    // The POST timed out but was applied. The row has to carry the record, or
    // neither "Upload" nor "Select uploaded" can act on it.
    const stored = mapFile("W3Champions/5110_twisted_meadows.w3x", SHA_A);

    const reconciliation = reconcileFailedUpload(item, [stored]);

    expect(reconciliation.outcome).toBe("confirmed");
    expect(reconciliation.mapFile).toBe(stored);
    expect(reconciliation.message).toContain("confirmed");
  });

  it("matches the stored file regardless of its folder and letter case", () => {
    const stored = mapFile("W3Champions/5110_Twisted_Meadows.w3x", SHA_A.toUpperCase());

    expect(reconcileFailedUpload(item, [stored]).outcome).toBe("confirmed");
  });

  it("keeps a namesake with different content a failure rather than claiming it", () => {
    // Another admin stored that name while the batch ran, so the upload was
    // refused; selecting their file would point the map at the wrong bytes.
    const reconciliation = reconcileFailedUpload(item, [mapFile("W3Champions/5110_twisted_meadows.w3x", SHA_B)]);

    expect(reconciliation.outcome).toBe("blocked");
    expect(reconciliation.mapFile).toBeUndefined();
    expect(reconciliation.message).toContain("rename this one");
  });

  it("keeps a namesake with no checksum a failure, because it cannot be told apart", () => {
    const stored = mapFile("W3Champions/5110_twisted_meadows.w3x");
    stored.metaData = { name: "Twisted Meadows" } as unknown as GameMap;

    const reconciliation = reconcileFailedUpload(item, [stored]);

    expect(reconciliation.outcome).toBe("blocked");
    expect(reconciliation.message).toContain("no checksum");
  });

  it("asks for a retry when nothing of that name is stored", () => {
    const reconciliation = reconcileFailedUpload(item, [mapFile("W3Champions/5111_turtle_rock.w3x", SHA_B)]);

    expect(reconciliation.outcome).toBe("retry");
    expect(reconciliation.message).toContain("can be sent again");
  });

  it("asks for a retry when the map has no stored files at all", () => {
    expect(reconcileFailedUpload(item, []).outcome).toBe("retry");
  });

  it("claims nothing when the stored files could not be re-read", () => {
    // Null is "we could not find out", which is not the same as "nothing is
    // there" - sending the file again could collide with what is.
    const reconciliation = reconcileFailedUpload(item, null);

    expect(reconciliation.outcome).toBe("blocked");
    expect(reconciliation.message).toContain("could not be re-read");
  });
});
