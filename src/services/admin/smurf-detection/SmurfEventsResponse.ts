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
 * What the server computed about an event (the list's fact columns), stored and refreshed in turn by its periodic
 * stats job, denied events too. A count the server read only up to its own limit comes with its `...Capped` flag:
 * the number is then "at least". As of `at`, not live.
 */
export interface SmurfEventFacts {
  /** When the facts were computed. */
  at: string;
  networks: number;
  /** Rows of the identifier table. */
  identifiers: number;
  /** Most accounts ever on one identifier; absent when no identifier has a day history. */
  maxAccountsEver?: number;
  /** At least `maxAccountsEver` (more holders than the server reads). */
  maxAccountsEverCapped?: true;
  /**
   * The identifier table was truncated when the facts were computed (rows cut or skipped, or not every
   * attendee's old-format hardware read): `identifiers` and `maxAccountsEver` are lower bounds ("at least").
   */
  identifiersTruncated?: true;
  attendees: number;
  /** Accounts the event does not count as attendees (`notCounted` of the detail). */
  notCounted: number;
  /** The links the event ended, as of `at`: the list's ended-links column. */
  endedLinks: number;
  /** Live links among the attendees; absent when not counted (an event too large to count, or the read ran out of time). */
  liveLinks?: number;
  /** At least `liveLinks`. */
  liveLinksCapped?: true;
  /** `liveLinks` is absent because its read ran out of time; absent when counted or when the event is too large to count (not read). */
  liveLinksTimedOut?: true;
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
  /**
   * Links this event currently ends, counted live on every request. `facts.endedLinks` is the same count
   * as of `facts.at` (the list's column); the two can differ until the next refresh.
   */
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
  /** Manual events: the BattleTags the moderator anchored the event on. */
  anchors?: string[];
  /** Manual events: the span the moderator asked for (`from`/`to` is the span found on the venue). */
  requested?: { from: string; to: string };
  networks: SmurfEventNetwork[];
  machines: SmurfEventMachine[];
  evidence: SmurfEventReviewEvidence;
  /** The links the event ended, by link id: all of them, unless `endedLinksListTruncated`. */
  endedLinksList: SmurfEventLinkRef[];
  /** Present (true) when the event ended more links than a detail lists: `endedLinksList` holds the first ones by link id, `endedLinks` the full count. */
  endedLinksListTruncated?: true;
  /** The first of the live links among the attendees (`truncated`: more exist); absent when not read (an event too large to count) or when the read ran out of time. */
  liveLinks?: { links: SmurfEventLinkRef[]; truncated?: true };
  /** Present (true) when `liveLinks` is absent because its read ran out of time, not because the event is too large to count. */
  liveLinksTimedOut?: true;
  /** The BattleTags the event does not count as attendees (kept out: located away from it); empty when none. */
  notCounted: string[];
  /** Since when the server records what the identifiers rest on: the per-day hardware keys and the daily device memory events are detected from; each absent when not known. */
  recorded: { hardwareKeysSince?: string; deviceMemorySince?: string };
  /** False for manual and carried-over events: no `evidence` was computed for them (it reads 0). */
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
  /** `event-create`, `event-update`, `event-delete`, `event-confirm`, `event-deny`, `event-unreview` or `event-rename`. */
  action: string;
  reason?: string;
  /** The event's name when the entry was written. */
  name: string;
  /**
   * Small scalars, only these by action. create: `attendees`, `machines`, `networks`, `ended` (null: not known).
   * update: those and `review`, `previousReview`. delete: `attendees`. rename: `previousName`.
   * confirm, deny, unreview: `review`, `previous` (the review it replaced), `applied` (the links were changed at once),
   * and the event's stored facts at the moment of the review, each omitted when not stored: `factsNetworks`,
   * `factsIdentifiers`, `factsMaxAccountsEver`, `factsAttendees`, `factsNotCounted`, `factsEndedLinks`,
   * `factsLiveLinks`, and the flags, each `true` or omitted: `factsMaxAccountsEverCapped` (at least that many accounts
   * on the identifier), `factsLiveLinksCapped` (at least that many live links), `factsIdentifiersTruncated`
   * (`factsIdentifiers` and `factsMaxAccountsEver` were lower bounds), `factsLiveLinksTimedOut` (`factsLiveLinks`
   * is absent because its read ran out of time, not because it was not read).
   * Any entry may carry `repaired: true`: it was written later, by a retry, to stand for an act whose own entry could
   * not be written; a repaired review carries the facts of the review it stands for. An entry of an action this
   * list does not know has an empty outcome.
   */
  outcome: Record<string, string | number | boolean | null>;
}

/** What differs between the facts stored with the latest review and the stored facts now. */
export interface SmurfEventFactChange {
  /** `networks`, `identifiers`, `maxAccountsEver`, `attendees`, `notCounted`, `endedLinks` or `liveLinks`. */
  fact: string;
  /** The number when the review was made. */
  then: number;
  /** The number now (as of the stored facts' `at`). Absent: no longer known (for example live links that can no longer be counted). */
  now?: number;
  /** `then` is a lower bound ("at least"). Absent: exact. */
  thenCapped?: true;
  /** The same for `now`; never set when `now` is absent. */
  nowCapped?: true;
}

export interface SmurfEventHistory {
  /** Newest first, at most the newest the server sends. */
  entries: SmurfEventHistoryEntry[];
  /** More entries exist than `entries` holds: it holds the newest. */
  truncated?: true;
  /**
   * The latest confirm or deny entry compared with the event's stored facts now, on the facts it stored: those whose
   * number differs, whose lower-bound state differs, or that are no longer known now (`now` absent), in the order
   * networks, identifiers, maxAccountsEver, attendees, notCounted, endedLinks, liveLinks. A fact stored only now is not
   * listed. Absent: never reviewed, the last decision stored no facts (made before facts existed), or nothing changed.
   */
  changedSinceReview?: SmurfEventFactChange[];
}

/**
 * What a create, update or review answers: the event, plus `applied: false` when the change is
 * stored but applying it to the links failed (the next stats run applies it).
 */
export interface SmurfEventWriteResponse extends SmurfEventDetail {
  /** False: smurf events do not change links at the moment, so this write changed none. Absent (an older server): treat as true. */
  applies?: boolean;
  applied?: false;
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
