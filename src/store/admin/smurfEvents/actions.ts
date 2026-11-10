import type { SmurfEventReview, SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";

export interface SmurfEventActions {
  review: boolean;
  edit: boolean;
  delete: boolean;
}

/**
 * The writes a moderator may start on an event: none without SmurfCheckerAdministration; a review on
 * any event; edit and delete only on manual ones (the server refuses the others).
 */
export function smurfEventActions(event: Pick<SmurfEventSummary, "origin">, canAdminister: boolean): SmurfEventActions {
  if (!canAdminister) return { review: false, edit: false, delete: false };
  const manual = event.origin === "manual";
  return { review: true, edit: manual, delete: manual };
}

const DECISIONS: readonly SmurfEventReview[] = ["confirmed", "denied", "unreviewed"];

/** The decisions a review may set: every one but the event's current review. */
export function reviewDecisions(current: SmurfEventReview): SmurfEventReview[] {
  return DECISIONS.filter((d) => d !== current);
}
