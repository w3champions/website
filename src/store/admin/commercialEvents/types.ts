/**
 * Admin DTOs of the commercial-events API (index plan contract C-E3), proxied
 * 1:1 by website-backend (C-E4). website-backend serializes with System.Text.Json,
 * so optional fields may arrive as null instead of absent: every optional field
 * is typed `?: T | null` and must be read with `??`.
 */
export type IsoDate = string;
export type EventKind = "show-matches" | "tournament" | "other";
/** Always the effective status (closed once endsAt has passed). */
export type EventStatus = "open" | "suspended" | "closed";
/** Only for status "open". */
export type EventPhase = "upcoming" | "active";
export type Recurrence = "once" | "weekly" | "monthly";
export type AllocationState = "upcoming" | "active" | "expired";
export type UsageWarning = "none" | "high" | "empty";
export type ManagedRole = "delegate" | "host";
export type GameOutcome = "in-progress" | "valid" | "invalid";
export type InvalidReason = "start-failed" | "no-result" | "terminated" | "no-winner";
export type InvalidFieldRule =
  | "required"
  | "too-long"
  | "invalid-enum"
  | "not-integer"
  | "out-of-range"
  | "below-used"
  | "end-before-start"
  | "too-long-duration"
  | "end-in-past"
  | "outside-allocation"
  | "start-fixed"
  | "not-acknowledged"
  | "immutable";
export type AuditAction =
  | "allocation-created"
  | "allocation-updated"
  | "allocation-ended"
  | "allocation-deleted"
  | "member-added"
  | "member-removed"
  | "event-created"
  | "event-updated"
  | "event-moved"
  | "event-closed"
  | "event-suspended"
  | "event-unsuspended"
  | "role-added"
  | "role-removed"
  | "game-terminated";

export interface RoleEntry {
  battleTag: string;
  addedBy: string;
  addedAt: IsoDate;
}

export interface PeriodUsage {
  periodId: string;
  periodStart: IsoDate;
  /** Next period start or the allocation's endsAt, whichever is earlier. */
  periodEnd: IsoDate;
  /** The allocation's current gamesPerPeriod (not stored per period). */
  size: number;
  consumed: number;
  held: number;
  invalid: number;
  /** consumed + held */
  used: number;
  available: number;
  warning: UsageWarning;
}

export interface Allocation {
  id: string;
  name: string;
  gamesPerPeriod: number;
  recurrence: Recurrence;
  startsAt: IsoDate;
  endsAt: IsoDate;
  allowEventCreation: boolean;
  adminNote?: string | null;
  state: AllocationState;
  /** Ordered by addedAt ascending. */
  members: RoleEntry[];
  /** Upcoming: first period; active: current; expired: null. */
  currentPeriod?: PeriodUsage | null;
  resetsAt?: IsoDate | null;
  createdBy: string;
  createdAt: IsoDate;
  updatedBy: string;
  updatedAt: IsoDate;
}

export interface AdminEvent {
  id: string;
  name: string;
  kind: EventKind;
  prizePoolUsd: number;
  startsAt: IsoDate;
  endsAt: IsoDate;
  maxGames: number;
  allocationId: string;
  allocationName: string;
  status: EventStatus;
  phase?: EventPhase | null;
  consumed: number;
  held: number;
  invalid: number;
  /** Present whenever stored (kept on a closed event that was suspended). */
  suspensionMessage?: string | null;
  adminNote?: string | null;
  createdBy: string;
  createdVia: "admin" | "launcher";
  createdAt: IsoDate;
  updatedBy: string;
  updatedAt: IsoDate;
  /** "system" for automatic closes at endsAt. */
  closedBy?: string | null;
  closedAt?: IsoDate | null;
  suspendedBy?: string | null;
  suspendedAt?: IsoDate | null;
}

export interface EventPeople {
  /** Members of the event's current allocation, ordered by addedAt. */
  organizers: string[];
  delegates: RoleEntry[];
  hosts: RoleEntry[];
}

export type AdminEventDetail = AdminEvent & EventPeople;

export interface EventGameTeam {
  /** Humans in player slots of this team. */
  playerCount: number;
  /** Empty only when names are hidden (never for admins). */
  players: Array<{ battleTag: string; won: boolean }>;
}

export interface EventGame {
  matchId: string;
  lobbyName: string;
  startedAt: IsoDate;
  outcome: GameOutcome;
  invalidReason?: InvalidReason | null;
  /** Present when the match finished. */
  lengthSeconds?: number | null;
  namesHidden: boolean;
  /** null when names are hidden; "" when the match record is missing (index P35). Both render as "—". */
  host: string | null;
  /** Ordered by team number; observers and computers excluded. */
  teams: EventGameTeam[];
  observerCount: number;
  observers: string[];
  computers: number;
  viewerCount: number;
  watchedSecondsTotal: number;
  watchedSecondsAvg: number;
}

export interface EventGamesPage {
  games: EventGame[];
  /** Absent or null on the last page. */
  nextCursor?: string | null;
}

export interface ActiveEventGame {
  matchId: string;
  eventId: string;
  eventName: string;
  host: string;
  lobbyName: string;
  startedAt: IsoDate;
  players: string[];
  observers: string[];
  viewerCount: number;
}

export interface AuditEntry {
  id: string;
  at: IsoDate;
  /** Battle tag, or "system". */
  actor: string;
  actorRole: "admin" | "organizer" | "delegate" | "system";
  action: AuditAction;
  eventId?: string | null;
  allocationId?: string | null;
  /** Updates carry { changes: { <field>: { from, to } } }. */
  details?: Record<string, unknown> | null;
}

export interface RoleHints {
  battleTag: string;
  organizerOf: Array<{ allocationId: string; allocationName: string }>;
  delegateOf: Array<{ eventId: string; eventName: string }>;
  hostOf: Array<{ eventId: string; eventName: string }>;
}

/** POST allocations body (website-backend adds actingBattleTag). */
export interface AllocationCreateRequest {
  name: string;
  gamesPerPeriod: number;
  recurrence: Recurrence;
  startsAt: IsoDate;
  endsAt: IsoDate;
  allowEventCreation: boolean;
  adminNote: string;
}

/** PUT allocations/{id} body: only the changed fields. */
export type AllocationUpdateRequest = Partial<AllocationCreateRequest>;

/** POST events body. */
export interface EventCreateRequest {
  allocationId: string;
  name: string;
  kind: EventKind;
  prizePoolUsd: number;
  startsAt: IsoDate;
  endsAt: IsoDate;
  maxGames: number;
  adminNote: string;
}

/** PUT events/{id} body: only the changed fields; moving is a separate route. */
export type EventUpdateRequest = Partial<Omit<EventCreateRequest, "allocationId">>;

/** POST events/{id}/suspend body. */
export interface SuspendRequest {
  suspensionMessage: string;
  adminNote?: string;
}

/** GET events query; empty strings are not sent. */
export interface EventFilters {
  status: EventStatus | "";
  phase: EventPhase | "";
  allocationId: string;
  q: string;
}

export function emptyEventFilters(): EventFilters {
  return { status: "", phase: "", allocationId: "", q: "" };
}

/** GET audit takes exactly one of the two. */
export type AuditScope = { eventId: string } | { allocationId: string };
