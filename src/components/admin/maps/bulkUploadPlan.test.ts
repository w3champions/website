import { describe, expect, it } from "vitest";
import { BulkPlanCandidate, planBulkUpload, reconcileMapUpdate } from "./bulkUploadPlan";
import type { GameMap, Map, MapFileData } from "@/store/admin/mapsManagement/types";

const SHA_A = "d3486ae9136e7856bc42212385ea797094475802";
const SHA_B = "0a0a9f2a6772942557ab5355d76af442f8f65e01";

function candidate(overrides: Partial<BulkPlanCandidate> & Pick<BulkPlanCandidate, "key">): BulkPlanCandidate {
  return {
    fileName: "5110_twisted_meadows.w3x",
    storeAs: "5110_twisted_meadows.w3x",
    mapId: 5110,
    mapExists: true,
    sha1: SHA_A,
    ...overrides,
  };
}

function storedFile(filePath: string, sha1?: string | null): MapFileData {
  return {
    id: filePath,
    mapId: 5110,
    filePath,
    metaData: { sha1, name: "Twisted Meadows" } as unknown as GameMap,
  };
}

describe("planBulkUpload", () => {
  it("uploads a file the map does not have yet", () => {
    const plan = planBulkUpload([candidate({ key: "a" })], { 5110: [] });

    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ key: "a", action: "upload" });
  });

  it("uploads one of two byte-identical selections and skips the other as a duplicate", () => {
    // The build tool writes the same map into 1v1/ and 2v2/, so picking every
    // folder hands the same bytes in twice under one name.
    const plan = planBulkUpload(
      [candidate({ key: "1v1" }), candidate({ key: "2v2" })],
      { 5110: [] },
    );

    expect(plan[0]).toMatchObject({ key: "1v1", action: "upload" });
    expect(plan[1]).toMatchObject({ key: "2v2", action: "duplicate", duplicateOf: "1v1" });
    expect(plan[1].message).toContain("5110_twisted_meadows.w3x");
  });

  it("keeps one entry per selected file even when both files have the same name", () => {
    const plan = planBulkUpload(
      [candidate({ key: "1v1" }), candidate({ key: "2v2" })],
      { 5110: [] },
    );

    expect(plan.map((entry) => entry.key)).toEqual(["1v1", "2v2"]);
  });

  it("rejects both files when two selections share a name but differ in content", () => {
    const plan = planBulkUpload(
      [candidate({ key: "old" }), candidate({ key: "new", sha1: SHA_B })],
      { 5110: [] },
    );

    expect(plan.map((entry) => entry.action)).toEqual(["error", "error"]);
    expect(plan[0].message).toContain("differ");
    expect(plan[1].message).toContain("differ");
  });

  it("rejects selections for different maps that would be stored under the same name", () => {
    // The update service keeps every map file in one flat directory.
    const plan = planBulkUpload(
      [
        candidate({ key: "a", mapId: 5110, storeAs: "ladder.w3x" }),
        candidate({ key: "b", mapId: 5111, storeAs: "ladder.w3x" }),
      ],
      { 5110: [], 5111: [] },
    );

    expect(plan.map((entry) => entry.action)).toEqual(["error", "error"]);
    expect(plan[0].message).toContain("5110");
    expect(plan[0].message).toContain("5111");
  });

  it("reuses an identical stored file instead of uploading it again", () => {
    const existing = storedFile("W3Champions/5110_twisted_meadows.w3x", SHA_A);

    const plan = planBulkUpload([candidate({ key: "a" })], { 5110: [existing] });

    expect(plan[0]).toMatchObject({ key: "a", action: "reuse" });
    expect(plan[0].reuseMapFile).toBe(existing);
  });

  it("matches a stored file regardless of its folder and letter case", () => {
    const existing = storedFile("W3Champions/5110_Twisted_Meadows.w3x", SHA_A.toUpperCase());

    const plan = planBulkUpload([candidate({ key: "a" })], { 5110: [existing] });

    expect(plan[0].action).toBe("reuse");
  });

  it("rejects a file whose stored namesake has different content", () => {
    const existing = storedFile("W3Champions/5110_twisted_meadows.w3x", SHA_B);

    const plan = planBulkUpload([candidate({ key: "a" })], { 5110: [existing] });

    expect(plan[0].action).toBe("error");
    expect(plan[0].message).toContain("different file");
  });

  it("rejects a file whose stored namesake has no checksum rather than guessing", () => {
    const existing = storedFile("W3Champions/5110_twisted_meadows.w3x", "");

    const plan = planBulkUpload([candidate({ key: "a" })], { 5110: [existing] });

    expect(plan[0].action).toBe("error");
    expect(plan[0].message).toContain("checksum");
  });

  it("ignores space around the target name, as the upload does", () => {
    const existing = storedFile("W3Champions/5110_twisted_meadows.w3x", SHA_A);

    const plan = planBulkUpload(
      [candidate({ key: "a", storeAs: "  5110_twisted_meadows.w3x " })],
      { 5110: [existing] },
    );

    expect(plan[0].action).toBe("reuse");
  });

  it("falls back to the picked file's own name when the target name is blank", () => {
    // The upload falls back the same way, so the plan has to reason about the name
    // that will actually be claimed.
    const existing = storedFile("W3Champions/5110_twisted_meadows.w3x", SHA_A);

    const plan = planBulkUpload([candidate({ key: "a", storeAs: "   " })], { 5110: [existing] });

    expect(plan[0].action).toBe("reuse");
  });

  it("ignores a folder typed into the target name, as the upload does", () => {
    const existing = storedFile("W3Champions/5110_twisted_meadows.w3x", SHA_A);

    const plan = planBulkUpload(
      [candidate({ key: "a", storeAs: "W3Champions/5110_twisted_meadows.w3x" })],
      { 5110: [existing] },
    );

    expect(plan[0].action).toBe("reuse");
  });

  it("rejects a file that has no name to be stored under at all", () => {
    const plan = planBulkUpload([candidate({ key: "a", fileName: " ", storeAs: "   " })], { 5110: [] });

    expect(plan[0].action).toBe("error");
    expect(plan[0].message).toContain("required");
  });

  it("rejects a file whose bytes could not be hashed", () => {
    const plan = planBulkUpload([candidate({ key: "a", sha1: null })], { 5110: [] });

    expect(plan[0].action).toBe("error");
    expect(plan[0].message).toContain("could not be read");
  });

  it("rejects a file whose map's stored files could not be read", () => {
    const plan = planBulkUpload([candidate({ key: "a" })], { 5110: null });

    expect(plan[0].action).toBe("error");
    expect(plan[0].message).toContain("could not be read");
  });

  it("skips a file whose name does not start with a map id, with a reason", () => {
    const plan = planBulkUpload(
      [candidate({ key: "a", fileName: "tournament.w3x", storeAs: "tournament.w3x", mapId: null })],
      {},
    );

    expect(plan[0].action).toBe("skip");
    expect(plan[0].message).toContain("map id");
  });

  it("skips a file whose map id is unknown, with a reason", () => {
    const plan = planBulkUpload(
      [candidate({ key: "a", mapId: 9999, mapExists: false })],
      {},
    );

    expect(plan[0].action).toBe("skip");
    expect(plan[0].message).toContain("9999");
  });

  it("treats a copy of an already stored file as a duplicate of the reusing row", () => {
    const existing = storedFile("W3Champions/5110_twisted_meadows.w3x", SHA_A);

    const plan = planBulkUpload(
      [candidate({ key: "1v1" }), candidate({ key: "2v2" })],
      { 5110: [existing] },
    );

    expect(plan[0].action).toBe("reuse");
    expect(plan[1]).toMatchObject({ action: "duplicate", duplicateOf: "1v1" });
  });

  it("keeps a copy a duplicate while the file it copies is being handled", () => {
    // Mid-run the first copy is no longer a candidate, but it still claims the
    // name, so the second copy must not turn back into something to upload.
    const plan = planBulkUpload(
      [candidate({ key: "1v1", settled: true }), candidate({ key: "2v2" })],
      { 5110: [] },
    );

    expect(plan[0].action).toBe("settled");
    expect(plan[1]).toMatchObject({ action: "duplicate", duplicateOf: "1v1" });
  });

  it("lets a copy take over when the file it copied is left out after failing", () => {
    // A failed row is not passed in at all, so its copy becomes the candidate and
    // the map can still get its file on a retry.
    const plan = planBulkUpload([candidate({ key: "2v2" })], { 5110: [] });

    expect(plan[0].action).toBe("upload");
  });

  it("does not re-check a settled file against the stored ones", () => {
    // What happened to a settled file is the caller's to report; re-planning it
    // must not turn a stored namesake into a fresh verdict for it.
    const existing = storedFile("W3Champions/5110_twisted_meadows.w3x", SHA_B);

    const plan = planBulkUpload(
      [candidate({ key: "1v1", settled: true }), candidate({ key: "2v2" })],
      { 5110: [existing] },
    );

    expect(plan[0].action).toBe("settled");
    expect(plan[1].action).toBe("duplicate");
  });

  it("passes the first file's rejection on to its identical copies", () => {
    const existing = storedFile("W3Champions/5110_twisted_meadows.w3x", SHA_B);

    const plan = planBulkUpload(
      [candidate({ key: "1v1" }), candidate({ key: "2v2" })],
      { 5110: [existing] },
    );

    expect(plan.map((entry) => entry.action)).toEqual(["error", "error"]);
    expect(plan[1].message).toBe(plan[0].message);
  });
});

function persistedMap(path?: string, sha1?: string): Map {
  return {
    id: 5110,
    name: "Twisted Meadows",
    maxTeams: 2,
    disabled: false,
    gameMap: path === undefined ? undefined : ({ path, sha1 } as unknown as GameMap),
  };
}

describe("reconcileMapUpdate", () => {
  it("accepts a map that reads back pointing at the file that was just stored", () => {
    const mismatch = reconcileMapUpdate(
      { filePath: "W3Champions/5110_twisted_meadows.w3x", sha1: SHA_A },
      persistedMap("maps\\W3Champions\\5110_twisted_meadows.w3x", SHA_A),
    );

    expect(mismatch).toBeNull();
  });

  it("reports a map that is missing from the reloaded list", () => {
    const mismatch = reconcileMapUpdate({ filePath: "W3Champions/5110_twisted_meadows.w3x" }, undefined);

    expect(mismatch).toContain("could not be verified");
  });

  it("reports a map that still points at its previous file", () => {
    // An update that answers 200 without taking effect is otherwise
    // indistinguishable from one that worked.
    const mismatch = reconcileMapUpdate(
      { filePath: "W3Champions/5110_new.w3x" },
      persistedMap("maps\\W3Champions\\5110_old.w3x"),
    );

    expect(mismatch).toContain("5110_old.w3x");
  });

  it("reports a map that has no file at all", () => {
    const mismatch = reconcileMapUpdate({ filePath: "W3Champions/5110_new.w3x" }, persistedMap(undefined));

    expect(mismatch).toContain("no file");
  });

  it("reports a checksum that does not match the stored file", () => {
    const mismatch = reconcileMapUpdate(
      { filePath: "W3Champions/5110_new.w3x", sha1: SHA_A },
      persistedMap("maps\\W3Champions\\5110_new.w3x", SHA_B),
    );

    expect(mismatch).toContain("checksum");
  });

  it("does not complain about a checksum neither side knows", () => {
    const mismatch = reconcileMapUpdate(
      { filePath: "W3Champions/5110_new.w3x" },
      persistedMap("maps\\W3Champions\\5110_new.w3x", undefined),
    );

    expect(mismatch).toBeNull();
  });

  it("reports a checksum the map came back without", () => {
    // The checksum was part of the update, so losing it means the update did not
    // land the way it was sent.
    const mismatch = reconcileMapUpdate(
      { filePath: "W3Champions/5110_new.w3x", sha1: SHA_A },
      persistedMap("maps\\W3Champions\\5110_new.w3x", undefined),
    );

    expect(mismatch).toContain("missing");
  });
});
