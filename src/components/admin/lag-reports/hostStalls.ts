import { HostStallData } from "@/store/admin/lagReports/types";

/**
 * The shape a host stall arrives in, rather than the shape the detail type promises.
 *
 * Reports written before the field existed, and nodes that never emit it, both come back
 * without it, so the array is read as possibly absent no matter how the wire type reads.
 */
export interface HostStallSource {
  battleTag: string;
  diagnostics: { hostStalls?: HostStallData[] | null };
}

export interface HostStallReporter {
  battleTag: string;
  /** Index into the report's players, so the caller can reuse its per-player colour. */
  playerIndex: number;
  /**
   * When this client's own clock handled the stall packet - not when the node stalled.
   * Every reporter of the same stall carries a different value here, which is exactly why
   * it plays no part in grouping and must be read as a per-client fact, never the event's.
   */
  timestamp: string;
}

export interface GroupedHostStall {
  stall: HostStallData;
  reporters: HostStallReporter[];
  /** Players in the report, to read the reporter count against. */
  rosterSize: number;
  /**
   * True when fewer clients reported the stall than the report has players. Only flo
   * clients from 0.18.4 on are sent the packet, so this means a mixed-version roster -
   * never a stall that hit only some of the players.
   */
  partiallyReported: boolean;
}

export interface HostStallOutcome {
  /** What to show. An outcome this build does not know renders as the node sent it. */
  label: string;
  color: string;
  description: string;
  known: boolean;
}

export interface HostStallSummary {
  /** Distinct stalls, after de-duplication. */
  count: number;
  totalStallMs: number;
  color: string;
}

const HOST_STALL_OUTCOMES = new Map<string, Omit<HostStallOutcome, "known">>([
  ["absorbed", {
    label: "Absorbed",
    color: "info",
    description: "The node refused to charge the lost time to the players and re-based the game clock instead.",
  }],
  ["mass_lag_suppressed", {
    label: "Mass lag suppressed",
    color: "error",
    description: "The stall made the whole roster look laggy at once. The node suppressed the resulting mass lag "
      + "report rather than pause the game, which would have evicted every player 57 s later.",
  }],
]);

const UNKNOWN_OUTCOME_DESCRIPTION = "This build does not know this outcome - it comes from a newer game node. "
  + "The value is shown exactly as the node sent it.";

const NO_OUTCOME_LABEL = "(no outcome reported)";

// Worst wins when a report holds several outcomes, so the headline chip cannot read
// milder than the most severe thing in the table.
const SEVERITY_ORDER = ["info", "warning", "error"];

/**
 * Identity of one stall, built from the fields the node itself puts in the packet.
 *
 * The node measures a stall once and broadcasts the identical record to every client, so
 * two rows that agree on every node-authored field are the same stall no matter which
 * client reported them. The timestamp is deliberately left out of the key: it is stamped
 * by the receiving client's own wall clock on arrival, not by the node, so it differs by
 * reporter for a single real stall and would fracture one server fault into several rows
 * instead of merging it.
 */
function hostStallKey(stall: HostStallData): string {
  return [
    stall.gameTimeOffsetMs,
    stall.stallMs,
    stall.playersTotal,
    stall.playersFlagged,
    stall.outcome,
  ].join("|");
}

/**
 * Collapse the per-player copies of each stall into one row, in game-time order.
 *
 * Rendering them per player the way lag and connection events are rendered would turn one
 * server fault into N near-identical rows and read as N separate problems.
 */
export function groupHostStalls(players: readonly HostStallSource[]): GroupedHostStall[] {
  const rosterSize = players.length;
  const byKey = new Map<string, { stall: HostStallData; reporters: HostStallReporter[] }>();

  players.forEach((player, playerIndex) => {
    for (const stall of player.diagnostics?.hostStalls ?? []) {
      if (!stall) continue;

      const key = hostStallKey(stall);
      const reporter: HostStallReporter = { battleTag: player.battleTag, playerIndex, timestamp: stall.timestamp };
      const bucket = byKey.get(key);

      // One player can carry the same stall twice - a client that resent its diagnostics
      // uploads the packet again - and counting it twice would push the reporter count
      // past the roster, so "5 of 4 clients" would replace the mixed-version signal.
      if (bucket?.reporters.some((seen) => seen.playerIndex === playerIndex)) continue;

      byKey.set(
        key,
        bucket
          ? { stall: bucket.stall, reporters: [...bucket.reporters, reporter] }
          : { stall, reporters: [reporter] },
      );
    }
  });

  return [...byKey.values()]
    .map(({ stall, reporters }) => ({
      stall,
      reporters,
      rosterSize,
      partiallyReported: reporters.length < rosterSize,
    }))
    .sort((a, b) => a.stall.gameTimeOffsetMs - b.stall.gameTimeOffsetMs);
}

/**
 * The earliest moment any reporter says it learned of the stall.
 *
 * Nothing in the packet carries the node's own wall-clock time, so this is only the
 * closest available lower bound on when the stall happened, never the stall's actual
 * time - each reporter's clock and network path to the node differ. Presenting this
 * instead of one reporter's record avoids passing off an arbitrary client's clock as the
 * event's own.
 */
export function earliestHostStallReport(reporters: readonly HostStallReporter[]): string | null {
  let earliest: { raw: string; instant: number } | null = null;

  for (const reporter of reporters) {
    const instant = Date.parse(reporter.timestamp);
    if (Number.isNaN(instant)) continue;
    if (!earliest || instant < earliest.instant) earliest = { raw: reporter.timestamp, instant };
  }

  return earliest?.raw ?? null;
}

/**
 * How to label and colour one outcome.
 *
 * Looked up in a Map rather than an object literal so an outcome named after something on
 * Object.prototype ("constructor", "toString") cannot resolve to an inherited member.
 */
export function hostStallOutcome(outcome: string): HostStallOutcome {
  // Coerced rather than trimmed directly: this is untrusted wire data reached from two
  // computed properties, and throwing here would blank the whole detail page.
  const raw = String(outcome ?? "").trim();
  const known = HOST_STALL_OUTCOMES.get(raw);
  if (known) return { ...known, known: true };

  return {
    // Never blank: an unrecognised or empty value still has to be visible as itself.
    label: raw || NO_OUTCOME_LABEL,
    color: "warning",
    description: UNKNOWN_OUTCOME_DESCRIPTION,
    known: false,
  };
}

/** The one-line headline for a report, or null when the node reported no stalls. */
export function summarizeHostStalls(groups: readonly GroupedHostStall[]): HostStallSummary | null {
  if (!groups.length) return null;

  const totalStallMs = groups.reduce(
    (sum, group) => sum + (Number.isFinite(group.stall.stallMs) ? group.stall.stallMs : 0),
    0,
  );

  const severity = groups.reduce((worst, group) => {
    const rank = SEVERITY_ORDER.indexOf(hostStallOutcome(group.stall.outcome).color);
    return rank > worst ? rank : worst;
  }, 0);

  return { count: groups.length, totalStallMs, color: SEVERITY_ORDER[severity] };
}

export interface HostStallCountSource {
  hostStallCount?: number;
}

/**
 * How many node stalls to advertise for a report in the list view, or null for none.
 *
 * Every client in a game is told about the same stalls, so the roster's maximum is the
 * game's stall count while a sum would multiply it by the number of players. Null covers
 * both a backend that does not send the field yet and a game that simply had no stalls;
 * either way there is nothing to draw.
 */
export function hostStallIndicatorCount(players: readonly HostStallCountSource[]): number | null {
  const counts = players
    .map((player) => player.hostStallCount)
    .filter((count): count is number => typeof count === "number" && Number.isFinite(count) && count > 0);

  return counts.length ? Math.max(...counts) : null;
}

/** Stall durations read in seconds, matching how connection-event durations are shown. */
export function formatStallDuration(ms: number): string {
  if (!Number.isFinite(ms)) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}
