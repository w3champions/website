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
  countries: number;
  networkDaysBefore: number;
  networkDaysAfter: number;
  returningAttendees: number;
  pingClusters?: number;
}

export interface SmurfEventSummary {
  id: string;
  name: string;
  origin: SmurfEventOrigin;
  review: SmurfEventReview;
  from: string;
  to: string;
  counts: SmurfEventCounts;
  endedLinks: number;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
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
}

// The website never sends `author`: website-backend sets it from the moderator's token.

export type SmurfEventPreviewRequest = Omit<ManualEventInput, "author" | "reason"> & {
  /** The manual event the previewed edit would replace; absent for a new event. 404: gone, 409: not manual. */
  replacing?: string;
};
export type ManualEventRequest = Omit<ManualEventInput, "author">;
export type ReviewRequest = Omit<ReviewInput, "author">;

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
