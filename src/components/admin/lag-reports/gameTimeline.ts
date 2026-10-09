import { type ConnectionEventData, EConnectionEventType } from "@/store/admin/lagReports/types";
import type { ChartPoint } from "./relaySeries";

export interface TimelinePlayer {
  battleTag: string;
  diagnostics: {
    pingHistory: { timestamp: string }[];
    connectionEvents: ConnectionEventData[];
  };
}

export interface GameClockPause {
  gameTimeSec: number;
  durationMs: number;
}

export interface PauseInterval {
  startMs: number;
  endMs: number;
  battleTags: string[];
}

// Each client stamps pause and resume events with its own clock.
const PAUSE_MATCH_TOLERANCE_MS = 1_000;

const CLOCK_FREEZING_EVENTS = [EConnectionEventType.Reconnect, EConnectionEventType.GameResumed, EConnectionEventType.StopLag];

export function computeGameStartMs(players: TimelinePlayer[], fallbackIso: string): number {
  let earliest = Infinity;
  for (const player of players) {
    for (const p of player.diagnostics.pingHistory) {
      const t = new Date(p.timestamp).getTime();
      if (t < earliest) earliest = t;
    }
  }
  return earliest === Infinity ? new Date(fallbackIso).getTime() : earliest;
}

/** Periods in which game time stood still while wall clock ran, once per game time. */
export function collectGameClockPauses(players: TimelinePlayer[]): GameClockPause[] {
  const pauses: GameClockPause[] = [];
  for (const player of players) {
    for (const ce of player.diagnostics.connectionEvents) {
      if (CLOCK_FREEZING_EVENTS.includes(ce.eventType) && ce.durationMs) {
        pauses.push({ gameTimeSec: ce.gameTimeOffsetMs / 1000, durationMs: ce.durationMs });
      }
    }
  }
  // Every client reports the same freeze, stamped with its own clock; summing each copy would
  // shift later points by the pause length once per extra reporter.
  const sorted = [...pauses].sort((a, b) => a.gameTimeSec - b.gameTimeSec);
  return sorted.filter((p, i) => i === 0 || (p.gameTimeSec - sorted[i - 1].gameTimeSec) * 1000 > PAUSE_MATCH_TOLERANCE_MS);
}

export function gameTimeToWallClockMs(gameTimeSec: number, pauses: GameClockPause[], gameStartMs: number): number {
  let extraMs = 0;
  for (const pause of pauses) {
    if (pause.gameTimeSec < gameTimeSec) {
      extraMs += pause.durationMs;
    } else {
      break;
    }
  }
  return gameStartMs + gameTimeSec * 1000 + extraMs;
}

/** ServerSidePing samples are stamped in game time; a null point breaks the line at each pause. */
export function buildServerPingPoints(
  samples: { time: number; avg: number | null }[],
  pauses: GameClockPause[],
  gameStartMs: number,
): ChartPoint[] {
  const points: ChartPoint[] = [];
  let prevTime = -1;
  for (const s of samples) {
    for (const pause of pauses) {
      if (pause.gameTimeSec > prevTime && pause.gameTimeSec <= s.time) {
        points.push({ x: gameTimeToWallClockMs(pause.gameTimeSec, pauses, gameStartMs), y: null });
      }
    }
    points.push({ x: gameTimeToWallClockMs(s.time, pauses, gameStartMs), y: s.avg });
    prevTime = s.time;
  }
  return points;
}

/**
 * Wall-clock pauses from every player's resume events. Every client in the game reports the
 * same pause, with slightly different timestamps, so overlapping copies merge into one.
 */
export function collectPauseIntervals(players: TimelinePlayer[]): PauseInterval[] {
  const raw = players.flatMap((player) =>
    player.diagnostics.connectionEvents
      .filter((ce) => ce.eventType === EConnectionEventType.GameResumed && ce.durationMs)
      .map((ce) => {
        const endMs = new Date(ce.timestamp).getTime();
        return { startMs: endMs - (ce.durationMs ?? 0), endMs, battleTags: [player.battleTag] };
      })
  ).sort((a, b) => a.startMs - b.startMs);

  const merged: PauseInterval[] = [];
  for (const interval of raw) {
    const last = merged[merged.length - 1];
    if (last && interval.startMs <= last.endMs) {
      merged[merged.length - 1] = {
        startMs: last.startMs,
        endMs: Math.max(last.endMs, interval.endMs),
        battleTags: last.battleTags.includes(interval.battleTags[0]) ? last.battleTags : [...last.battleTags, ...interval.battleTags],
      };
    } else {
      merged.push(interval);
    }
  }
  return merged;
}

/** Whether an event at tsMs is the start or end of a pause already shown as an interval. */
export function isWithinPause(tsMs: number, pauses: PauseInterval[]): boolean {
  return pauses.some((p) => tsMs >= p.startMs - PAUSE_MATCH_TOLERANCE_MS && tsMs <= p.endMs + PAUSE_MATCH_TOLERANCE_MS);
}
