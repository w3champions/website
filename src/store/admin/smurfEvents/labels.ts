import { SmurfEventsApiError } from "@/services/admin/SmurfEventsService";
import type { SmurfEventExclusion, SmurfEventOrigin, SmurfEventPreviewRefusal, SmurfEventReview } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { factText } from "./facts";
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
      return "primary";
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
  if (e instanceof SmurfEventsApiError && e.status === TOO_BUSY) return busyText(e.retryAfterSeconds, t);
  return errorText(e, t);
}

/** The busy notice, with how long to wait when the server said. */
function busyText(seconds: number | null, t: Translate): string {
  if (seconds === null) return t(key("manual_busy"));
  return t(key(`manual_busy_wait_${seconds === 1 ? "one" : "other"}`), { seconds });
}

/** "1 link" / "N links": the `_one` or `_other` form of the text `base`, as the hardware page does. */
export function countText(base: string, count: number, t: Translate): string {
  return t(key(`${base}_${count === 1 ? "one" : "other"}`), { count });
}

const HISTORY_ACTIONS: ReadonlySet<string> = new Set(["event-create", "event-update", "event-delete", "event-confirm", "event-deny", "event-unreview", "event-rename"]);

/** Fact names of a history entry's facts and of `changedSinceReview`, in the order they are shown. */
const FACTS = ["networks", "identifiers", "maxAccountsEver", "attendees", "notCounted", "endedLinks", "liveLinks"] as const;

export function historyActionLabel(action: string, t: Translate): string {
  return known(HISTORY_ACTIONS, "history_action", action, t);
}

/** The label of a fact by the name the server sends, or the name as sent when the page does not know it. */
export function factLabel(fact: string, t: Translate): string {
  return known(new Set<string>(FACTS), "fact_label", fact, t);
}

/** "Networks 2, Identifiers 14": the facts a review entry recorded (`facts*` outcome fields, a `facts*Capped` flag next to a capped one), none when it recorded none. */
export function reviewFactsText(outcome: Record<string, string | number | boolean | null>, t: Translate): string | null {
  const parts = FACTS.flatMap((fact) => {
    const field = `facts${fact[0].toUpperCase()}${fact.slice(1)}`;
    const value = outcome[field];
    return typeof value === "number" ? [`${factLabel(fact, t)} ${factText(value, outcome[`${field}Capped`] === true ? true : undefined, t)}`] : [];
  });
  return parts.length === 0 ? null : parts.join(", ");
}

/** "N machines, M attendees" of a preview. */
export function previewCountsText(counts: { machines: number; attendees: number }, t: Translate): string {
  return t(key("preview_counts"), { machines: countText("preview_machines", counts.machines, t), attendees: countText("preview_attendees", counts.attendees, t) });
}
