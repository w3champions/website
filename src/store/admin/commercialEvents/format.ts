import { formatUtc } from "./dates";
import type { AdminEvent, Allocation, AllocationState, EventGame, EventGameTeam, EventKind, EventPhase, EventStatus, InvalidReason, ManagedRole, PeriodUsage, Recurrence, RoleEntry } from "./types";

/** Admin terms follow spec §14 (English only). */
export const RECURRENCE_OPTIONS: { title: string; value: Recurrence }[] = [
  { title: "One-time", value: "once" },
  { title: "Weekly", value: "weekly" },
  { title: "Monthly", value: "monthly" },
];

export const KIND_OPTIONS: { title: string; value: EventKind }[] = [
  { title: "Show matches", value: "show-matches" },
  { title: "Tournament", value: "tournament" },
  { title: "Other", value: "other" },
];

export const ROLE_OPTIONS: { title: string; value: ManagedRole }[] = [
  { title: "Delegate", value: "delegate" },
  { title: "Authorized host", value: "host" },
];

export const STATUS_FILTER_OPTIONS: { title: string; value: EventStatus | "" }[] = [
  { title: "All statuses", value: "" },
  { title: "Open", value: "open" },
  { title: "Suspended", value: "suspended" },
  { title: "Closed", value: "closed" },
];

export const PHASE_FILTER_OPTIONS: { title: string; value: EventPhase | "" }[] = [
  { title: "All phases", value: "" },
  { title: "Upcoming", value: "upcoming" },
  { title: "Active", value: "active" },
];

const STATE_OPTIONS: { title: string; value: AllocationState }[] = [
  { title: "Upcoming", value: "upcoming" },
  { title: "Active", value: "active" },
  { title: "Expired", value: "expired" },
];

const INVALID_REASONS: Record<InvalidReason, string> = {
  "start-failed": "Failed to start",
  "no-result": "No result",
  "terminated": "Terminated",
  "no-winner": "No winner",
};

function labelOf<T extends string>(options: { title: string; value: T }[], value: T): string {
  return options.find((option) => option.value === value)?.title ?? value;
}

export function recurrenceLabel(recurrence: Recurrence): string {
  return labelOf(RECURRENCE_OPTIONS, recurrence);
}

export function kindLabel(kind: EventKind): string {
  return labelOf(KIND_OPTIONS, kind);
}

export function allocationStateLabel(state: AllocationState): string {
  return labelOf(STATE_OPTIONS, state);
}

export function roleLabel(role: ManagedRole): string {
  return labelOf(ROLE_OPTIONS, role);
}

export function eventStatusLabel(event: Pick<AdminEvent, "status" | "phase">): string {
  if (event.status === "open") {
    if (event.phase === "active") return "Open · active";
    if (event.phase === "upcoming") return "Open · upcoming";
    return "Open";
  }
  return event.status === "suspended" ? "Suspended" : event.status === "closed" ? "Closed" : String(event.status);
}

/** Vuetify color for the status chip. */
export function eventStatusColor(event: Pick<AdminEvent, "status" | "phase">): string {
  if (event.status === "open") return event.phase === "active" ? "success" : "info";
  return event.status === "suspended" ? "warning" : "grey";
}

/**
 * The suspension banner text, or null. Only a suspended event shows it: a closed
 * event keeps the suspension fields it had, and showing them would present a past
 * suspension as the current state (the audit log keeps the history).
 */
export function suspensionNotice(event: Pick<AdminEvent, "status" | "suspensionMessage" | "suspendedBy" | "suspendedAt">): string | null {
  if (event.status !== "suspended" || !event.suspensionMessage) return null;
  return `Suspended by ${event.suspendedBy ?? "an admin"} on ${formatUtc(event.suspendedAt)}: ${event.suspensionMessage}`;
}

export function outcomeLabel(game: Pick<EventGame, "outcome" | "invalidReason">): string {
  if (game.outcome === "in-progress") return "In progress";
  if (game.outcome === "valid") return "Counted";
  const reason = game.invalidReason ? INVALID_REASONS[game.invalidReason] ?? game.invalidReason : null;
  return reason === null ? "Not counted" : `Not counted: ${reason}`;
}

/** "used / size (held in progress)" of an allocation period. */
export function periodUsageLabel(period: PeriodUsage | null | undefined): string {
  return period ? `${period.used} / ${period.size} (${period.held} in progress)` : "—";
}

export function periodRangeLabel(period: Pick<PeriodUsage, "periodStart" | "periodEnd">): string {
  return `${formatUtc(period.periodStart)} – ${formatUtc(period.periodEnd)}`;
}

/** Used (consumed + held) against the event's game limit. */
export function eventUsedLabel(event: Pick<AdminEvent, "consumed" | "held" | "maxGames">): string {
  return `${event.consumed + event.held} / ${event.maxGames}`;
}

export function formatPrizePool(usd: number): string {
  return `US$${usd.toLocaleString("en-US")}`;
}

/** Watch time with the two largest units: "45s", "12m 5s", "2h 3m". */
export function formatWatchTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${rest}s`;
  return `${rest}s`;
}

/** One line per team: its players, the winning team marked. */
export function teamLines(teams: EventGameTeam[]): string[] {
  return teams.map((team) => {
    if (team.players.length === 0) return `${team.playerCount} players (names hidden)`;
    const names = team.players.map((player) => player.battleTag).join(", ");
    return team.players.some((player) => player.won) ? `${names} (winner)` : names;
  });
}

/** Up to `max` member tags, then "+n". */
export function memberSummary(members: RoleEntry[], max = 3): string {
  if (members.length === 0) return "—";
  const shown = members.slice(0, max).map((member) => member.battleTag).join(", ");
  return members.length > max ? `${shown} +${members.length - max}` : shown;
}

export function allocationOptionLabel(allocation: Pick<Allocation, "name" | "state">): string {
  return `${allocation.name} (${allocationStateLabel(allocation.state)})`;
}

/** "event-created" → "Event created". */
export function auditActionLabel(action: string): string {
  const words = action.split("-").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Full ISO-8601 instants as the server writes them (`2026-11-01T18:00:00Z`, with or without fractional seconds). */
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function show(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value !== "string") return JSON.stringify(value);
  // An ISO-looking string that doesn't parse (formatUtc gives "—") stays as written.
  const date = ISO_INSTANT.test(value) ? formatUtc(value) : "—";
  return date === "—" ? value : date;
}

/** Audit details in one line: `field: from → to` for updates, `key: value` otherwise; ISO dates shown via formatUtc. */
export function auditDetailsSummary(details: Record<string, unknown> | null | undefined): string {
  if (!details) return "";
  const changes = details.changes;
  if (typeof changes === "object" && changes !== null) {
    return Object.entries(changes as Record<string, unknown>)
      .map(([field, change]) => {
        const { from, to } = (change ?? {}) as { from?: unknown; to?: unknown };
        return `${field}: ${show(from)} → ${show(to)}`;
      })
      .join("; ");
  }
  return Object.entries(details).map(([key, value]) => `${key}: ${show(value)}`).join("; ");
}
