import type { EGameMode } from "@/store/types";
import type { UserVisibleBanReason } from "@/store/admin/types";

export type BanStatus = "inEffect" | "expired" | "revoked";
export type BanErrorCode =
  | "VALIDATION"
  | "MACHINE_BAN_PERMISSION"
  | "PLAYER_NOT_FOUND"
  | "BAN_NOT_FOUND"
  | "BAN_NOT_IN_EFFECT"
  | "BAN_VERSION_CONFLICT"
  | "BANS_UNAVAILABLE"
  | "MACHINE_DATA_UNAVAILABLE";
export const BAN_ERROR_CODES: readonly BanErrorCode[] = [
  "VALIDATION",
  "MACHINE_BAN_PERMISSION",
  "PLAYER_NOT_FOUND",
  "BAN_NOT_FOUND",
  "BAN_NOT_IN_EFFECT",
  "BAN_VERSION_CONFLICT",
  "BANS_UNAVAILABLE",
  "MACHINE_DATA_UNAVAILABLE",
];
export type BanChangeField = "endDate" | "gameModes" | "banReason" | "userVisibleBanReason";
export interface BanChange {
  at: string;
  by: string;
  field: BanChangeField;
  old: unknown;
  new: unknown;
}
export interface BanRevocation {
  at: string;
  by: string;
  note: string;
}
export interface BanLastChange {
  kind: "issued" | "edited" | "revoked";
  at: string;
  by: string;
}
export interface BanMachineChange {
  at: string;
  by: string;
  added: string[];
  removed: string[];
}
export interface BanMachineView {
  machineIds: string[];
  newMachineIdCount: number;
  changes: BanMachineChange[];
  version: number;
}
export interface BanView {
  id: string;
  accountKey: string;
  battleTag: string;
  currentBattleTag: string;
  gameModes: EGameMode[];
  endDate: string | null;
  banReason: string;
  userVisibleBanReason?: UserVisibleBanReason;
  issuedAt: string;
  issuedBy: string;
  status: BanStatus;
  lastChange: BanLastChange;
  changes: BanChange[];
  revoked: BanRevocation | null;
  otherBansInEffect: number;
  version: number;
  /** Only with machine access and only on a machine ban. */
  machine?: BanMachineView;
}
export interface AccountName {
  battleTag: string;
  banCount: number;
  current: boolean;
  /** issuedAt of the newest ban applied to that tag. */
  lastBannedAt: string | null;
}
export interface AccountCounts {
  total: number;
  inEffect: number;
  expired: number;
  revoked: number;
}
export interface InEffectEntry {
  endDate: string | null;
  banId: string;
  by: string;
}
export interface InEffectModeEntry extends InEffectEntry {
  gameMode: EGameMode;
}
export interface InEffectTable {
  global: InEffectEntry | null;
  modes: InEffectModeEntry[];
  /** Every ban in effect, latest-ending first. */
  bans: BanSummary[];
}
export interface LockedOutBy {
  accountKey: string;
  battleTag: string;
  banId: string;
}
export interface AccountView {
  accountKey: string;
  currentBattleTag: string;
  names: AccountName[];
  counts: AccountCounts;
  inEffect: InEffectTable;
  lastExpiredBan: BanView | null;
  lockedOutBy?: LockedOutBy[];
}
export interface AccountSuggestion {
  accountKey: string;
  matchedBattleTag: string;
  currentBattleTag: string;
  nameCount: number;
  bansInEffect: number;
  bansTotal: number;
}
export interface AccountLookupResponse {
  total: number;
  results: AccountSuggestion[];
}
export interface BanSummary {
  banId: string;
  gameModes: EGameMode[];
  endDate: string | null;
  status: BanStatus;
  banReason: string;
  issuedBy: string;
}
export interface MachineIdRow {
  machineId: string;
  firstUsed: string | null;
  lastUsed: string | null;
  shared: boolean;
  recommended: boolean;
  otherAccountCount: number;
  otherAccountsCapped: boolean;
}
export type AccountBanState = "bannedNow" | "bannedBefore" | "neverBanned";
export interface OtherAccount {
  accountKey: string;
  currentBattleTag: string;
  state: AccountBanState;
  ban: BanSummary | null;
}
export interface MachineIdAccountsResponse {
  total: number;
  capped: boolean;
  accounts: OtherAccount[];
}
export interface MachineImpactResponse {
  otherAccounts: number;
  capped: boolean;
}
export interface TagStatus {
  battleTag: string;
  accountKey: string | null;
  state: AccountBanState;
  ban: BanSummary | null;
  machine?: boolean;
}
/** The website never sends `actor` or `machineAccess`: website-backend sets both from the token. */
export interface CreateBanRequest {
  accountKey?: string;
  battleTag?: string;
  type: "regular" | "machine";
  allGameModes: boolean;
  gameModes: EGameMode[];
  permanent: boolean;
  endDate: string | null;
  banReason: string;
  userVisibleBanReason?: UserVisibleBanReason;
  machineIds?: string[];
}
export interface EditBanRequest {
  version: number;
  allGameModes?: boolean;
  gameModes?: EGameMode[];
  permanent?: boolean;
  endDate?: string | null;
  banReason?: string;
  /** null removes the reason shown to the player. */
  userVisibleBanReason?: UserVisibleBanReason | null;
  machine?: { version: number; machineIds: string[] };
}
export type BanListSort = "lastChange" | "ends" | "accountDefault";
export interface BanListQuery {
  status?: BanStatus;
  author?: string;
  account?: string;
  machineOnly?: boolean;
  sort?: BanListSort;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
export interface BanListResponse {
  total: number;
  bans: BanView[];
}
