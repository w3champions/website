import { utcInputToIso } from "@/helpers/utc-dates";
import type { AssignmentStatus, Audience, ClientGeo, NetDiagMethod, RunCounters, RunDto, RunTargets } from "@/store/admin/networkDiagnostics/types";

export const DASH = "—";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;
const MS_PER_DAY = 86_400_000;

function isNumber(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value);
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function formatMs(value: number | null | undefined): string {
  return isNumber(value) ? `${value.toFixed(1)} ms` : DASH;
}

/** For values that are already percentages (`lossPct`, `lossPctMedian`). */
export function formatPercent(value: number | null | undefined): string {
  return isNumber(value) ? `${value.toFixed(1)}%` : DASH;
}

/** For 0..1 shares (`shareLossOver1Pct`, `shareUnreachable`, flo `lossRate`). */
export function formatShare(share: number | null | undefined): string {
  return isNumber(share) ? formatPercent(share * 100) : DASH;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < SECONDS_PER_MINUTE) return `${s} s`;
  const days = Math.floor(s / SECONDS_PER_DAY);
  const hours = Math.floor((s % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const minutes = Math.floor((s % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = s % SECONDS_PER_MINUTE;
  if (days > 0) return hours > 0 ? `${days} d ${hours} h` : `${days} d`;
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
}

export const METHOD_LABELS: Record<NetDiagMethod, string> = {
  IcmpTraceroute: "ICMP traceroute",
  IcmpMtr: "ICMP MTR",
  TcpTraceroute: "TCP traceroute (macOS only)",
  TcpMtr: "TCP MTR (macOS only)",
  TcpPing: "TCP ping",
  FloUdpPing: "Flo UDP ping (flo nodes only)",
};

export function audienceSummary(audience: Audience): string {
  switch (audience.kind) {
    case "Users":
      return audience.battleTags.length === 1 ? audience.battleTags[0] : plural(audience.battleTags.length, "player");
    case "SampleCount":
      return `Sample of ${audience.count} online`;
    case "SamplePercent":
      return `${audience.percent.toLocaleString("en-US", { maximumFractionDigits: 20, useGrouping: false })}% of online`;
    case "All":
      return "All online";
  }
}

export function targetsSummary(targets: RunTargets): string {
  const parts: string[] = [];
  if (targets.allFloNodes) parts.push("all nodes");
  else if (targets.floNodeIds.length > 0) parts.push(plural(targets.floNodeIds.length, "node"));
  if (targets.coreServers.length > 0) parts.push(plural(targets.coreServers.length, "core server"));
  if (targets.baselines.length > 0) parts.push(plural(targets.baselines.length, "baseline"));
  if (targets.customTargets.length > 0) parts.push(plural(targets.customTargets.length, "custom target"));
  if (targets.includeDefaultGateway) parts.push("gateway");
  return parts.length === 0 ? DASH : parts.join(" · ");
}

export function progressText(counters: RunCounters): string {
  return `${counters.delivered}/${counters.assigned} delivered · ${counters.submitted} submitted · ${counters.expired} expired`;
}

export interface CounterTile {
  label: string;
  value: number;
  color: string;
}

export function counterTiles(counters: RunCounters): CounterTile[] {
  return [
    { label: "Assigned", value: counters.assigned, color: "primary" },
    { label: "Delivered", value: counters.delivered, color: "info" },
    { label: "Submitted", value: counters.submitted, color: "success" },
    { label: "Expired", value: counters.expired, color: "warning" },
  ];
}

export type RunStatus = "Running" | "Complete" | "Cancelled" | "No participants";

export const RUN_STATUS_COLOR: Record<RunStatus, string> = {
  Running: "info",
  Complete: "success",
  Cancelled: "grey",
  "No participants": "warning",
};

export const ASSIGNMENT_STATUS_COLOR: Record<AssignmentStatus, string> = {
  Pending: "info",
  Submitted: "success",
  Expired: "grey",
};

/**
 * Derived from the counters (C6 has no status field). A fleet run is running while its
 * window is open; afterwards, and for explicit audiences, while assignments are pending.
 */
export function runStatus(run: Pick<RunDto, "cancelledAt" | "windowEnd" | "counters">, now: Date): RunStatus {
  if (run.cancelledAt != null) return "Cancelled";
  const { assigned, submitted, expired } = run.counters;
  if (run.windowEnd != null && now.getTime() < new Date(run.windowEnd).getTime()) return "Running";
  if (assigned === 0) return run.windowEnd != null ? "No participants" : "Running";
  return submitted + expired < assigned ? "Running" : "Complete";
}

function utcDayStartIso(value: string, addDays: number): string | undefined {
  const start = utcInputToIso(`${value}T00:00`);
  if (start === null) return undefined;
  return new Date(new Date(start).getTime() + addDays * MS_PER_DAY).toISOString();
}

/** `<input type="date">` values read as UTC days → `from`/`to` instants; `to` includes its whole day. */
export function utcDateRangeToIso(from: string, to: string): { from?: string; to?: string } {
  return { from: utcDayStartIso(from, 0), to: utcDayStartIso(to, 1) };
}

/** A table cell for optional server text (client IP, OS, adapter type): the text, or a dash when it is missing. */
export function textOrDash(value: string | null | undefined): string {
  return value ? value : DASH;
}

export function geoText(geo: Pick<ClientGeo, "city" | "country"> | null | undefined): string {
  const parts = [geo?.city, geo?.country].filter((part): part is string => typeof part === "string" && part !== "");
  return parts.length === 0 ? DASH : parts.join(", ");
}

export function asnText(asn: number | null | undefined, org?: string | null): string {
  if (!isNumber(asn)) return DASH;
  return org ? `AS${asn} ${org}` : `AS${asn}`;
}
