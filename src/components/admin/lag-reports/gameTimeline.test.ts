import { describe, expect, it } from "vitest";
import { type ConnectionEventData, EConnectionEventType } from "@/store/admin/lagReports/types";
import { buildServerPingPoints, collectGameClockPauses, collectPauseIntervals, computeGameStartMs, gameTimeToWallClockMs, isWithinPause, type TimelinePlayer } from "./gameTimeline";

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

describe("collectGameClockPauses", () => {
  it("counts a pause once when clients stamp it at slightly different game times", () => {
    const players = [
      player("a#1", [event(EConnectionEventType.GameResumed, START + 100_000, 60_000, 30_000)]),
      player("b#2", [event(EConnectionEventType.GameResumed, START + 100_040, 60_040, 30_020)]),
    ];

    expect(collectGameClockPauses(players)).toEqual([{ gameTimeSec: 60, durationMs: 30_000 }]);
  });

  it("collects the durations that froze game time, once per game time, in order", () => {
    const players = [
      player("a#1", [event(EConnectionEventType.GameResumed, START + 100_000, 60_000, 30_000)]),
      player("b#2", [
        event(EConnectionEventType.GameResumed, START + 100_000, 60_000, 30_000),
        event(EConnectionEventType.Reconnect, START + 20_000, 15_000, 5_000),
        event(EConnectionEventType.GamePaused, START + 70_000, 60_000, null),
      ]),
    ];

    expect(collectGameClockPauses(players)).toEqual([
      { gameTimeSec: 15, durationMs: 5_000 },
      { gameTimeSec: 60, durationMs: 30_000 },
    ]);
  });
});

describe("gameTimeToWallClockMs", () => {
  it("adds every pause that happened before the game time", () => {
    const pauses = [{ gameTimeSec: 15, durationMs: 5_000 }, { gameTimeSec: 60, durationMs: 30_000 }];

    expect(gameTimeToWallClockMs(10, pauses, START)).toBe(START + 10_000);
    expect(gameTimeToWallClockMs(20, pauses, START)).toBe(START + 25_000);
    expect(gameTimeToWallClockMs(61, pauses, START)).toBe(START + 96_000);
  });
});

describe("buildServerPingPoints", () => {
  it("breaks the line at each pause and shifts later samples by the pause length", () => {
    const pauses = [{ gameTimeSec: 15, durationMs: 5_000 }];
    const samples = [{ time: 10, avg: 50 }, { time: 20, avg: 60 }];

    expect(buildServerPingPoints(samples, pauses, START)).toEqual([
      { x: START + 10_000, y: 50 },
      { x: START + 15_000, y: null },
      { x: START + 25_000, y: 60 },
    ]);
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
