// Response shapes of the hardware smurf admin routes (matchmaking-service, proxied unchanged by
// website-backend under api/admin/smurf-detection). Every identifier is a hash8, never a raw value.
// Dates arrive as ISO strings.

export type HardwareLinkSource = "account" | "hardware" | "legacy-machineguid" | "moderator";

export type VerdictKind = "smurf" | "not-smurf";

/** A moderator's verdict on a pair. A verdict without `kind` predates confirmed pairs: it is `not-smurf`. */
export interface HardwareLinkVerdict {
  kind?: VerdictKind;
  author: string;
  reason: string;
  at: string;
}

export interface ItemSighting {
  first: string;
  last: string;
  n: number;
}

/** The stat flags of an item as the server reports them (counts are not shown by the UI). */
export interface HardwareItemStat {
  common: boolean;
  overCap: boolean;
  placeholder: boolean;
  [field: string]: unknown;
}

/** An item two linked accounts share. */
export interface MatchedItemView {
  kind: string;
  tier: string;
  hash8: string;
  sightings: { a: ItemSighting; b: ItemSighting };
  stat: HardwareItemStat | null;
  trusted?: boolean;
  ignored?: boolean;
}

/** One link document: live, or a tombstone when `invalidatedAt` is set. `a` sorts before `b`. */
export interface HardwareLink {
  _id: string;
  a: string;
  b: string;
  source: HardwareLinkSource;
  createdAt: string;
  lastConfirmedAt: string;
  invalidatedAt?: string;
  invalidReason?: string;
  reportedAt?: string;
  reportPending?: true;
  verdict?: HardwareLinkVerdict;
  evidence: { matched: MatchedItemView[]; legacyKeys?: string[] };
}

/** GET hardware/links/{battleTag}. `raw` holds every link document of the account, live and tombstoned. */
export interface HardwareLinksResponse {
  battleTag: string;
  generation: string | null;
  raw: HardwareLink[];
}

/** One item of the account's hardware profile. */
export interface HardwareProfileItemView {
  kind: string;
  tier: string;
  hash8: string;
  first: string;
  last: string;
  logins: number;
  stat: HardwareItemStat | null;
  trusted: boolean;
  ignored: boolean;
}

/** GET hardware/items/{battleTag}. */
export interface HardwareItemsResponse {
  battleTag: string;
  generation: string | null;
  items: HardwareProfileItemView[];
}

/** Who set an override, why and when. */
export interface OverrideInfo {
  author: string;
  reason: string;
  at: string;
}

/** How many accounts hold an item. `capped`: at least `count` (the server stopped counting). */
export interface HolderCount {
  count: number;
  capped: boolean;
}

/** GET hardware/items/{battleTag}/{hash8}: one item, before a wide-impact action. */
export interface HardwareItemDetail {
  kind: string;
  tier: string;
  hash8: string;
  holders: HolderCount;
  stat: HardwareItemStat | null;
  trusted: OverrideInfo | null;
  ignored: boolean;
}

export type AuditAction = "trust-add" | "trust-revoke" | "ignore-add" | "ignore-revoke" | "verdict-smurf" | "verdict-not-smurf" | "verdict-revoke";

export type AuditTarget =
  | { kind: "item"; battleTag: string; hash8: string; itemKind: string }
  | { kind: "pair"; a: string; b: string }
  | { kind: "identifier"; type: string; valueHash8: string };

export interface AuditEntry {
  id: string;
  at: string;
  author: string;
  /** Absent on revokes. */
  reason?: string;
  /** An AuditAction; typed as string so a newer server action still shows (as sent). */
  action: string;
  target: AuditTarget;
  accounts: string[];
  outcome: Record<string, string | number | boolean | null>;
}

/** GET hardware/audit. `next` is the `before` of the following page, null on the last one. */
export interface AuditPage {
  entries: AuditEntry[];
  next: string | null;
}

export interface AuditQuery {
  battleTag?: string;
  before?: string;
  limit?: number;
}

/**
 * The answer to any override. Every route sends `message`; the other fields depend on the route
 * (`replaced`/`repaired` for verdicts, `outcome` for a confirmed-smurf revoke, `queued` and
 * `trustRemoved`/`ignoreRemoved`/`wasTrusted`/`wasIgnored` for items).
 */
export interface OverrideResult {
  message: string;
  replaced?: VerdictKind;
  repaired?: boolean;
  outcome?: string;
  queued?: number;
  trustRemoved?: number;
  ignoreRemoved?: number;
  wasTrusted?: boolean;
  wasIgnored?: boolean;
  [field: string]: unknown;
}
