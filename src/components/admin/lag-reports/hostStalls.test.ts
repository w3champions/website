import { describe, expect, it } from "vitest";
import { earliestHostStallReport, formatStallDuration, groupHostStalls, hostStallIndicatorCount, hostStallOutcome, HostStallReporter, HostStallSource, summarizeHostStalls } from "./hostStalls";
import { HostStallData } from "@/store/admin/lagReports/types";

const STALL_AT = "2026-09-20T18:04:11.000Z";

function stall(overrides: Partial<HostStallData> = {}): HostStallData {
  return {
    timestamp: STALL_AT,
    gameTimeOffsetMs: 240_000,
    stallMs: 7_000,
    playersTotal: 4,
    playersFlagged: 3,
    outcome: "mass_lag_suppressed",
    ...overrides,
  };
}

function player(battleTag: string, hostStalls: HostStallData[]): HostStallSource {
  return { battleTag, diagnostics: { hostStalls } };
}

describe("groupHostStalls", () => {
  it("collapses the copy every player reports into a single row", () => {
    // The node measures the stall once and tells every client the same thing, so four
    // identical records are one server fault, not four.
    const groups = groupHostStalls([
      player("Alice#1", [stall()]),
      player("Bob#2", [stall()]),
      player("Carol#3", [stall()]),
      player("Dan#4", [stall()]),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].reporters.map((r) => r.battleTag)).toEqual(["Alice#1", "Bob#2", "Carol#3", "Dan#4"]);
    expect(groups[0].playersTotal).toBe(4);
    expect(groups[0].partiallyReported).toBe(false);
  });

  it("keeps the player index of each reporter so the caller can colour it", () => {
    const groups = groupHostStalls([
      player("Alice#1", []),
      player("Bob#2", [stall()]),
    ]);

    expect(groups[0].reporters).toEqual([{ battleTag: "Bob#2", playerIndex: 1, timestamp: STALL_AT }]);
  });

  it("does not collapse stalls that differ in duration", () => {
    const groups = groupHostStalls([
      player("Alice#1", [stall({ stallMs: 7_000 })]),
      player("Bob#2", [stall({ stallMs: 9_000 })]),
    ]);

    expect(groups).toHaveLength(2);
  });

  it("does not collapse stalls that differ in outcome", () => {
    const groups = groupHostStalls([
      player("Alice#1", [stall({ outcome: "absorbed" })]),
      player("Bob#2", [stall({ outcome: "mass_lag_suppressed" })]),
    ]);

    expect(groups).toHaveLength(2);
  });

  it("groups stalls that differ only in timestamp", () => {
    // Each client stamps the packet with its own arrival time, so the same node event
    // comes back with a different timestamp per reporter. That must still be one stall -
    // it is the whole reason the timestamp is not part of the grouping key.
    const groups = groupHostStalls([
      player("Alice#1", [stall({ timestamp: "2026-09-20T18:04:11.000Z" })]),
      player("Bob#2", [stall({ timestamp: "2026-09-20T18:04:11.900Z" })]),
      player("Carol#3", [stall({ timestamp: "2026-09-20T18:04:12.400Z" })]),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].reporters).toHaveLength(3);
  });

  it("does not collapse stalls that differ in game time", () => {
    // gameTimeOffsetMs is the node's own clock and is identical for every reporter of a
    // real stall, so a difference here means two distinct stalls, not one under-grouped.
    const groups = groupHostStalls([
      player("Alice#1", [stall({ gameTimeOffsetMs: 120_000 })]),
      player("Bob#2", [stall({ gameTimeOffsetMs: 180_000 })]),
    ]);

    expect(groups).toHaveLength(2);
  });

  it("marks a stall reported by fewer clients than the roster holds", () => {
    // Only flo clients from 0.18.4 on receive the packet, so a short count is a
    // mixed-version roster and is worth showing rather than collapsing away.
    const groups = groupHostStalls([
      player("Alice#1", [stall()]),
      player("Bob#2", [stall()]),
      player("Carol#3", []),
      player("Dan#4", []),
    ]);

    expect(groups[0].reporters).toHaveLength(2);
    expect(groups[0].playersTotal).toBe(4);
    expect(groups[0].partiallyReported).toBe(true);
  });

  it("marks a stall partially reported even when every player in the lag report reported it", () => {
    // A lag report only holds players who submitted diagnostics, so when the roster
    // has already been narrowed to the upgraded clients, reporters.length equals the
    // report's own player count and would read as complete. The node's playersTotal -
    // the roster the node actually saw - is the only denominator that still catches
    // the mixed-version roster this indicator exists to expose.
    const groups = groupHostStalls([
      player("Alice#1", [stall({ playersTotal: 4 })]),
      player("Bob#2", [stall({ playersTotal: 4 })]),
    ]);

    expect(groups[0].reporters).toHaveLength(2);
    expect(groups[0].playersTotal).toBe(4);
    expect(groups[0].partiallyReported).toBe(true);
  });

  it("falls back to the reporter count when playersTotal is absent", () => {
    // A total this build cannot trust must not render as "N of 0" or "N of undefined";
    // treating the reporters themselves as the whole roster is the honest fallback.
    const groups = groupHostStalls([
      player("Alice#1", [stall({ playersTotal: undefined as unknown as number })]),
      player("Bob#2", [stall({ playersTotal: undefined as unknown as number })]),
    ]);

    expect(groups[0].playersTotal).toBe(2);
    expect(groups[0].partiallyReported).toBe(false);
  });

  it("falls back to the reporter count when playersTotal is zero", () => {
    const groups = groupHostStalls([
      player("Alice#1", [stall({ playersTotal: 0 })]),
      player("Bob#2", [stall({ playersTotal: 0 })]),
    ]);

    expect(groups[0].playersTotal).toBe(2);
    expect(groups[0].partiallyReported).toBe(false);
  });

  it("floors playersTotal at the reporter count instead of showing an impossible shortfall", () => {
    // A total smaller than the number of reporters can only come from a malformed or
    // hand-edited document; showing it verbatim would render something like "2 of 1
    // players" instead of anything meaningful.
    const groups = groupHostStalls([
      player("Alice#1", [stall({ playersTotal: 1 })]),
      player("Bob#2", [stall({ playersTotal: 1 })]),
    ]);

    expect(groups[0].playersTotal).toBe(2);
    expect(groups[0].partiallyReported).toBe(false);
  });

  it("orders several stalls by game time", () => {
    const groups = groupHostStalls([
      player("Alice#1", [
        stall({ gameTimeOffsetMs: 600_000, timestamp: "2026-09-20T18:10:00.000Z" }),
        stall({ gameTimeOffsetMs: 120_000, timestamp: "2026-09-20T18:02:00.000Z" }),
      ]),
    ]);

    expect(groups.map((g) => g.stall.gameTimeOffsetMs)).toEqual([120_000, 600_000]);
  });

  it("produces nothing when no player reported a stall", () => {
    expect(groupHostStalls([player("Alice#1", []), player("Bob#2", [])])).toEqual([]);
  });

  it("produces nothing when the field is missing entirely", () => {
    // A report stored before the field existed comes back without it.
    const legacy: HostStallSource[] = [{ battleTag: "Alice#1", diagnostics: {} }];

    expect(groupHostStalls(legacy)).toEqual([]);
  });

  it("produces nothing when the backend sends the field as null", () => {
    const legacy: HostStallSource[] = [{ battleTag: "Alice#1", diagnostics: { hostStalls: null } }];

    expect(groupHostStalls(legacy)).toEqual([]);
  });

  it("produces nothing for a report with no players", () => {
    expect(groupHostStalls([])).toEqual([]);
  });

  it("groups an outcome this build has never heard of without throwing", () => {
    const groups = groupHostStalls([
      player("Alice#1", [stall({ outcome: "evicted" })]),
      player("Bob#2", [stall({ outcome: "evicted" })]),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].stall.outcome).toBe("evicted");
  });

  it("counts a player that uploaded the same stall twice only once", () => {
    // A resent diagnostics report carries the packet again; a second count would push
    // the reporter total past playersTotal and read as nonsense.
    const groups = groupHostStalls([
      player("Alice#1", [stall({ playersTotal: 2 }), stall({ playersTotal: 2 })]),
      player("Bob#2", [stall({ playersTotal: 2 })]),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].reporters.map((r) => r.battleTag)).toEqual(["Alice#1", "Bob#2"]);
    expect(groups[0].partiallyReported).toBe(false);
  });
});

function reporter(battleTag: string, timestamp: string, playerIndex = 0): HostStallReporter {
  return { battleTag, playerIndex, timestamp };
}

describe("earliestHostStallReport", () => {
  it("picks the earliest of several reporters, not the first in the list", () => {
    const earliest = earliestHostStallReport([
      reporter("Alice#1", "2026-09-20T18:04:12.400Z"),
      reporter("Bob#2", "2026-09-20T18:04:11.000Z"),
      reporter("Carol#3", "2026-09-20T18:04:11.900Z"),
    ]);

    expect(earliest).toBe("2026-09-20T18:04:11.000Z");
  });

  it("skips a reporter whose timestamp does not parse", () => {
    const earliest = earliestHostStallReport([
      reporter("Alice#1", "not a date"),
      reporter("Bob#2", "2026-09-20T18:04:11.000Z"),
    ]);

    expect(earliest).toBe("2026-09-20T18:04:11.000Z");
  });

  it("has nothing to report when there are no reporters", () => {
    expect(earliestHostStallReport([])).toBeNull();
  });
});

describe("hostStallOutcome", () => {
  it("labels an absorbed stall as informational", () => {
    const outcome = hostStallOutcome("absorbed");

    expect(outcome.known).toBe(true);
    expect(outcome.label).toBe("Absorbed");
    expect(outcome.color).toBe("info");
  });

  it("labels a suppressed mass lag report as an error", () => {
    const outcome = hostStallOutcome("mass_lag_suppressed");

    expect(outcome.known).toBe(true);
    expect(outcome.label).toBe("Mass lag suppressed");
    expect(outcome.color).toBe("error");
  });

  it("shows an outcome this build has never heard of verbatim", () => {
    // A newer node may emit anything; blanking it would hide the only clue to what
    // the node actually did.
    const outcome = hostStallOutcome("paused");

    expect(outcome.known).toBe(false);
    expect(outcome.label).toBe("paused");
    expect(outcome.description).toContain("newer game node");
  });

  it("does not resolve an outcome named after an Object.prototype member", () => {
    const outcome = hostStallOutcome("toString");

    expect(outcome.known).toBe(false);
    expect(outcome.label).toBe("toString");
  });

  it("says so rather than rendering blank when no outcome came through", () => {
    expect(hostStallOutcome("").label).toBe("(no outcome reported)");
    expect(hostStallOutcome("   ").label).toBe("(no outcome reported)");
  });

  it("does not throw on a value that is missing altogether", () => {
    expect(() => hostStallOutcome(undefined as unknown as string)).not.toThrow();
    expect(hostStallOutcome(undefined as unknown as string).label).toBe("(no outcome reported)");
  });

  it("does not throw on a value that is not a string at all", () => {
    // Two computed properties reach this; throwing would blank the whole detail page.
    expect(() => hostStallOutcome(42 as unknown as string)).not.toThrow();
    expect(hostStallOutcome(42 as unknown as string).label).toBe("42");
  });
});

describe("summarizeHostStalls", () => {
  it("has nothing to say for a report without stalls", () => {
    expect(summarizeHostStalls([])).toBeNull();
  });

  it("counts de-duplicated stalls and totals the time lost", () => {
    const groups = groupHostStalls([
      player("Alice#1", [
        stall({ stallMs: 7_000, gameTimeOffsetMs: 120_000, timestamp: "2026-09-20T18:02:00.000Z" }),
        stall({ stallMs: 2_500, gameTimeOffsetMs: 600_000, timestamp: "2026-09-20T18:10:00.000Z" }),
      ]),
      player("Bob#2", [
        stall({ stallMs: 7_000, gameTimeOffsetMs: 120_000, timestamp: "2026-09-20T18:02:00.000Z" }),
      ]),
    ]);

    expect(summarizeHostStalls(groups)).toEqual({ count: 2, totalStallMs: 9_500, color: "error" });
  });

  it("takes its colour from the most severe outcome in the report", () => {
    const groups = groupHostStalls([
      player("Alice#1", [
        stall({ outcome: "absorbed", gameTimeOffsetMs: 120_000, timestamp: "2026-09-20T18:02:00.000Z" }),
        stall({ outcome: "mass_lag_suppressed", gameTimeOffsetMs: 600_000, timestamp: "2026-09-20T18:10:00.000Z" }),
      ]),
    ]);

    expect(summarizeHostStalls(groups)?.color).toBe("error");
  });

  it("stays informational when every stall was absorbed", () => {
    const groups = groupHostStalls([player("Alice#1", [stall({ outcome: "absorbed" })])]);

    expect(summarizeHostStalls(groups)?.color).toBe("info");
  });

  it("flags an unknown outcome for attention rather than calling it benign", () => {
    const groups = groupHostStalls([player("Alice#1", [stall({ outcome: "something_new" })])]);

    expect(summarizeHostStalls(groups)?.color).toBe("warning");
  });
});

describe("hostStallIndicatorCount", () => {
  it("shows nothing when the backend does not send the field yet", () => {
    // Absent is not zero: an older backend cannot answer the question at all.
    expect(hostStallIndicatorCount([{}, {}])).toBeNull();
  });

  it("shows nothing when the game had no stalls", () => {
    expect(hostStallIndicatorCount([{ hostStallCount: 0 }, { hostStallCount: 0 }])).toBeNull();
  });

  it("shows nothing for a report with no players", () => {
    expect(hostStallIndicatorCount([])).toBeNull();
  });

  it("reports the game's stall count rather than the sum over the roster", () => {
    // Every client is told about the same stalls, so summing would multiply one
    // server fault by the number of players.
    expect(hostStallIndicatorCount([
      { hostStallCount: 2 },
      { hostStallCount: 2 },
      { hostStallCount: 2 },
    ])).toBe(2);
  });

  it("takes the highest count when only some clients were new enough to be told", () => {
    expect(hostStallIndicatorCount([{ hostStallCount: 3 }, { hostStallCount: 0 }, {}])).toBe(3);
  });

  it("ignores a count that is not a usable number", () => {
    expect(hostStallIndicatorCount([{ hostStallCount: Number.NaN }])).toBeNull();
  });
});

describe("formatStallDuration", () => {
  it("reads in seconds, to one decimal", () => {
    expect(formatStallDuration(7_000)).toBe("7.0s");
    expect(formatStallDuration(2_450)).toBe("2.5s");
  });

  it("does not print NaN for a value that never arrived", () => {
    expect(formatStallDuration(Number.NaN)).toBe("—");
  });
});
