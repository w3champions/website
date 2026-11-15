import { DAY_MS, dayMonth, ymdUtc } from "./dates";
import { inEffectStatement, inEffectTableOf, type StatementFormat, statementText } from "./inEffect";
import { countText, key, type Translate } from "./translate";
import type { MachineIdAccountsResponse, MachineIdRow, MachineImpactResponse, OtherAccount } from "./types";
import { modesText } from "./wording";

export const OLDER_AFTER_DAYS = 90;

const NOTE_SEPARATOR = " · ";

/** Every function returns a new state; nothing is mutated. */
export interface PickerState {
  mode: "add" | "edit";
  rows: readonly MachineIdRow[];
  ticked: readonly string[];
  /** add: the selection of the last bulk action (open, Recommended, None); edit: the ban's IDs. */
  pinned: readonly string[];
  /** edit: the ban's IDs; add: []. */
  saved: readonly string[];
  /** edit: the ban's issuedAt; add: null. */
  bannedAt: string | null;
  showOlder: boolean;
}
export interface PickerRowView {
  row: MachineIdRow;
  ticked: boolean;
  onBan: boolean;
  willBeRemoved: boolean;
  newSinceBan: boolean;
}
export interface PickerSummary {
  selected: number;
  total: number;
  removed: number;
  added: number;
}

const recommendedIds = (rows: readonly MachineIdRow[]): string[] => rows.filter((row) => row.recommended).map((row) => row.machineId);

/** An ID of the ban that the account's list lacks, so that a save never drops it silently. */
function missingRow(machineId: string): MachineIdRow {
  return { machineId, firstUsed: null, lastUsed: null, shared: false, recommended: false, otherAccountCount: 0, otherAccountsCapped: false };
}

/** `saved` given = edit. */
export function initialPicker(rows: readonly MachineIdRow[], saved?: readonly string[], issuedAt?: string): PickerState {
  if (saved === undefined) {
    const ids = recommendedIds(rows);
    return { mode: "add", rows: [...rows], ticked: ids, pinned: ids, saved: [], bannedAt: null, showOlder: false };
  }
  const known = new Set(rows.map((row) => row.machineId));
  const extra = [...new Set(saved)].filter((id) => !known.has(id)).map(missingRow);
  const ids = [...new Set(saved)];
  return { mode: "edit", rows: [...rows, ...extra], ticked: ids, pinned: ids, saved: ids, bannedAt: issuedAt ?? null, showOlder: false };
}

export function toggleId(state: PickerState, machineId: string): PickerState {
  const ticked = state.ticked.includes(machineId) ? state.ticked.filter((id) => id !== machineId) : [...state.ticked, machineId];
  return { ...state, ticked };
}

export function selectRecommended(state: PickerState): PickerState {
  const ids = recommendedIds(state.rows);
  return state.mode === "add" ? { ...state, ticked: ids, pinned: ids } : { ...state, ticked: ids };
}

export function resetToSaved(state: PickerState): PickerState {
  return { ...state, ticked: state.mode === "edit" ? [...state.saved] : [...state.pinned] };
}

export function selectNone(state: PickerState): PickerState {
  return state.mode === "add" ? { ...state, ticked: [], pinned: [] } : { ...state, ticked: [] };
}

export function revealOlder(state: PickerState): PickerState {
  return { ...state, showOlder: true };
}

const timeOf = (iso: string | null): number | null => {
  if (iso === null) return null;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? null : time;
};

/** Latest last used first, unknown last, ties by machine ID. */
function byLastUsed(a: MachineIdRow, b: MachineIdRow): number {
  const x = timeOf(a.lastUsed);
  const y = timeOf(b.lastUsed);
  if (x !== y) {
    if (x === null) return 1;
    if (y === null) return -1;
    return y - x;
  }
  return a.machineId < b.machineId ? -1 : a.machineId > b.machineId ? 1 : 0;
}

function isOlder(row: MachineIdRow, now: Date): boolean {
  const used = timeOf(row.lastUsed);
  return used === null || now.getTime() - used >= OLDER_AFTER_DAYS * DAY_MS;
}

function isHidden(state: PickerState, row: MachineIdRow, now: Date): boolean {
  if (state.showOlder || state.ticked.includes(row.machineId) || state.pinned.includes(row.machineId)) return false;
  return isOlder(row, now);
}

function isNewSinceBan(state: PickerState, row: MachineIdRow): boolean {
  if (state.mode !== "edit" || state.saved.includes(row.machineId)) return false;
  const bannedAt = timeOf(state.bannedAt);
  const first = timeOf(row.firstUsed);
  return bannedAt !== null && first !== null && first > bannedAt;
}

function viewOf(state: PickerState, row: MachineIdRow): PickerRowView {
  const ticked = state.ticked.includes(row.machineId);
  const onBan = state.saved.includes(row.machineId);
  return { row, ticked, onBan, willBeRemoved: onBan && !ticked, newSinceBan: isNewSinceBan(state, row) };
}

/** Pinned rows first, then the rest; single ticks never reorder. */
export function visibleRows(state: PickerState, now: Date): PickerRowView[] {
  const pinned = state.rows.filter((row) => state.pinned.includes(row.machineId)).sort(byLastUsed);
  const rest = state.rows.filter((row) => !state.pinned.includes(row.machineId)).sort(byLastUsed);
  return [...pinned, ...rest].filter((row) => !isHidden(state, row, now)).map((row) => viewOf(state, row));
}

export function hiddenOlderCount(state: PickerState, now: Date): number {
  return state.rows.filter((row) => isHidden(state, row, now)).length;
}

export function pickerSummary(state: PickerState): PickerSummary {
  const ticked = new Set(state.ticked);
  const saved = new Set(state.saved);
  return {
    selected: state.ticked.length,
    total: state.rows.length,
    removed: state.saved.filter((id) => !ticked.has(id)).length,
    added: state.ticked.filter((id) => !saved.has(id)).length,
  };
}

/** Every ticked ID, in row order: the body of machineImpact. */
export function impactIds(state: PickerState): string[] {
  return state.rows.filter((row) => state.ticked.includes(row.machineId)).map((row) => row.machineId);
}

/**
 * Save waits for the impact of the ticked IDs: in Add whenever there are any, in Edit once they differ from the ban's.
 * An empty or unchanged selection has nothing new to warn about.
 */
export function impactNeeded(state: PickerState): boolean {
  const ids = impactIds(state);
  if (ids.length === 0) return false;
  if (state.mode === "add") return true;
  const saved = new Set(impactIds({ ...state, ticked: state.saved }));
  return ids.length !== saved.size || ids.some((id) => !saved.has(id));
}

/** The ticked set differs from the saved set (edit). */
export function machineIdsChanged(state: PickerState): boolean {
  if (state.mode !== "edit") return false;
  const ticked = new Set(state.ticked);
  return ticked.size !== state.saved.length || state.saved.some((id) => !ticked.has(id));
}

export function pickerProblem(state: PickerState): "machine_none_selected" | null {
  return state.ticked.length === 0 ? "machine_none_selected" : null;
}

/** "2", capped "200+". */
export function otherAccountsText(row: MachineIdRow): string {
  return row.otherAccountsCapped ? `${row.otherAccountCount}+` : String(row.otherAccountCount);
}

export function lastUsedText(row: MachineIdRow, now: Date, t: Translate): string {
  const used = timeOf(row.lastUsed);
  if (row.lastUsed === null || used === null) return t(key("picker_last_used_unknown"));
  const days = Math.max(0, Math.floor((now.getTime() - used) / DAY_MS));
  const ago = days === 0 ? t(key("picker_today")) : countText("picker_days_ago", days, t);
  return t(key("picker_last_used"), { date: ymdUtc(row.lastUsed), ago });
}

/** The notes that apply, joined " · "; "" for none. */
export function rowNote(view: PickerRowView, t: Translate): string {
  const notes: string[] = [];
  if (view.newSinceBan) notes.push(t(key("picker_new_since_ban")));
  if (view.willBeRemoved) notes.push(t(key("picker_will_be_removed")));
  if (view.row.shared) notes.push(t(key("picker_shared")));
  return notes.join(NOTE_SEPARATOR);
}

export function pickerFooterText(summary: PickerSummary, impact: MachineImpactResponse | null, mode: "add" | "edit", t: Translate): string {
  const parts = [t(key("picker_selected"), { selected: summary.selected, total: summary.total })];
  if (impact && impact.otherAccounts > 0) parts.push(countText("picker_collateral", impact.otherAccounts, t));
  if (mode === "edit" && summary.removed + summary.added > 0) parts.push(t(key("picker_changes"), { removed: summary.removed, added: summary.added }));
  return parts.join(NOTE_SEPARATOR);
}

export function machineSaveLabel(summary: PickerSummary, impact: MachineImpactResponse | null, mode: "add" | "edit", t: Translate): string {
  const label = mode === "add" ? countText("save_machine", impact ? impact.counted : summary.selected, t) : t(key("save"));
  return impact && impact.otherAccounts > 0 ? countText("save_collateral", impact.otherAccounts, t, { label }) : label;
}

/** One line per other account of a machine ID. */
export function otherAccountBanText(account: OtherAccount, f: StatementFormat): string {
  const ban = account.ban;
  if (ban === null || account.state === "neverBanned") return f.t(key("other_never_banned"));
  if (account.state === "bannedNow") {
    const statement = inEffectStatement(inEffectTableOf([ban]));
    return f.t(key("other_banned_now"), { statement: statement ? statementText(statement, f) : modesText(ban.gameModes, f.modeName, f.t) });
  }
  const status = ban.status === "revoked"
    ? f.t(key("other_status_revoked"))
    : f.t(key("other_status_ended"), { date: ban.endDate === null ? "" : dayMonth(ban.endDate, f.now) });
  return f.t(key("other_banned_before"), { modes: modesText(ban.gameModes, f.modeName, f.t), status });
}

/** null when every account is listed. */
export function otherAccountsMoreText(response: MachineIdAccountsResponse, t: Translate): string | null {
  const shown = response.accounts.length;
  if (!response.capped && shown >= response.total) return null;
  return t(key("others_first_of"), { shown, total: response.capped ? `${response.total}+` : response.total });
}
