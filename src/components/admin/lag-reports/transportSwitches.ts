import { TransportSwitchData } from "@/store/admin/lagReports/types";

/**
 * The shape a player's transport switches arrive in. Reports written before the field
 * existed, older backends and older flo clients all come back without it, so the array is
 * read as possibly absent no matter how the wire type reads.
 */
export interface TransportSwitchSource {
  diagnostics?: { transportSwitches?: TransportSwitchData[] | null } | null;
}

/** A player's switches in the order the client recorded them. */
export function playerTransportSwitches(player: TransportSwitchSource): TransportSwitchData[] {
  return player.diagnostics?.transportSwitches ?? [];
}

// `reason` is a plain string on purpose (a newer client may add one), so anything not
// listed here is shown verbatim.
const REASON_LABELS: Record<string, string> = {
  failover: "path lost",
  degraded: "QUIC too slow",
  upgrade: "QUIC works again",
  reconnect: "reconnect",
};

export function transportSwitchReasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? reason;
}

/** "QUIC → TCP". */
export function transportSwitchLabel(s: Pick<TransportSwitchData, "from" | "to">): string {
  return `${s.from} → ${s.to}`;
}

/**
 * Chip colour: a move back to QUIC is the system recovering, a move away from it (or a
 * reconnect) is the trouble the report is about.
 */
export function transportSwitchColor(s: Pick<TransportSwitchData, "to" | "reason">): string {
  if (s.to === "QUIC" && s.reason === "upgrade") return "success";
  if (s.reason === "reconnect") return "error";
  return "warning";
}

/** The chart's colour set has no green, so a move back to QUIC is drawn as info there. */
export function transportSwitchSemantic(s: Pick<TransportSwitchData, "to" | "reason">): "warning" | "info" | "error" {
  const color = transportSwitchColor(s);
  return color === "success" ? "info" : color === "error" ? "error" : "warning";
}

export interface TransportSwitchCountSource {
  transportSwitchCount?: number;
}

/**
 * How many switches to advertise for a player in the list view, or null for none. Null
 * covers both a backend that does not send the field yet and a player who never switched.
 */
export function transportSwitchIndicatorCount(player: TransportSwitchCountSource): number | null {
  const count = player.transportSwitchCount;
  return typeof count === "number" && Number.isFinite(count) && count > 0 ? count : null;
}
