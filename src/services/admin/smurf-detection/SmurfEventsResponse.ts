// Shapes of the smurf events admin routes (matchmaking-service, proxied unchanged by website-backend
// under api/admin/smurf-detection/events), mirroring matchmaking's smurf-events.contract.ts. Networks and machines are hash8 values, never raw ones.
// Dates arrive as ISO strings.

import type { HardwareLinkSource } from "./HardwareSmurfResponse";

export type SmurfEventOrigin = "detected" | "historical" | "manual" | "carried-over";
export type SmurfEventReview = "unreviewed" | "confirmed" | "denied";

export interface SmurfEventCounts {
  networks: number;
  machines: number;
  attendees: number;
  /** Absent: not computed (an event whose homes were never computed). */
  homes?: number;
}

/** A link the event ended (or, in a deny preview, would bring back). */
export interface SmurfEventLinkRef {
  a: string;
  b: string;
  source: HardwareLinkSource;
}

/** What the server observed around the event, as numbers. */
export interface SmurfEventReviewEvidence {
  networkDaysBefore: number;
  networkDaysAfter: number;
  returningAttendees: number;
}

/**
 * What the server computed about an event, stored and refreshed with the stats run. A count the
 * server read only up to its own limit comes with its `...Capped` flag: the number is then "at least".
 */
export interface SmurfEventFacts {
  /** When the facts were computed. */
  at: string;
  networks: number;
  /** Rows of the identifier table. */
  identifiers: number;
  /** Most accounts ever on one identifier; absent when no identifier has a day history. */
  maxAccountsEver?: number;
  maxAccountsEverCapped?: true;
  attendees: number;
  /** Accounts the event does not count. */
  notCounted: number;
  endedLinks: number;
  /** Links among attendees that are still live; absent when the server did not count them. */
  liveLinks?: number;
  liveLinksCapped?: true;
}

export interface SmurfEventSummary {
  id: string;
  name: string;
  /** True: a moderator gave the name. */
  named: boolean;
  origin: SmurfEventOrigin;
  review: SmurfEventReview;
  from: string;
  to: string;
  counts: SmurfEventCounts;
  endedLinks: number;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  /** Absent: not computed yet. */
  facts?: SmurfEventFacts;
}

export interface SmurfEventNetwork {
  hash8: string;
  firstAt: string;
  lastAt: string;
  accounts: number;
}

export interface SmurfEventMachine {
  hash8: string;
  accounts: number;
}

export interface SmurfEventDetail extends SmurfEventSummary {
  attendees: string[];
  /** Manual events: the BattleTags the moderator entered. */
  anchors?: string[];
  /** Manual events: the span the moderator entered (`from`/`to` is the span the server found). */
  requested?: { from: string; to: string };
  networks: SmurfEventNetwork[];
  machines: SmurfEventMachine[];
  evidence: SmurfEventReviewEvidence;
  /** The links the event ended: all of them, unless `endedLinksListTruncated`. */
  endedLinksList: SmurfEventLinkRef[];
  /** Present (true) when `endedLinksList` is cut and does not hold every ended link. */
  endedLinksListTruncated?: true;
  /** The first of the links among attendees that are still live. */
  liveLinks?: { links: SmurfEventLinkRef[]; truncated?: true };
  /** BattleTags the event does not count; empty when none. */
  notCounted: string[];
  /** Since when the server records hardware keys and device memory; a field is absent when it does not know. */
  recorded: { hardwareKeysSince?: string; deviceMemorySince?: string };
  /** False: no evidence is recorded for this event (manual and carried-over events). */
  evidenceRecorded: boolean;
}

export interface SmurfEventIdentifierRow {
  /** Of the class representative. */
  hash8: string;
  /** Item kind, "ip" for an IP-hash network, or the old-format field name. */
  kind: string;
  roles: Array<"machine" | "network" | "shared" | "attendee-key">;
  /** Stored keys merged into this row. */
  keys: number;
  /** Accounts that used it on a day of the event (a capped row: exact for the attendees, a lower bound in all). */
  accountsDuring: number;
  /** Absent: no day history exists for this kind. `capped`: at least `count`, and the row's day figures are lower bounds. */
  accountsEver?: { count: number; capped?: true };
  daysOutside?: { before: number; after: number; capped?: true };
  /** UTC day numbers inside the window, days with use only, with the accounts of that day (a capped row: lower bounds). */
  days?: Array<[day: number, accounts: number]>;
  /**
   * Sides with use outside the event. An empty list: the event only. Absent without `accountsEver`, and on a
   * capped row when none was seen among what the server read (unknown); a capped row lists only the sides seen.
   */
  observed?: Array<"before" | "after">;
  /** Networks stored as an IP hash, when observed: first and last use inside the event (absent: not observed). */
  span?: { firstAt: string; lastAt: string };
  alsoIn: Array<{ id: string; name: string }>;
  /** Only when the server reveals them to the caller. */
  values?: string[];
  machineNames?: string[];
  usernames?: string[];
}

export interface SmurfEventIdentifiers {
  window: { fromDay: number; toDay: number; eventFromDay: number; eventToDay: number };
  rows: SmurfEventIdentifierRow[];
  truncated?: true;
}

export interface SmurfEventHistoryEntry {
  id: string;
  at: string;
  author: string;
  action: string;
  reason?: string;
  name: string;
  outcome: Record<string, string | number | boolean | null>;
}

export interface SmurfEventHistory {
  /** Newest first. */
  entries: SmurfEventHistoryEntry[];
  /** Facts that differ from the latest review's; absent when unreviewed or reviewed before facts existed. */
  changedSinceReview?: Array<{ fact: string; then: number; thenCapped?: true; now: number; nowCapped?: true }>;
}

/**
 * What a create, update or review answers: the event, plus `applied: false` when the change is
 * stored but applying it to the links failed (the next stats run applies it).
 */
export interface SmurfEventWriteResponse extends SmurfEventDetail {
  /** False: smurf events do not change links at the moment, so this write changed none. Absent (an older server): treat as true. */
  applies?: boolean;
  applied?: boolean;
}

/** What a create answered: the event, and whether it was already there (200) rather than created (201). */
export interface SmurfEventCreateResult {
  event: SmurfEventWriteResponse;
  /** True: the anchors and span matched a stored event, which came back unchanged. */
  existing: boolean;
}

export type SmurfEventPreviewRefusal = "no-venue" | "too-long" | "too-wide";
export type SmurfEventExclusion = "home" | "single-anchor" | "too-wide";

export interface SmurfEventPreview {
  /** False: smurf events do not change links at the moment; `endsLinks` is what they would end once they do. Absent (an older server): treat as true. */
  applies?: boolean;
  span?: { from: string; to: string };
  networks: Array<{ hash8: string; anchors: number; firstAt: string; lastAt: string }>;
  excluded: Array<{ hash8: string; reason: SmurfEventExclusion }>;
  counts: { machines: number; attendees: number };
  endsLinks: SmurfEventLinkRef[];
  /** Set when the server would not save this event. */
  refused?: SmurfEventPreviewRefusal;
}

export interface ManualEventInput {
  name: string;
  from: string;
  to: string;
  anchors: string[];
  author: string;
  reason?: string;
}

export interface ReviewInput {
  decision: SmurfEventReview;
  author: string;
  reason?: string;
  /** Names the event before the review runs. */
  name?: string;
}

export interface RenameInput {
  name: string;
  author: string;
  reason?: string;
}

// The website never sends `author`: website-backend sets it from the moderator's token.

export type SmurfEventPreviewRequest = Omit<ManualEventInput, "author" | "reason"> & {
  /** The manual event the previewed edit would replace; absent for a new event. 404: gone, 409: not manual. */
  replacing?: string;
};
export type ManualEventRequest = Omit<ManualEventInput, "author">;
export type ReviewRequest = Omit<ReviewInput, "author">;
export type RenameRequest = Omit<RenameInput, "author">;

export interface SmurfEventsQuery {
  review?: SmurfEventReview;
  origin?: SmurfEventOrigin;
  cursor?: string;
  /** At most 100. */
  limit?: number;
}

/** GET /. `next` is the cursor of the following page; absent on the last one. */
export interface SmurfEventsPage {
  events: SmurfEventSummary[];
  next?: string;
}

/** GET /:id/deny-preview: the links a deny would bring back. */
export interface SmurfEventDenyPreview {
  /** False: smurf events do not change links at the moment; `links` is what a deny would bring back once they do. Absent (an older server): treat as true. */
  applies?: boolean;
  /** Possibly a cut list (see `linksTruncated`). */
  links: SmurfEventLinkRef[];
  /** How many links the event ended: always the full count. */
  endedLinks: number;
  /** Present (true) when `links` was cut: it may miss links a deny would bring back; the deny itself checks every one. */
  linksTruncated?: true;
}
