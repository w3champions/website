import { formatUtc } from "@/helpers/utc-dates";
import type { EGameMode } from "@/store/types";
import { key, type Translate } from "./translate";
import type { TagStatus } from "./types";
import { modesText, statusLabel } from "./wording";

export interface BanBadge {
  inEffect: boolean;
  label: string;
  machine: boolean;
  reason: string;
  until: string;
  by: string;
  modes: string;
  status: string;
}

/** null: no status, never banned, or no ban. The machine marker needs `hasMachineAccess` (AdminModeration). */
export function banBadgeOf(
  status: TagStatus | undefined,
  f: { t: Translate; modeName: (m: EGameMode) => string; hasMachineAccess: boolean },
): BanBadge | null {
  const ban = status?.ban;
  if (!status || !ban || status.state === "neverBanned") return null;
  const inEffect = status.state === "bannedNow";
  const label = inEffect ? key("badge_banned") : key(ban.status === "revoked" ? "badge_banned_revoked" : "badge_banned_expired");
  return {
    inEffect,
    label: f.t(label),
    machine: f.hasMachineAccess && status.machine === true,
    reason: ban.banReason,
    until: ban.endDate === null ? f.t(key("permanent")) : formatUtc(ban.endDate),
    by: ban.issuedBy,
    modes: modesText(ban.gameModes, f.modeName, f.t),
    status: statusLabel(ban.status, f.t),
  };
}
