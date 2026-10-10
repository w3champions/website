import { computed, type ComputedRef } from "vue";
import { isoToUtcInput, utcDayStartInput } from "./dates";
import type { Allocation, AllocationCreateRequest, AllocationUpdateRequest, Recurrence, RoleEntry } from "./types";
import { adminNoteProblem, dateRangeProblem, nameProblem, requireIso, requireWholeNumber, wholeNumberProblem } from "./validation";

export const ALLOCATION_NAME_MAX_LENGTH = 60;
export const GAMES_PER_PERIOD_MAX = 100000;

/** Form state of the allocation dialog; dates are UTC form values ("YYYY-MM-DDTHH:mm"). */
export interface AllocationDraft {
  name: string;
  gamesPerPeriod: string;
  recurrence: Recurrence;
  startsAt: string;
  endsAt: string;
  allowEventCreation: boolean;
  adminNote: string;
}

/** Weekly, from tomorrow 00:00 UTC for 30 days, without event creation. */
export function emptyAllocationDraft(now: Date): AllocationDraft {
  return {
    name: "",
    gamesPerPeriod: "",
    recurrence: "weekly",
    startsAt: utcDayStartInput(now, 1),
    endsAt: utcDayStartInput(now, 31),
    allowEventCreation: false,
    adminNote: "",
  };
}

export function draftFromAllocation(allocation: Allocation): AllocationDraft {
  return {
    name: allocation.name,
    gamesPerPeriod: String(allocation.gamesPerPeriod),
    recurrence: allocation.recurrence,
    startsAt: isoToUtcInput(allocation.startsAt),
    endsAt: isoToUtcInput(allocation.endsAt),
    allowEventCreation: allocation.allowEventCreation,
    adminNote: allocation.adminNote ?? "",
  };
}

/** Start and recurrence are immutable once startsAt has passed (spec §4.2). */
export function isAllocationStarted(allocation: Pick<Allocation, "startsAt">, now: Date): boolean {
  return new Date(allocation.startsAt).getTime() <= now.getTime();
}

/**
 * Start and recurrence can't change once the allocation has started, which can
 * happen while the dialog is open: puts them back to `base` and returns true when
 * the draft had changed them, so the admin is told instead of the change being
 * dropped silently.
 */
export function revertStartedFields(draft: AllocationDraft, base: Allocation, now: Date): boolean {
  if (!isAllocationStarted(base, now)) return false;
  const original = draftFromAllocation(base);
  const changed = draft.recurrence !== original.recurrence || draft.startsAt !== original.startsAt;
  draft.recurrence = original.recurrence;
  draft.startsAt = original.startsAt;
  return changed;
}

/** First problem in spec §6.1 field order, or null when the draft can be saved. */
export function validateAllocationDraft(draft: AllocationDraft): string | null {
  const name = nameProblem(draft.name, ALLOCATION_NAME_MAX_LENGTH);
  if (name !== null) return `Name: ${name}`;
  const games = wholeNumberProblem(draft.gamesPerPeriod, 1, GAMES_PER_PERIOD_MAX, "Enter a number from 1 to 100,000.");
  if (games !== null) return `Games per period: ${games}`;
  return dateRangeProblem(draft.startsAt, draft.endsAt) ?? adminNoteProblem(draft.adminNote);
}

export function toAllocationCreateRequest(draft: AllocationDraft): AllocationCreateRequest {
  return {
    name: draft.name.trim(),
    gamesPerPeriod: requireWholeNumber(draft.gamesPerPeriod),
    recurrence: draft.recurrence,
    startsAt: requireIso(draft.startsAt),
    endsAt: requireIso(draft.endsAt),
    allowEventCreation: draft.allowEventCreation,
    adminNote: draft.adminNote,
  };
}

/**
 * Only the fields the admin changed. `original` must be the allocation the draft was
 * built from, not a newer copy: a field the admin left alone then keeps whatever the
 * server holds now. Dates compare at minute precision (the form's),
 * so an endsAt with seconds (End now) is not re-sent unchanged. Start and recurrence
 * are left out once the allocation has started; the dialog locks them too.
 */
export function toAllocationUpdateRequest(draft: AllocationDraft, original: Allocation, now: Date): AllocationUpdateRequest {
  const request: AllocationUpdateRequest = {};
  const started = isAllocationStarted(original, now);
  const name = draft.name.trim();
  if (name !== original.name) request.name = name;
  const games = requireWholeNumber(draft.gamesPerPeriod);
  if (games !== original.gamesPerPeriod) request.gamesPerPeriod = games;
  if (!started && draft.recurrence !== original.recurrence) request.recurrence = draft.recurrence;
  if (!started && draft.startsAt !== isoToUtcInput(original.startsAt)) request.startsAt = requireIso(draft.startsAt);
  if (draft.endsAt !== isoToUtcInput(original.endsAt)) request.endsAt = requireIso(draft.endsAt);
  if (draft.allowEventCreation !== original.allowEventCreation) request.allowEventCreation = draft.allowEventCreation;
  if (draft.adminNote !== (original.adminNote ?? "")) request.adminNote = draft.adminNote;
  return request;
}

/** Problem with adding a member, or null. Exact comparison: battle tags are never case-folded. */
export function memberProblem(members: RoleEntry[], battleTag: string): string | null {
  if (battleTag === "") return "Select a player.";
  return members.some((member) => member.battleTag === battleTag) ? `${battleTag} is already a member.` : null;
}

/**
 * True when the current period has counters, which proves the allocation was used
 * (spec §6.5). A false result does not prove the opposite; the server decides
 * with ALLOCATION_IN_USE.
 */
export function hasRecordedUsage(allocation: Pick<Allocation, "currentPeriod">): boolean {
  const period = allocation.currentPeriod;
  return !!period && period.consumed + period.held + period.invalid > 0;
}

/**
 * The allocation the edit dialog shows: the store copy of `id()`, or, once a reload no longer lists it (deleted
 * elsewhere, or a failed load), the last copy seen, so the dialog keeps editing it instead of turning into an empty
 * create form. Null while no allocation is edited.
 */
export function editedAllocationView(id: () => string | null, find: (id: string) => Allocation | undefined): ComputedRef<Allocation | null> {
  let last: Allocation | null = null;
  return computed(() => {
    const current = id();
    if (current === null) return null;
    const found = find(current);
    if (found) last = found;
    return last?.id === current ? last : null;
  });
}
