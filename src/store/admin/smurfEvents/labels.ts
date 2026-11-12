import { SmurfEventsApiError } from "@/services/admin/SmurfEventsService";
import type { SmurfEventCounts, SmurfEventExclusion, SmurfEventOrigin, SmurfEventPreviewRefusal, SmurfEventReview } from "@/services/admin/smurf-detection/SmurfEventsResponse";
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

/** The server's message for a failed request, else a generic text. */
export function errorText(e: unknown, t: Translate): string {
  if (e instanceof SmurfEventsApiError && e.serverMessage) return e.serverMessage;
  return t(key("generic_error"));
}

/** HTTP status of "not ready yet": the data manual events need is still being prepared after a deploy. */
const NOT_READY = 503;

/** HTTP status of "busy right now": nothing was read or stored, retry in a moment. */
const TOO_BUSY = 429;

/**
 * Like {@link errorText} for the routes that can be refused as busy or not ready (preview, create, update and
 * review): 503 while the data manual events need is still being prepared (nothing was stored, so retry later)
 * and 429 while the server is busy (retry in a moment).
 */
export function manualEventErrorText(e: unknown, t: Translate): string {
  if (e instanceof SmurfEventsApiError && e.status === NOT_READY) return t(key("manual_not_ready"));
  if (e instanceof SmurfEventsApiError && e.status === TOO_BUSY) return t(key("manual_busy"));
  return errorText(e, t);
}

/** "1 link" / "N links": the `_one` or `_other` form of the text `base`, as the hardware page does. */
export function countText(base: string, count: number, t: Translate): string {
  return t(key(`${base}_${count === 1 ? "one" : "other"}`), { count });
}

/** The homes count of an event, or "not computed" when the server sent none (never 0). */
export function homesText(counts: SmurfEventCounts, t: Translate): string {
  return counts.homes === undefined ? t(key("count_homes_not_computed")) : String(counts.homes);
}

/** "N machines, M attendees" of a preview. */
export function previewCountsText(counts: { machines: number; attendees: number }, t: Translate): string {
  return t(key("preview_counts"), { machines: countText("preview_machines", counts.machines, t), attendees: countText("preview_attendees", counts.attendees, t) });
}
