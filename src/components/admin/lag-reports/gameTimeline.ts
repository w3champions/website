import { type ConnectionEventData, EConnectionEventType } from "@/store/admin/lagReports/types";
import type { ChartPoint } from "./relaySeries";

export interface TimelinePlayer {
  battleTag: string;
  diagnostics: {
    pingHistory: { timestamp: string }[];
    connectionEvents: ConnectionEventData[];
  };
}

export interface PauseInterval {
  startMs: number;
  endMs: number;
  battleTags: string[];
}

// Each client stamps pause and resume events with its own clock.
const PAUSE_MATCH_TOLERANCE_MS = 1_000;

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

/**
 * ServerSidePing `time` is milliseconds of wall clock since the node started the game (flo
 * node's RTT stats timer, one sample every 15 s), not game time: pauses do not stop it, so
 * no pause shift applies.
 */
export function buildServerPingPoints(samples: { time: number; avg: number | null }[], gameStartMs: number): ChartPoint[] {
  return samples.map((s) => ({ x: gameStartMs + s.time, y: s.avg }));
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
