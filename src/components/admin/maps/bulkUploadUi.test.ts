import { describe, expect, it } from "vitest";
import { BulkRowStatus, gatingFor, PlanRowInput, RunTally, startTally, summarizeRun, TallyRowInput, toPlanCandidates } from "./bulkUploadUi";

function row(overrides: Partial<PlanRowInput> & Pick<PlanRowInput, "key">): PlanRowInput {
  return {
    fileName: "5110_twisted_meadows.w3x",
    storeAs: "5110_twisted_meadows.w3x",
    mapId: 5110,
    mapExists: true,
    sha1: "d3486ae9136e7856bc42212385ea797094475802",
    state: "pending",
    ...overrides,
  };
}

describe("toPlanCandidates", () => {
  it("passes a pending row through as an open candidate", () => {
    expect(toPlanCandidates([row({ key: "a" })])).toEqual([
      expect.objectContaining({ key: "a", mapId: 5110, mapExists: true, settled: false }),
    ]);
  });

  it("marks a row that is already on its way as settled, so its copies stay duplicates", () => {
    const candidates = toPlanCandidates([
      row({ key: "a", state: "uploading" }),
      row({ key: "b", state: "uploaded" }),
      row({ key: "c", state: "selected" }),
    ]);

    expect(candidates.map((candidate) => candidate.settled)).toEqual([true, true, true]);
  });

  it("leaves a failed row out entirely, so one of its copies can take over", () => {
    const candidates = toPlanCandidates([row({ key: "a", state: "failed" }), row({ key: "b" })]);

    expect(candidates.map((candidate) => candidate.key)).toEqual(["b"]);
  });

  it("reports a row with no map as a candidate the plan will skip", () => {
    const [candidate] = toPlanCandidates([row({ key: "a", mapId: null, mapExists: false })]);

    expect(candidate).toMatchObject({ mapId: null, mapExists: false });
  });

  it("carries the temporary-target flag through, so the plan can name the real reason", () => {
    const [candidate] = toPlanCandidates([
      row({ key: "a", mapId: 5110, mapExists: false, mapTemporary: true }),
    ]);

    expect(candidate).toMatchObject({ mapId: 5110, mapExists: false, mapTemporary: true });
  });
});

function statusRow(key: string, status: BulkRowStatus): TallyRowInput {
  return { key, status };
}

describe("startTally", () => {
  it("counts what the run is leaving behind", () => {
    const start = startTally(
      [
        statusRow("a", "ready"),
        statusRow("b", "error"),
        statusRow("c", "skipped"),
        statusRow("d", "duplicate"),
      ],
      ["a"],
    );

    expect(start).toMatchObject({ total: 4, blocked: 1, skipped: 1, duplicates: 1, succeeded: 0, failed: 0 });
  });

  it("does not hold back a failed row that this run is about to retry", () => {
    // "Select uploaded" retries a row whose map update failed. Its outcome is
    // this run's to report, so the state the last run left it in must not count
    // against it as well.
    const start = startTally([statusRow("a", "error")], ["a"]);
    start.succeeded = 1;
    start.headlines.push("Selected 1 map.");
    start.notifiesParent = true;

    const summary = summarizeRun(start);
    expect(summary.error).toBe("");
    expect(summary.successMessage).toContain("Selected 1 map.");
    expect(summary.mayComplete).toBe(true);
  });

  it("counts a retry that fails again once, not twice", () => {
    const start = startTally([statusRow("a", "error")], ["a"]);
    start.failed = 1;

    expect(summarizeRun(start).error).toContain("1 of 1");
    expect(summarizeRun(start).error).toContain("need attention");
  });

  it("keeps holding a row the plan refused to send and the run cannot touch", () => {
    const start = startTally([statusRow("a", "ready"), statusRow("b", "error")], ["a"]);
    start.succeeded = 1;
    start.headlines.push("Uploaded 1 file.");

    const summary = summarizeRun(start);
    expect(summary.successMessage).toBe("");
    expect(summary.error).toContain("1 of 2");
    expect(summary.error).toContain("need attention");
    expect(summary.mayComplete).toBe(false);
  });

  it("applies the same rule to an upload run, whose rows it also acts on", () => {
    // Both run kinds go through here; only the set of rows differs.
    const rows = [statusRow("a", "ready"), statusRow("b", "reuse"), statusRow("c", "error")];

    expect(startTally(rows, ["a", "b"]).blocked).toBe(1);
    expect(startTally(rows, ["a", "b", "c"]).blocked).toBe(0);
  });

  it("still reports the whole batch as the size of the run", () => {
    const rows = [statusRow("a", "error"), statusRow("b", "error")];

    expect(startTally(rows, ["a", "b"]).total).toBe(2);
  });
});

function tally(overrides: Partial<RunTally> = {}): RunTally {
  return {
    total: 10,
    blocked: 0,
    skipped: 0,
    duplicates: 0,
    succeeded: 0,
    failed: 0,
    headlines: [],
    hint: "",
    notifiesParent: true,
    ...overrides,
  };
}

describe("summarizeRun", () => {
  it("reports a clean run as a success and lets the parent be told", () => {
    const summary = summarizeRun(tally({ succeeded: 10, headlines: ["Selected 10 maps."] }));

    expect(summary.error).toBe("");
    expect(summary.successMessage).toContain("Selected 10 maps.");
    expect(summary.mayComplete).toBe(true);
  });

  it("names what was held back so nothing is missing from the headline", () => {
    const summary = summarizeRun(
      tally({ total: 149, succeeded: 131, duplicates: 9, skipped: 9, headlines: ["Selected 131 maps."] }),
    );

    expect(summary.successMessage).toContain("Selected 131 maps.");
    expect(summary.successMessage).toContain("9 identical copies skipped");
    expect(summary.successMessage).toContain("9 skipped");
    expect(summary.mayComplete).toBe(true);
  });

  it("does not tell the parent about a run that only uploaded files", () => {
    // Uploading changes no map, so the maps table behind the dialog has nothing
    // new to celebrate.
    const summary = summarizeRun(
      tally({ succeeded: 10, notifiesParent: false, headlines: ["Uploaded 10 files."] }),
    );

    expect(summary.successMessage).toContain("Uploaded 10 files.");
    expect(summary.mayComplete).toBe(false);
  });

  it("never calls a run a success when a row failed", () => {
    const summary = summarizeRun(tally({ succeeded: 9, failed: 1, headlines: ["Selected 9 maps."] }));

    expect(summary.successMessage).toBe("");
    expect(summary.error).toContain("need attention");
    expect(summary.mayComplete).toBe(false);
  });

  it("counts files the plan refused to send as failures of the run", () => {
    const summary = summarizeRun(tally({ succeeded: 8, blocked: 2, headlines: ["Uploaded 8 files."] }));

    expect(summary.successMessage).toBe("");
    expect(summary.error).toContain("2 of 10");
    expect(summary.mayComplete).toBe(false);
  });

  it("keeps the reason a run stopped, rather than only the count", () => {
    const summary = summarizeRun(tally({ failed: 1, fatal: "Network error while uploading the map file." }));

    expect(summary.error).toContain("Network error while uploading the map file.");
    expect(summary.error).toContain("need attention");
    expect(summary.successMessage).toBe("");
  });

  it("reports a run that stopped even when no row was blamed for it", () => {
    const summary = summarizeRun(tally({ succeeded: 3, fatal: "The run stopped unexpectedly." }));

    expect(summary.error).toBe("The run stopped unexpectedly.");
    expect(summary.successMessage).toBe("");
    expect(summary.mayComplete).toBe(false);
  });

  it("still reports a failure after the rows were cleared mid-run", () => {
    // Reset empties the rows. The summary is built from the run's own results, so
    // an empty row list cannot turn a failed run into a success banner.
    const summary = summarizeRun(tally({ total: 0, succeeded: 0, failed: 2, headlines: [] }));

    expect(summary.successMessage).toBe("");
    expect(summary.error).toContain("2 of 2");
    expect(summary.mayComplete).toBe(false);
  });

  it("does not offer to tell the parent when nothing was applied", () => {
    const summary = summarizeRun(tally({ total: 3, skipped: 3 }));

    expect(summary.error).toBe("");
    expect(summary.successMessage).toContain("3 skipped");
    expect(summary.mayComplete).toBe(false);
  });

  it("keeps the follow-up hint on a clean run only", () => {
    const hint = "Select them to make them active.";
    const clean = summarizeRun(tally({ succeeded: 1, headlines: ["Uploaded 1 file."], hint }));
    const dirty = summarizeRun(tally({ succeeded: 1, failed: 1, headlines: ["Uploaded 1 file."], hint }));

    expect(clean.successMessage).toContain(hint);
    expect(dirty.error).not.toContain(hint);
  });
});

describe("gatingFor", () => {
  it("leaves everything available when nothing is happening", () => {
    expect(gatingFor({ runningAction: null, preparing: false })).toEqual({
      busy: false,
      canReset: true,
      canClose: true,
    });
  });

  it("holds the actions back while the picked files are being checked, but not the way out", () => {
    // Pre-flight hashing and stored-file reads: Reset and Close stay usable.
    expect(gatingFor({ runningAction: null, preparing: true })).toEqual({
      busy: true,
      canReset: true,
      canClose: true,
    });
  });

  it("locks Reset and Close for the whole upload run", () => {
    expect(gatingFor({ runningAction: "upload", preparing: false })).toEqual({
      busy: true,
      canReset: false,
      canClose: false,
    });
  });

  it("stays locked during the post-upload refresh, when no request is on screen", () => {
    // The upload loop has finished but the run has not: the dialog must not look
    // idle while it is still reconciling its own state.
    expect(gatingFor({ runningAction: "upload-select", preparing: true })).toEqual({
      busy: true,
      canReset: false,
      canClose: false,
    });
  });

  it("stays locked while the maps are being updated and verified", () => {
    expect(gatingFor({ runningAction: "select", preparing: false })).toEqual({
      busy: true,
      canReset: false,
      canClose: false,
    });
  });
});
