import { describe, expect, it } from "vitest";
import { type ConnectionEventData, EConnectionEventType } from "@/store/admin/lagReports/types";
import { buildServerPingPoints, collectPauseIntervals, computeGameStartMs, isWithinPause, type TimelinePlayer } from "./gameTimeline";

const START = Date.UTC(2026, 9, 8, 20, 45, 0);

function event(eventType: EConnectionEventType, atMs: number, gameTimeOffsetMs: number, durationMs: number | null = null): ConnectionEventData {
  return { timestamp: new Date(atMs).toISOString(), gameTimeOffsetMs, eventType, durationMs };
}

function player(battleTag: string, connectionEvents: ConnectionEventData[] = [], pingAt: number[] = []): TimelinePlayer {
  return {
    battleTag,
    diagnostics: { connectionEvents, pingHistory: pingAt.map((t) => ({ timestamp: new Date(t).toISOString() })) },
  };
}

describe("computeGameStartMs", () => {
  it("uses the earliest ping sample of any player", () => {
    const players = [player("a#1", [], [START + 5_000]), player("b#2", [], [START, START + 1_000])];

    expect(computeGameStartMs(players, "2026-10-08T21:00:00Z")).toBe(START);
  });

  it("falls back to the report's creation time without ping history", () => {
    expect(computeGameStartMs([player("a#1")], "2026-10-08T21:00:00Z")).toBe(Date.UTC(2026, 9, 8, 21, 0, 0));
  });
});

describe("buildServerPingPoints", () => {
  it("places samples by their millisecond offset from the game start", () => {
    // flo-stats sends one sample every 15 s, starting 5 s in: time 5000, 20000, ...
    const samples = [{ time: 5_000, avg: 50 }, { time: 20_000, avg: 60 }, { time: 1_415_000, avg: 70 }];

    expect(buildServerPingPoints(samples, START)).toEqual([
      { x: START + 5_000, y: 50 },
      { x: START + 20_000, y: 60 },
      { x: START + 1_415_000, y: 70 },
    ]);
  });

  it("keeps a sample without an average as a gap, not a drop to zero", () => {
    const points = buildServerPingPoints([{ time: 5_000, avg: 50 }, { time: 20_000, avg: null }], START);

    expect(points[1]).toEqual({ x: START + 20_000, y: null });
  });
});

describe("collectPauseIntervals", () => {
  it("spans each pause from its start to the resume, from any player's events", () => {
    const players = [
      player("me#1"),
      player("opp#2", [event(EConnectionEventType.GameResumed, START + 100_000, 60_000, 30_000)]),
    ];

    expect(collectPauseIntervals(players)).toEqual([
      { startMs: START + 70_000, endMs: START + 100_000, battleTags: ["opp#2"] },
    ]);
  });

  it("merges the copies of one pause that several players report", () => {
    const players = [
      player("me#1", [event(EConnectionEventType.GameResumed, START + 100_200, 60_000, 30_100)]),
      player("opp#2", [event(EConnectionEventType.GameResumed, START + 100_000, 60_000, 30_000)]),
    ];

    expect(collectPauseIntervals(players)).toEqual([
      { startMs: START + 70_000, endMs: START + 100_200, battleTags: ["opp#2", "me#1"] },
    ]);
  });

  it("ignores resumes without a duration and other event types", () => {
    const players = [
      player("me#1", [
        event(EConnectionEventType.GameResumed, START + 100_000, 60_000, null),
        event(EConnectionEventType.Reconnect, START + 20_000, 15_000, 5_000),
      ]),
    ];

    expect(collectPauseIntervals(players)).toEqual([]);
  });
});

describe("isWithinPause", () => {
  const pauses = [{ startMs: START + 70_000, endMs: START + 100_000, battleTags: ["opp#2"] }];

  it("matches the pause and resume events that a pause box already shows, within a second", () => {
    expect(isWithinPause(START + 69_500, pauses)).toBe(true);
    expect(isWithinPause(START + 100_800, pauses)).toBe(true);
  });

  it("does not match events outside every pause", () => {
    expect(isWithinPause(START + 60_000, pauses)).toBe(false);
    expect(isWithinPause(START + 102_000, pauses)).toBe(false);
  });
});
