import { isoToUtcInput, utcInputToIso } from "@/helpers/utc-dates";
import type { UserVisibleBanReason } from "@/store/admin/types";
import type { EGameMode } from "@/store/types";
import { DAY_MS } from "./dates";
import type { BanEnd, OverlapDraft } from "./inEffect";
import { machineIdsChanged, pickerProblem, type PickerState } from "./machinePicker";
import { key, type Translate } from "./translate";
import type { BanView, CreateBanRequest, EditBanRequest } from "./types";

export const DURATION_DAYS = [1, 2, 3, 5, 7, 14, 30] as const;
export type DurationChoice = (typeof DURATION_DAYS)[number] | "permanent" | "custom";
export const REASON_MAX = 2000;
export const NOTE_MAX = 500;
export type BanKind = "regular" | "machine";

export interface BanDraft {
  kind: BanKind;
  /** No default: null until chosen. */
  scope: "all" | "modes" | null;
  gameModes: readonly EGameMode[];
  /** Add only; no default. */
  duration: DurationChoice | null;
  /** UTC "YYYY-MM-DDTHH:mm": the custom date in Add, the end field in Edit. */
  endInput: string;
  /** Edit only: the Permanent tick box. */
  permanent: boolean;
  banReason: string;
  freeText: string;
  /** "" = none. */
  translationId: string;
}
export type BanFormProblem =
  | "player_missing"
  | "scope_missing"
  | "modes_empty"
  | "end_missing"
  | "end_invalid"
  | "end_past"
  | "reason_missing"
  | "reason_too_long"
  | "shown_both"
  | "machine_none_selected";

export function emptyDraft(): BanDraft {
  return { kind: "regular", scope: null, gameModes: [], duration: null, endInput: "", permanent: false, banReason: "", freeText: "", translationId: "" };
}

export function draftFromBan(ban: BanView): BanDraft {
  return {
    kind: ban.machine ? "machine" : "regular",
    scope: ban.gameModes.length === 0 ? "all" : "modes",
    gameModes: [...ban.gameModes],
    duration: null,
    endInput: isoToUtcInput(ban.endDate),
    permanent: ban.endDate === null,
    banReason: ban.banReason,
    freeText: ban.userVisibleBanReason?.freeText ?? "",
    translationId: ban.userVisibleBanReason?.translationId ?? "",
  };
}

/** "Ban again": kind regular, scope/modes/reasons copied, duration null. */
export function againDraft(ban: BanView): BanDraft {
  return { ...draftFromBan(ban), kind: "regular", endInput: "", permanent: false };
}

export function withKind(draft: BanDraft, kind: BanKind): BanDraft {
  if (draft.kind === kind) return draft;
  return { ...draft, kind, scope: kind === "machine" ? "all" : null, gameModes: [] };
}

function parseInput(endInput: string): BanEnd | "missing" | "invalid" {
  if (endInput.trim() === "") return "missing";
  const endDate = utcInputToIso(endInput);
  return endDate === null ? "invalid" : { permanent: false, endDate };
}

export function draftEnd(draft: BanDraft, mode: "add" | "edit", now: Date): BanEnd | "missing" | "invalid" {
  if (mode === "edit") return editEnd(draft);
  const { duration } = draft;
  if (duration === null) return "missing";
  if (duration === "permanent") return { permanent: true };
  if (duration === "custom") return parseInput(draft.endInput);
  return { permanent: false, endDate: new Date(now.getTime() + duration * DAY_MS).toISOString() };
}

function endProblem(draft: BanDraft, mode: "add" | "edit", now: Date): BanFormProblem | null {
  const end = draftEnd(draft, mode, now);
  if (end === "missing") return "end_missing";
  if (end === "invalid") return "end_invalid";
  if (!end.permanent && new Date(end.endDate).getTime() <= now.getTime()) return "end_past";
  return null;
}

function reasonProblem(banReason: string): BanFormProblem | null {
  const length = banReason.trim().length;
  if (length === 0) return "reason_missing";
  return length > REASON_MAX ? "reason_too_long" : null;
}

const shownBoth = (draft: BanDraft): boolean => draft.freeText.trim() !== "" && draft.translationId !== "";

function machineProblem(picker: PickerState | null): BanFormProblem | null {
  return picker === null || pickerProblem(picker) !== null ? "machine_none_selected" : null;
}

function scopeProblem(draft: BanDraft): BanFormProblem | null {
  if (draft.scope === null) return "scope_missing";
  return draft.scope === "modes" && draft.gameModes.length === 0 ? "modes_empty" : null;
}

const present = (problems: (BanFormProblem | null)[]): BanFormProblem[] => problems.filter((problem): problem is BanFormProblem => problem !== null);

export function addProblems(draft: BanDraft, ctx: { accountKey: string | null; now: Date; picker: PickerState | null }): BanFormProblem[] {
  return present([
    ctx.accountKey === null ? "player_missing" : null,
    draft.kind === "regular" ? scopeProblem(draft) : null,
    endProblem(draft, "add", ctx.now),
    reasonProblem(draft.banReason),
    shownBoth(draft) ? "shown_both" : null,
    draft.kind === "machine" ? machineProblem(ctx.picker) : null,
  ]);
}

/** The end an Edit form states: Permanent, or the end field's parsed instant. Needs no `now`. */
function editEnd(draft: BanDraft): BanEnd | "missing" | "invalid" {
  return draft.permanent ? { permanent: true } : parseInput(draft.endInput);
}

/** Compares the effective end, so text left in the end field behind a ticked Permanent is no change. */
function endChanged(draft: BanDraft, ban: BanView): boolean {
  const end = editEnd(draft);
  if (typeof end === "string") return true;
  if (end.permanent || ban.endDate === null) return end.permanent !== (ban.endDate === null);
  // The form shows minutes: an end the moderator did not touch is the same end, whatever seconds the ban has.
  return isoToUtcInput(end.endDate) !== isoToUtcInput(ban.endDate);
}

const reasonChanged = (draft: BanDraft, ban: BanView): boolean => draft.banReason.trim() !== ban.banReason.trim();

export function editProblems(draft: BanDraft, ban: BanView, ctx: { now: Date; picker: PickerState | null }): BanFormProblem[] {
  return present([
    scopeProblem(draft),
    endChanged(draft, ban) ? endProblem(draft, "edit", ctx.now) : null,
    reasonChanged(draft, ban) ? reasonProblem(draft.banReason) : null,
    shownBoth(draft) ? "shown_both" : null,
    ban.machine && ctx.picker ? machineProblem(ctx.picker) : null,
  ]);
}

/** The reason shown to the player, as the draft has it (free text wins if both are filled; that is a form problem). */
function shownOfDraft(draft: BanDraft): UserVisibleBanReason | null {
  const freeText = draft.freeText.trim();
  if (freeText !== "") return { freeText };
  return draft.translationId !== "" ? { translationId: draft.translationId } : null;
}

function shownOfBan(ban: BanView): UserVisibleBanReason | null {
  const reason = ban.userVisibleBanReason;
  if (reason?.freeText) return { freeText: reason.freeText.trim() };
  return reason?.translationId ? { translationId: reason.translationId } : null;
}

function sameShown(a: UserVisibleBanReason | null, b: UserVisibleBanReason | null): boolean {
  return (a?.freeText ?? null) === (b?.freeText ?? null) && (a?.translationId ?? null) === (b?.translationId ?? null);
}

function sameModeSet(a: readonly EGameMode[], b: readonly EGameMode[]): boolean {
  const left = new Set(a);
  return left.size === new Set(b).size && b.every((mode) => left.has(mode));
}

export function toCreateRequest(draft: BanDraft, ctx: { accountKey: string; now: Date; picker: PickerState | null }): CreateBanRequest {
  const end = draftEnd(draft, "add", ctx.now);
  if (typeof end === "string") throw new Error(`the ban has no valid end (${end}); validate with addProblems first`);
  const allModes = draft.kind === "machine" || draft.scope === "all";
  const shown = shownOfDraft(draft);
  return {
    accountKey: ctx.accountKey,
    type: draft.kind,
    allGameModes: allModes,
    gameModes: allModes ? [] : [...draft.gameModes],
    permanent: end.permanent,
    endDate: end.permanent ? null : end.endDate,
    banReason: draft.banReason.trim(),
    ...(shown ? { userVisibleBanReason: shown } : {}),
    ...(draft.kind === "machine" ? { machineIds: [...(ctx.picker?.ticked ?? [])] } : {}),
  };
}

/** null: nothing changed (Save stays disabled). */
export function toEditRequest(draft: BanDraft, ban: BanView, picker: PickerState | null): EditBanRequest | null {
  const request: EditBanRequest = { version: ban.version };
  if (draft.scope !== null) {
    const modes = draft.scope === "all" ? [] : draft.gameModes;
    if (!sameModeSet(modes, ban.gameModes)) {
      request.allGameModes = draft.scope === "all";
      request.gameModes = [...modes];
    }
  }
  if (endChanged(draft, ban)) {
    const end = editEnd(draft);
    if (typeof end !== "string") {
      request.permanent = end.permanent;
      request.endDate = end.permanent ? null : end.endDate;
    }
  }
  if (reasonChanged(draft, ban)) request.banReason = draft.banReason.trim();
  const shown = shownOfDraft(draft);
  if (!sameShown(shown, shownOfBan(ban))) request.userVisibleBanReason = shown;
  if (ban.machine && picker && machineIdsChanged(picker)) request.machine = { version: ban.machine.version, machineIds: [...picker.ticked] };
  return Object.keys(request).length === 1 ? null : request;
}

/** Trimmed 1..500. */
export function revokeNoteProblem(note: string): "note_missing" | "note_too_long" | null {
  const length = note.trim().length;
  if (length === 0) return "note_missing";
  return length > NOTE_MAX ? "note_too_long" : null;
}

/** The overlap notice's view of the form. */
export function overlapDraftOf(draft: BanDraft, mode: "add" | "edit", now: Date): OverlapDraft {
  const end = draftEnd(draft, mode, now);
  const allGameModes = draft.kind === "machine" || draft.scope === "all";
  return {
    kind: draft.kind,
    allGameModes,
    gameModes: draft.scope === "modes" && draft.kind === "regular" ? [...draft.gameModes] : [],
    end: typeof end === "string" ? null : end,
  };
}

/** Key "problem_" + problem. */
export function problemText(problem: BanFormProblem | "note_missing" | "note_too_long", t: Translate): string {
  return t(key(`problem_${problem}`));
}
