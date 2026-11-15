import { formatUtc } from "@/helpers/utc-dates";
import type { UserVisibleBanReason } from "@/store/admin/types";
import type { EGameMode } from "@/store/types";
import { DAY_MS, dayMonth, shortDateTime, ymdUtc } from "./dates";
import type { StatementFormat } from "./inEffect";
import { authorName, sameTag } from "./tags";
import { countText, key, type Translate } from "./translate";
import type { BanChange, BanStatus, BanView } from "./types";

export const EXPIRED_DAYS_SHOWN = 60;

export interface ChangeLine {
  field: string;
  old: string;
  new: string;
}

const REASON_CUT = 60;

/** "In effect" / "Expired" / "Revoked". */
export function statusLabel(status: BanStatus, t: Translate): string {
  return t(key(`status_${status}`));
}

/** The second line of the Ends column. */
export function statusWords(ban: Pick<BanView, "status" | "endDate" | "revoked">, now: Date, t: Translate): string {
  if (ban.status === "revoked") return t(key("words_revoked"), { date: ban.revoked ? dayMonth(ban.revoked.at, now) : "" });
  if (ban.endDate === null) return t(key("words_in_effect"));
  const end = new Date(ban.endDate).getTime();
  if (ban.status === "inEffect") {
    const n = Math.round((end - now.getTime()) / DAY_MS);
    return n < 1 ? t(key("words_ends_today")) : countText("words_days_left", n, t);
  }
  const n = Math.round((now.getTime() - end) / DAY_MS);
  if (n > EXPIRED_DAYS_SHOWN) return t(key("words_expired"));
  return n < 1 ? t(key("words_expired_today")) : t(key("words_expired_days_ago"), { count: n });
}

/** "2026-12-02" / "Permanent". */
export function endsText(ban: Pick<BanView, "endDate">, t: Translate): string {
  return ban.endDate === null ? t(key("permanent")) : ymdUtc(ban.endDate);
}

/** "2026-12-02 00:00 UTC" / "No end date". */
export function endsTooltip(ban: Pick<BanView, "endDate">, t: Translate): string {
  return ban.endDate === null ? t(key("no_end_date")) : formatUtc(ban.endDate);
}

export function lastChangeText(ban: Pick<BanView, "lastChange">, now: Date, t: Translate): string {
  const { kind, at } = ban.lastChange;
  const when = shortDateTime(at, now);
  return kind === "issued" ? when : t(key(`last_change_${kind}`), { when });
}

export function lastChangeByText(ban: Pick<BanView, "lastChange" | "issuedBy">, t: Translate): string {
  const by = authorName(ban.lastChange.by);
  // Authors are free text: compared as stored, never as tags.
  return ban.lastChange.by === ban.issuedBy ? by : t(key("last_change_by_issuer"), { by, issuer: authorName(ban.issuedBy) });
}

/** Full names. */
export function lastChangeByTooltip(ban: Pick<BanView, "lastChange" | "issuedBy">, t: Translate): string {
  const by = ban.lastChange.by;
  return by === ban.issuedBy ? by : t(key("last_change_by_issuer_full"), { by, issuer: ban.issuedBy });
}

export function isRenamed(ban: Pick<BanView, "battleTag" | "currentBattleTag">): boolean {
  return !sameTag(ban.battleTag, ban.currentBattleTag);
}

export function bannedAsText(ban: Pick<BanView, "battleTag" | "currentBattleTag">, t: Translate): string {
  return isRenamed(ban)
    ? t(key("banned_as_renamed"), { tag: ban.battleTag, current: ban.currentBattleTag })
    : t(key("banned_as"), { tag: ban.battleTag });
}

export function issuedText(ban: Pick<BanView, "issuedAt" | "issuedBy">, t: Translate): string {
  return t(key("issued"), { date: formatUtc(ban.issuedAt), by: ban.issuedBy });
}

/** "All game modes" / "Mode 1, Mode 2" (names from modeName). */
export function modesText(gameModes: readonly EGameMode[], modeName: (m: EGameMode) => string, t: Translate): string {
  return gameModes.length === 0 ? t(key("all_game_modes")) : gameModes.map(modeName).join(", ");
}

export function revokedNoticeText(view: Pick<BanView, "otherBansInEffect">, t: Translate): string {
  return view.otherBansInEffect === 0 ? t(key("revoked_notice_none")) : countText("revoked_notice", view.otherBansInEffect, t);
}

export function shownReasonOf(
  reason: UserVisibleBanReason | undefined | null,
  translationName: (id: string) => string | undefined,
  t: Translate,
): { kind: "free" | "translation"; text: string } | null {
  if (!reason) return null;
  if (reason.freeText) return { kind: "free", text: reason.freeText };
  if (reason.translationId) {
    const id = reason.translationId;
    return { kind: "translation", text: translationName(id) ?? t(key("translation_not_found"), { id }) };
  }
  return null;
}

function valueText(field: BanChange["field"], value: unknown, f: StatementFormat, translationName: (id: string) => string | undefined): string {
  const nothing = f.t(key("change_nothing"));
  if (value === null || value === undefined) {
    return field === "endDate" && value === null ? f.t(key("permanent")) : nothing;
  }
  if (field === "endDate" && typeof value === "string") return Number.isNaN(new Date(value).getTime()) ? String(value) : ymdUtc(value);
  if (field === "gameModes" && Array.isArray(value)) return modesText(value, f.modeName, f.t);
  if (field === "banReason" && typeof value === "string") return value.length > REASON_CUT ? `${value.slice(0, REASON_CUT - 1)}…` : value;
  if (field === "userVisibleBanReason" && typeof value === "object") return shownReasonOf(value, translationName, f.t)?.text ?? nothing;
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : JSON.stringify(value);
}

export function changeLine(change: BanChange, f: StatementFormat, translationName: (id: string) => string | undefined): ChangeLine {
  return {
    field: f.t(key(`field_${change.field}`)),
    old: valueText(change.field, change.old, f, translationName),
    new: valueText(change.field, change.new, f, translationName),
  };
}
