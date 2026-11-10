import { SmurfEventsApiError } from "@/services/admin/SmurfEventsService";
import type { SmurfEventExclusion, SmurfEventOrigin, SmurfEventPreviewRefusal, SmurfEventReview, SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { key, type Translate } from "./translate";

const ORIGINS: ReadonlySet<string> = new Set<SmurfEventOrigin>(["detected", "historical", "manual", "carried-over"]);
const REVIEWS: ReadonlySet<string> = new Set<SmurfEventReview>(["unreviewed", "confirmed", "denied"]);
const REFUSALS: ReadonlySet<string> = new Set<SmurfEventPreviewRefusal>(["no-venue", "too-long", "too-wide"]);
const EXCLUSIONS: ReadonlySet<string> = new Set<SmurfEventExclusion>(["home", "single-anchor", "too-wide"]);

/** The label of `value` from `prefix_value`, or the value as sent when the page does not know it. */
function known(values: ReadonlySet<string>, prefix: string, value: string, t: Translate): string {
  return values.has(value) ? t(key(`${prefix}_${value}`)) : value;
}

export function originLabel(origin: SmurfEventOrigin, t: Translate): string {
  return known(ORIGINS, "origin", origin, t);
}

export function reviewLabel(review: SmurfEventReview, t: Translate): string {
  return known(REVIEWS, "review", review, t);
}

/** Vuetify color of a review chip: unreviewed events wait for a moderator. */
export function reviewColor(review: SmurfEventReview): string {
  switch (review) {
    case "unreviewed":
      return "warning";
    case "confirmed":
      return "success";
    default:
      return "grey";
  }
}

export function refusalLabel(refusal: SmurfEventPreviewRefusal, t: Translate): string {
  return known(REFUSALS, "refusal", refusal, t);
}

export function exclusionLabel(reason: SmurfEventExclusion, t: Translate): string {
  return known(EXCLUSIONS, "excluded", reason, t);
}

/** Unreviewed events first; otherwise the server's order. Returns a new array. */
export function orderEvents<T extends Pick<SmurfEventSummary, "review">>(events: readonly T[]): T[] {
  return [...events.filter((e) => e.review === "unreviewed"), ...events.filter((e) => e.review !== "unreviewed")];
}

/** The server's message for a failed request, else a generic text. */
export function errorText(e: unknown, t: Translate): string {
  if (e instanceof SmurfEventsApiError && e.serverMessage) return e.serverMessage;
  return t(key("generic_error"));
}
