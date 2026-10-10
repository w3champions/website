import { isoToUtcInput, utcInputToIso, utcNextHourInput } from "./dates";
import type { AdminEvent, EventCreateRequest, EventKind, EventPeople, EventUpdateRequest, SuspendRequest } from "./types";
import { adminNoteProblem, dateRangeProblem, nameProblem, requireIso, requireWholeNumber, wholeNumberProblem } from "./validation";

export const EVENT_NAME_MAX_LENGTH = 32;
export const PRIZE_POOL_MAX_USD = 10000000;
export const MAX_GAMES_MAX = 10000;
export const SUSPENSION_MESSAGE_MAX_LENGTH = 500;

const KINDS: EventKind[] = ["show-matches", "tournament", "other"];

/** Form state of the event dialog; dates are UTC form values ("YYYY-MM-DDTHH:mm"). */
export interface EventDraft {
  allocationId: string;
  name: string;
  kind: EventKind;
  prizePoolUsd: string;
  startsAt: string;
  endsAt: string;
  maxGames: string;
  adminNote: string;
}

/** A tournament from the next full UTC hour for 7 days; the game limit must be entered. */
export function emptyEventDraft(now: Date, allocationId = ""): EventDraft {
  return {
    allocationId,
    name: "",
    kind: "tournament",
    prizePoolUsd: "0",
    startsAt: utcNextHourInput(now),
    endsAt: utcNextHourInput(now, 24 * 7),
    maxGames: "",
    adminNote: "",
  };
}

export function draftFromEvent(event: AdminEvent): EventDraft {
  return {
    allocationId: event.allocationId,
    name: event.name,
    kind: event.kind,
    prizePoolUsd: String(event.prizePoolUsd),
    startsAt: isoToUtcInput(event.startsAt),
    endsAt: isoToUtcInput(event.endsAt),
    maxGames: String(event.maxGames),
    adminNote: event.adminNote ?? "",
  };
}

/**
 * First problem under the admin rules (spec §6.1, C-E3), in C-E2 field order, or null.
 * Admins are exempt from every date rule except endsAt > startsAt. `used` is the
 * stored event's consumed + held (0 when creating): the game limit may not go below it.
 */
export function validateEventDraft(draft: EventDraft, used = 0): string | null {
  if (draft.allocationId === "") return "Allocation: Choose an allocation.";
  const name = nameProblem(draft.name, EVENT_NAME_MAX_LENGTH);
  if (name !== null) return `Name: ${name}`;
  if (!KINDS.includes(draft.kind)) return "Type: Choose one of the options.";
  const prize = wholeNumberProblem(draft.prizePoolUsd, 0, PRIZE_POOL_MAX_USD, "Enter an amount from 0 to 10,000,000.");
  if (prize !== null) return `Prize pool: ${prize}`;
  const dates = dateRangeProblem(draft.startsAt, draft.endsAt);
  if (dates !== null) return dates;
  const games = wholeNumberProblem(draft.maxGames, 1, MAX_GAMES_MAX, "Enter a number from 1 to 10,000.");
  if (games !== null) return `Game limit: ${games}`;
  if (requireWholeNumber(draft.maxGames) < used) {
    return `Game limit: The game limit can't be lower than the games already used or in progress (${used}).`;
  }
  return adminNoteProblem(draft.adminNote);
}

export function toEventCreateRequest(draft: EventDraft): EventCreateRequest {
  return {
    allocationId: draft.allocationId,
    name: draft.name.trim(),
    kind: draft.kind,
    prizePoolUsd: requireWholeNumber(draft.prizePoolUsd),
    startsAt: requireIso(draft.startsAt),
    endsAt: requireIso(draft.endsAt),
    maxGames: requireWholeNumber(draft.maxGames),
    adminNote: draft.adminNote,
  };
}

/** Only the changed fields (dates at minute precision); the allocation changes only through Move. */
export function toEventUpdateRequest(draft: EventDraft, original: AdminEvent): EventUpdateRequest {
  const request: EventUpdateRequest = {};
  const name = draft.name.trim();
  if (name !== original.name) request.name = name;
  if (draft.kind !== original.kind) request.kind = draft.kind;
  const prize = requireWholeNumber(draft.prizePoolUsd);
  if (prize !== original.prizePoolUsd) request.prizePoolUsd = prize;
  if (draft.startsAt !== isoToUtcInput(original.startsAt)) request.startsAt = requireIso(draft.startsAt);
  if (draft.endsAt !== isoToUtcInput(original.endsAt)) request.endsAt = requireIso(draft.endsAt);
  const maxGames = requireWholeNumber(draft.maxGames);
  if (maxGames !== original.maxGames) request.maxGames = maxGames;
  if (draft.adminNote !== (original.adminNote ?? "")) request.adminNote = draft.adminNote;
  return request;
}

/** C-E3: an admin endsAt at or before now closes the event at once. */
export function closesImmediately(draft: Pick<EventDraft, "endsAt">, now: Date): boolean {
  const end = utcInputToIso(draft.endsAt);
  return end !== null && new Date(end).getTime() <= now.getTime();
}

export interface SuspendDraft {
  /** Shown to every role holder of the event. */
  suspensionMessage: string;
  /** Admins only; replaces the event's admin note when changed. */
  adminNote: string;
}

export function suspendDraftFor(event: AdminEvent): SuspendDraft {
  return { suspensionMessage: "", adminNote: event.adminNote ?? "" };
}

export function validateSuspendDraft(draft: SuspendDraft): string | null {
  const message = draft.suspensionMessage.trim();
  if (message === "") return "Message: Enter a message.";
  if (message.length > SUSPENSION_MESSAGE_MAX_LENGTH) return `Message: Use at most ${SUSPENSION_MESSAGE_MAX_LENGTH} characters.`;
  return adminNoteProblem(draft.adminNote);
}

export function toSuspendRequest(draft: SuspendDraft, original: AdminEvent): SuspendRequest {
  const request: SuspendRequest = { suspensionMessage: draft.suspensionMessage.trim() };
  if (draft.adminNote !== (original.adminNote ?? "")) request.adminNote = draft.adminNote;
  return request;
}

export interface EventActions {
  edit: boolean;
  move: boolean;
  close: boolean;
  suspend: boolean;
  lift: boolean;
  managePeople: boolean;
}

/** Admin actions per effective status (spec §6.4): closed is final for everyone. */
export function eventActions(event: Pick<AdminEvent, "status">): EventActions {
  const writable = event.status === "open" || event.status === "suspended";
  return {
    edit: writable,
    move: writable,
    close: writable,
    suspend: event.status === "open",
    lift: event.status === "suspended",
    managePeople: writable,
  };
}

/** Admins may move an event to any other allocation (spec §6.3). */
export function moveTargets<T extends { id: string }>(allocations: T[], currentAllocationId: string): T[] {
  return allocations.filter((allocation) => allocation.id !== currentAllocationId);
}

/** Problem with adding a delegate or authorized host, or null: one role per account per event, exact tags. */
export function personProblem(people: Pick<EventPeople, "delegates" | "hosts">, battleTag: string): string | null {
  if (battleTag === "") return "Select a player.";
  if (people.delegates.some((entry) => entry.battleTag === battleTag)) return `${battleTag} is already a delegate. Remove that role first.`;
  if (people.hosts.some((entry) => entry.battleTag === battleTag)) return `${battleTag} is already an authorized host. Remove that role first.`;
  return null;
}
