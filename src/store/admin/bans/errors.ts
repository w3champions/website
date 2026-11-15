import { BanApiError } from "@/services/admin/banApiError";
import { key, type Translate } from "./translate";
import type { BanErrorCode } from "./types";

const CODE_TEXTS: Partial<Record<BanErrorCode, string>> = {
  MACHINE_BAN_PERMISSION: "error_machine_permission",
  BAN_VERSION_CONFLICT: "error_version_conflict",
  BAN_NOT_IN_EFFECT: "error_not_in_effect",
  BANS_UNAVAILABLE: "error_unavailable",
  MACHINE_DATA_UNAVAILABLE: "error_machine_data_unavailable",
  BAN_NOT_FOUND: "error_ban_not_found",
  PLAYER_NOT_FOUND: "error_player_not_found",
};
const BLOCKING_CODES: readonly BanErrorCode[] = ["MACHINE_BAN_PERMISSION", "BAN_VERSION_CONFLICT", "BAN_NOT_IN_EFFECT", "BAN_NOT_FOUND"];

/** False for a BanApiError with a code (a stated refusal, also the 503 codes); else true for a network failure or a 5xx. */
export function mayHaveBeenSaved(e: unknown): boolean {
  if (!(e instanceof BanApiError)) return true;
  return e.code === undefined && e.status >= 500;
}

export function banErrorText(e: unknown, t: Translate): string {
  if (e instanceof BanApiError) {
    if (e.code === "VALIDATION" && e.message !== "") return e.message; // the only server text ever shown
    const named = e.code === undefined ? undefined : CODE_TEXTS[e.code];
    if (named) return t(key(named));
    if (e.code === undefined && (e.status === 401 || e.status === 403)) return t(key("error_forbidden"));
    if (e.code === undefined && e.status === 502) return t(key("error_unreachable"));
  }
  return t(key("generic_error"));
}

/** Save or confirm stays disabled after this error until the dialog is closed. */
export function blocksRetry(e: unknown): boolean {
  if (e instanceof BanApiError && e.code !== undefined && BLOCKING_CODES.includes(e.code)) return true;
  return mayHaveBeenSaved(e);
}
