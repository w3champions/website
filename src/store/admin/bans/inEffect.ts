import type { EGameMode } from "@/store/types";
import type { AccountView, BanSummary, BanView, InEffectEntry, InEffectTable } from "./types";
import { countText, key, type Translate } from "./translate";
import { DAY_MS, dayMonth, endsLater } from "./dates";
import { authorName } from "./tags";

export const MAX_STATEMENT_GROUPS = 4;
export const MAX_OVERLAP_BANS = 3;

/** A BanSummary of AccountView.inEffect.bans. */
export type InEffectBan = Pick<BanSummary, "banId" | "gameModes" | "endDate" | "issuedBy" | "status">;
export interface ModeGroup {
  gameModes: EGameMode[];
  endDate: string | null;
}
export interface InEffectStatement {
  global: InEffectEntry | null;
  groups: ModeGroup[];
  more: number;
}
export interface StatementFormat {
  t: Translate;
  modeName: (mode: EGameMode) => string;
  now: Date;
}
export type BanEnd = { permanent: true } | { permanent: false; endDate: string };
export interface OverlapDraft {
  kind: "regular" | "machine";
  allGameModes: boolean;
  gameModes: readonly EGameMode[];
  end: BanEnd | null;
}
/** gameModes: the overlapping modes, [] = everything. */
export interface OverlapBan {
  banId: string;
  gameModes: EGameMode[];
  endDate: string | null;
  by: string;
}
export type OverlapNotice =
  | { kind: "none" }
  | { kind: "machine"; endDate: string | null }
  | { kind: "bans"; bans: OverlapBan[]; more: number; addsNothing: boolean };
export interface OverlapText {
  heading: string;
  lines: { banId: string; text: string }[];
  more: string | null;
  footer: string | null;
}

const GROUP_SEPARATOR = " · ";
const MODE_SEPARATOR = ", ";
const REASON_SHOWN = 40;

/** Latest-ending first (permanent first), ties by ban id. */
function byEndThenId(a: InEffectBan, b: InEffectBan): number {
  if (endsLater(a.endDate, b.endDate)) return -1;
  if (endsLater(b.endDate, a.endDate)) return 1;
  return a.banId < b.banId ? -1 : a.banId > b.banId ? 1 : 0;
}

const isGlobal = (ban: Pick<InEffectBan, "gameModes">): boolean => ban.gameModes.length === 0;

/** null: nothing in effect. */
export function inEffectStatement(table: InEffectTable): InEffectStatement | null {
  const g = table.global;
  const kept = table.modes.filter((entry) => g === null || endsLater(entry.endDate, g.endDate));
  if (g === null && kept.length === 0) return null;
  // Keyed by the moment, not its spelling; null (permanent) is its own key.
  const byEnd = new Map<number | null, { endDate: string | null; gameModes: EGameMode[] }>();
  for (const entry of kept) {
    const moment = entry.endDate === null ? null : new Date(entry.endDate).getTime();
    const group = byEnd.get(moment);
    if (group) group.gameModes.push(entry.gameMode);
    else byEnd.set(moment, { endDate: entry.endDate, gameModes: [entry.gameMode] });
  }
  const groups: ModeGroup[] = [...byEnd.values()]
    .map(({ endDate, gameModes }) => ({ endDate, gameModes: [...gameModes].sort((a, b) => a - b) }))
    .sort((a, b) => (endsLater(a.endDate, b.endDate) ? -1 : endsLater(b.endDate, a.endDate) ? 1 : 0));
  return { global: g, groups: groups.slice(0, MAX_STATEMENT_GROUPS), more: Math.max(0, groups.length - MAX_STATEMENT_GROUPS) };
}

/** The server's table rebuilt from the bans (only status "inEffect"), minus one. */
export function inEffectTableOf(bans: readonly BanSummary[], withoutBanId?: string): InEffectTable {
  const live = bans.filter((ban) => ban.status === "inEffect" && ban.banId !== withoutBanId).sort(byEndThenId);
  const globalBan = live.find(isGlobal);
  const latestByMode = new Map<EGameMode, InEffectBan>();
  for (const ban of live) {
    for (const mode of ban.gameModes) if (!latestByMode.has(mode)) latestByMode.set(mode, ban);
  }
  return {
    global: globalBan ? { endDate: globalBan.endDate, banId: globalBan.banId, by: globalBan.issuedBy } : null,
    modes: [...latestByMode.entries()]
      .sort(([a], [b]) => a - b)
      .map(([gameMode, ban]) => ({ gameMode, endDate: ban.endDate, banId: ban.banId, by: ban.issuedBy })),
    bans: live,
  };
}

function untilText(base: "statement_everything" | "statement_modes", endDate: string | null, f: StatementFormat, modes?: string): string {
  const named = { modes: modes ?? "", date: endDate === null ? "" : dayMonth(endDate, f.now) };
  return f.t(key(`${base}_${endDate === null ? "permanent" : "until"}`), named);
}

export function statementText(statement: InEffectStatement, f: StatementFormat): string {
  const parts: string[] = [];
  if (statement.global) parts.push(untilText("statement_everything", statement.global.endDate, f));
  const groups = statement.groups.map((group) => untilText("statement_modes", group.endDate, f, group.gameModes.map(f.modeName).join(MODE_SEPARATOR)));
  const groupsText = groups.join(GROUP_SEPARATOR);
  if (groups.length > 0) parts.push(statement.global ? `${f.t(key("statement_after_that"))} ${groupsText}` : groupsText);
  if (statement.more > 0) parts.push(f.t(key("statement_more"), { count: statement.more }));
  return parts.join(GROUP_SEPARATOR);
}

/** The account header line. */
export function accountInEffectText(account: Pick<AccountView, "counts" | "inEffect">, f: StatementFormat): string {
  const statement = inEffectStatement(account.inEffect);
  if (statement) return statementText(statement, f);
  return f.t(key(account.counts.total === 0 ? "no_bans" : "no_ban_in_effect"));
}

export function remainingAfterRevoke(account: Pick<AccountView, "inEffect">, banId: string): InEffectStatement | null {
  return inEffectStatement(inEffectTableOf(account.inEffect.bans, banId));
}

export function remainingAfterRevokeText(account: Pick<AccountView, "inEffect">, banId: string, f: StatementFormat): string {
  const statement = remainingAfterRevoke(account, banId);
  if (!statement) return f.t(key("revoke_nothing_remains"));
  return f.t(key("revoke_remaining"), { statement: statementText(statement, f) });
}

export function accountBoxInEffectText(account: Pick<AccountView, "inEffect">, editingId: string | undefined, f: StatementFormat): string {
  const table = editingId === undefined ? account.inEffect : inEffectTableOf(account.inEffect.bans, editingId);
  const statement = inEffectStatement(table);
  if (!statement) return f.t(key("box_in_effect_none"));
  return f.t(key("box_in_effect"), { statement: statementText(statement, f) });
}

function reasonShown(reason: string): string {
  return reason.length > REASON_SHOWN ? `${reason.slice(0, REASON_SHOWN - 1)}…` : reason;
}

function lastBanText(ban: BanView, f: StatementFormat): string {
  const modes = ban.gameModes.length === 0 ? f.t(key("all_short")) : ban.gameModes.map(f.modeName).join(MODE_SEPARATOR);
  const days = ban.endDate === null ? 0 : Math.max(0, Math.round((new Date(ban.endDate).getTime() - new Date(ban.issuedAt).getTime()) / DAY_MS));
  return f.t(key("box_past_last"), {
    modes,
    length: countText("days", days, f.t),
    date: ban.endDate === null ? "" : dayMonth(ban.endDate, f.now),
    reason: reasonShown(ban.banReason),
  });
}

/** null: no past bans. */
export function accountBoxPastText(account: Pick<AccountView, "counts" | "lastExpiredBan">, f: StatementFormat): string | null {
  const { expired, revoked } = account.counts;
  if (expired + revoked === 0) return null;
  const head = f.t(key("box_past"), { expired, revoked });
  return account.lastExpiredBan ? `${head}${GROUP_SEPARATOR}${lastBanText(account.lastExpiredBan, f)}` : head;
}

function sharedModes(ban: InEffectBan, selected: ReadonlySet<EGameMode>): EGameMode[] {
  return ban.gameModes.filter((mode) => selected.has(mode)).sort((a, b) => a - b);
}

function overlapBanOf(ban: InEffectBan, gameModes: EGameMode[]): OverlapBan {
  return { banId: ban.banId, gameModes, endDate: ban.endDate, by: ban.issuedBy };
}

/** The draft's end is covered when this ban ends at the same time or later. */
function coversEnd(ban: InEffectBan, end: BanEnd): boolean {
  return end.permanent ? ban.endDate === null : !endsLater(end.endDate, ban.endDate);
}

function addsNothingOf(live: readonly InEffectBan[], draft: OverlapDraft): boolean {
  const end = draft.end;
  if (end === null) return false;
  if (draft.allGameModes) return live.some((ban) => isGlobal(ban) && coversEnd(ban, end));
  return draft.gameModes.every((mode) => live.some((ban) => (isGlobal(ban) || ban.gameModes.includes(mode)) && coversEnd(ban, end)));
}

export function overlapNotice(account: Pick<AccountView, "inEffect">, draft: OverlapDraft, editingId?: string): OverlapNotice {
  const live = account.inEffect.bans.filter((ban) => ban.status === "inEffect" && ban.banId !== editingId).sort(byEndThenId);
  if (draft.kind === "machine") {
    const globalBan = live.find(isGlobal);
    return globalBan ? { kind: "machine", endDate: globalBan.endDate } : { kind: "none" };
  }
  if (!draft.allGameModes && draft.gameModes.length === 0) return { kind: "none" };
  const selected = new Set(draft.gameModes);
  const overlapping: OverlapBan[] = [];
  const globals = live.filter(isGlobal).map((ban) => overlapBanOf(ban, []));
  const limited = live.filter((ban) => !isGlobal(ban));
  const others = draft.allGameModes
    ? limited.map((ban) => overlapBanOf(ban, [...ban.gameModes]))
    : limited.filter((ban) => sharedModes(ban, selected).length > 0).map((ban) => overlapBanOf(ban, sharedModes(ban, selected)));
  overlapping.push(...globals, ...others);
  if (overlapping.length === 0) return { kind: "none" };
  return {
    kind: "bans",
    bans: overlapping.slice(0, MAX_OVERLAP_BANS),
    more: Math.max(0, overlapping.length - MAX_OVERLAP_BANS),
    addsNothing: addsNothingOf(live, draft),
  };
}

/** A string for "machine", null for "none". */
export function overlapText(notice: OverlapNotice, f: StatementFormat): OverlapText | string | null {
  if (notice.kind === "none") return null;
  if (notice.kind === "machine") {
    return notice.endDate === null
      ? f.t(key("overlap_machine_permanent"))
      : f.t(key("overlap_machine_until"), { date: dayMonth(notice.endDate, f.now) });
  }
  const lines = notice.bans.map((ban) => {
    const modes = ban.gameModes.length === 0 ? f.t(key("overlap_everything")) : ban.gameModes.map(f.modeName).join(MODE_SEPARATOR);
    const by = authorName(ban.by);
    const text = ban.endDate === null
      ? f.t(key("overlap_line_permanent"), { modes, by })
      : f.t(key("overlap_line_until"), { modes, date: dayMonth(ban.endDate, f.now), by });
    return { banId: ban.banId, text };
  });
  return {
    heading: f.t(key(notice.addsNothing ? "overlap_heading_adds_nothing" : "overlap_heading")),
    lines,
    more: notice.more > 0 ? f.t(key("overlap_more"), { count: notice.more }) : null,
    footer: notice.addsNothing ? null : f.t(key("overlap_alongside")),
  };
}
