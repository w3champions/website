import type { RelayChain, RelayCloseLine, RelayConnection, RelayLeg, RelaySeries } from "@/store/admin/lagReports/types";
import { type SeriesStats, seriesStats, sliceSeries } from "./relaySeries";

// Mirrors CLIENT_LABEL in flo's crates/controller/src/node/relay_walk/mod.rs.
export const CLIENT_LABEL = "client";

const STATUS_TEXT: Record<string, string> = {
  measured: "Measured",
  one_sided: "Measured at one end only: HAProxy's close line for this connection never arrived",
  pending_close: "Still open when fetched; completed at match end",
  unmeasured_no_flo_node: "Not measured: this relay runs HAProxy without flo-node",
  unmeasured_quic_relay: "Not measured: relays forward QUIC in the kernel, so hops before the last relay can't be traced",
  unmeasured_port_rewritten: "Not measured: NAT rewrote the source port, so the hop could not be matched",
  node_too_old: "Not measured: the node's flo-node predates relay telemetry",
  expired: "Not measured: the node no longer holds this data (report too late, or the node restarted)",
  node_unavailable: "Not measured: the node did not answer",
  hop_limit: "Not measured: the relay chain is longer than the walk follows",
};

const ROLE_TEXT: Record<string, string> = {
  client: "client socket",
  haproxy_fe: "HAProxy frontend",
  haproxy_be: "HAProxy backend",
  node_player: "flo-node",
  node_quic: "flo-node (QUIC)",
};

// Below this, an srtt jump is ordinary jitter rather than a fault worth naming.
export const WORST_LEG_MIN_JUMP_MS = 100;

const MEASURABLE_STATUSES = new Set(["measured", "one_sided", "pending_close"]);

export type LegEnd = "near" | "far";

export interface LegEndSummary {
  end: LegEnd;
  role: string;
  kind: string;
  stats: SeriesStats;
}

export interface LegSummary {
  connectionIndex: number;
  legIndex: number;
  fromLabel: string;
  toLabel: string;
  label: string;
  status: string;
  statusText: string;
  /** False for unmeasured statuses and for legs without a single bucket of data. */
  measurable: boolean;
  ends: LegEndSummary[];
  close: RelayCloseLine | null;
  stallSecs: number;
  /** Null when no end reports retransmits (QUIC); otherwise the sum of what was reported. */
  retransmits: number | null;
  srttJumpMs: number;
}

export function legLabel(leg: Pick<RelayLeg, "fromLabel" | "toLabel">): string {
  return `${leg.fromLabel} → ${leg.toLabel}`;
}

export function legChainLabel(legs: Pick<RelayLeg, "fromLabel" | "toLabel">[]): string {
  if (!legs.length) return "";
  let label = legLabel(legs[0]);
  for (let i = 1; i < legs.length; i++) {
    if (legs[i].fromLabel !== legs[i - 1].toLabel) label += ` ⋯ ${legs[i].fromLabel}`;
    label += ` → ${legs[i].toLabel}`;
  }
  return label;
}

export function legStatusText(status: string): string {
  return STATUS_TEXT[status] ?? `Unknown status: ${status}`;
}

export function roleText(role: string): string {
  return ROLE_TEXT[role] ?? role;
}

export function isMeasurableStatus(status: string): boolean {
  return MEASURABLE_STATUSES.has(status);
}

/** The player's relay connections in connect order; empty for reports without relay telemetry. */
export function relayConnections(player: { relayChain?: RelayChain | null }): RelayConnection[] {
  const connections = player.relayChain?.connections ?? [];
  return [...connections].sort((a, b) => a.connectedUnixMs - b.connectedUnixMs);
}

/**
 * Nodes never measure the client's own socket, so the first leg's client end comes from the
 * client's match telemetry. That series spans the whole game; each connection gets the part
 * between its own connect and the next connection's.
 */
export function withClientEnd(connections: RelayConnection[], client: RelaySeries | null): RelayConnection[] {
  if (!client) return connections;
  return connections.map((connection, ci) => {
    const [first, ...rest] = connection.legs;
    if (!first || first.near || first.fromLabel !== CLIENT_LABEL) return connection;
    const until = connections[ci + 1]?.connectedUnixMs ?? Infinity;
    const near = sliceSeries(client, connection.connectedUnixMs, until);
    return { ...connection, legs: [{ ...first, near }, ...rest] };
  });
}

/** The transports this series' own buckets used; a client slice may differ from the game-wide kind. */
function seriesTransport(series: RelaySeries): string {
  const kinds = [...new Set((series.kinds ?? []).map((k) => k.toLowerCase()))];
  return kinds.length ? kinds.join("+") : series.kind;
}

function endSummary(end: LegEnd, series: RelaySeries | null): LegEndSummary | null {
  if (!series) return null;
  return { end, role: series.role, kind: seriesTransport(series), stats: seriesStats(series) };
}

/**
 * Whether an end's data is shown. The client measures its own socket, so its end stays valid
 * when the relay side of the leg could not be measured; relay data on such a leg is not trusted.
 */
export function showsEnd(status: string, role: string): boolean {
  return isMeasurableStatus(status) || role === CLIENT_LABEL;
}

/** The ends of a leg that the chart and the hop table show. */
export function displayedEnds(summary: LegSummary): LegEndSummary[] {
  return summary.ends.filter((e) => e.stats.bucketsWithData > 0 && showsEnd(summary.status, e.role));
}

function sumReported(values: (number | null)[]): number | null {
  const reported = values.filter((v): v is number => v != null);
  return reported.length ? reported.reduce((a, b) => a + b, 0) : null;
}

function maxOf(ends: LegEndSummary[], pick: (s: SeriesStats) => number | null): number {
  return Math.max(0, ...ends.map((e) => pick(e.stats) ?? 0));
}

function summarizeLeg(leg: RelayLeg, connectionIndex: number, legIndex: number): LegSummary {
  const ends = [endSummary("near", leg.near), endSummary("far", leg.far)].filter((e): e is LegEndSummary => e !== null);
  const hasData = ends.some((e) => e.stats.bucketsWithData > 0);
  // Both ends watch the same TCP connection, so adding them would count one stall twice.
  return {
    connectionIndex,
    legIndex,
    fromLabel: leg.fromLabel,
    toLabel: leg.toLabel,
    label: legLabel(leg),
    status: leg.status,
    statusText: legStatusText(leg.status),
    measurable: isMeasurableStatus(leg.status) && hasData,
    ends,
    close: leg.close,
    stallSecs: maxOf(ends, (s) => s.stallSecsTotal),
    // Each end counts only what it retransmitted itself, i.e. its own sending direction.
    retransmits: sumReported(ends.map((e) => e.stats.retransTotal)),
    srttJumpMs: maxOf(ends, (s) => s.srttJumpMs),
  };
}

export function summarizeLegs(connections: RelayConnection[]): LegSummary[] {
  return connections.flatMap((c, ci) => c.legs.map((leg, li) => summarizeLeg(leg, ci, li)));
}

function isSuspect(s: LegSummary): boolean {
  return s.stallSecs > 0 || (s.retransmits ?? 0) > 0 || s.srttJumpMs >= WORST_LEG_MIN_JUMP_MS;
}

/**
 * Index of the worst measured leg: most stall seconds, then retransmits, then srtt jump.
 * Null when no leg was measured or every measured leg was clean.
 */
export function selectWorstLeg(summaries: LegSummary[]): number | null {
  let worst: number | null = null;
  summaries.forEach((s, i) => {
    if (!s.measurable || !isSuspect(s)) return;
    if (worst === null) {
      worst = i;
      return;
    }
    const w = summaries[worst];
    // Unreported retransmits rank as none: a QUIC leg can still be named on stalls or srtt.
    const diff = s.stallSecs - w.stallSecs || (s.retransmits ?? 0) - (w.retransmits ?? 0) || s.srttJumpMs - w.srttJumpMs;
    if (diff > 0) worst = i;
  });
  return worst;
}

/** The ranking inputs behind a worst-leg verdict, so a reader can check why it was named. */
export function describeWorstLeg(leg: LegSummary): string {
  const retransmits = leg.retransmits == null ? "retransmits not reported" : `${leg.retransmits} retransmits`;
  return `${leg.label}: ${leg.stallSecs} s stalled, ${retransmits}, srtt peaked ${leg.srttJumpMs} ms over its p10`;
}
