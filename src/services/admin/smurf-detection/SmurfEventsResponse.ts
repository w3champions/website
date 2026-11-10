// Shapes of the smurf events admin routes (matchmaking-service, proxied unchanged by website-backend
// under api/admin/smurf-detection/events). Networks and machines are hash8 values, never raw ones.
// Dates arrive as ISO strings.

import type { HardwareLinkSource } from "./HardwareSmurfResponse";

export type SmurfEventOrigin = "detected" | "historical" | "manual" | "carried-over";
export type SmurfEventReview = "unreviewed" | "confirmed" | "denied";

export interface SmurfEventCounts {
  networks: number;
  machines: number;
  attendees: number;
  homes: number;
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
  endedLinksList: SmurfEventLinkRef[];
}

export type SmurfEventPreviewRefusal = "no-venue" | "too-long" | "too-wide";
export type SmurfEventExclusion = "home" | "single-anchor" | "too-wide";

export interface SmurfEventPreview {
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

export type SmurfEventPreviewRequest = Omit<ManualEventInput, "author" | "reason">;
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
  links: SmurfEventLinkRef[];
}
