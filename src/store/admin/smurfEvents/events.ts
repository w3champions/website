import type { SmurfEventDetail, SmurfEventPreview, SmurfEventSummary, SmurfEventWriteResponse } from "@/services/admin/smurf-detection/SmurfEventsResponse";

/**
 * The shown events with a further page appended. The server's keyset paging can repeat an event
 * (or skip one) when a review moves it between pages, so the list holds each id once: an event
 * that arrives again replaces its earlier copy's data where that copy stands.
 */
export function mergeEvents(shown: readonly SmurfEventSummary[], incoming: readonly SmurfEventSummary[]): SmurfEventSummary[] {
  const merged = [...shown];
  const positions = new Map(merged.map((e, i) => [e.id, i]));
  for (const event of incoming) {
    const at = positions.get(event.id);
    if (at === undefined) {
      positions.set(event.id, merged.length);
      merged.push(event);
    } else {
      merged[at] = event;
    }
  }
  return merged;
}

/** The list-row fields of an event. */
export function summaryOf(event: SmurfEventDetail): SmurfEventSummary {
  const { id, name, origin, review, from, to, counts, endedLinks, createdAt, reviewedAt, reviewedBy } = event;
  const summary: SmurfEventSummary = { id, name, origin, review, from, to, counts, endedLinks, createdAt };
  if (reviewedAt !== undefined) summary.reviewedAt = reviewedAt;
  if (reviewedBy !== undefined) summary.reviewedBy = reviewedBy;
  return summary;
}

/** A write's answer split into the event and whether its effect on the links is already in place. */
export interface WriteOutcome {
  detail: SmurfEventDetail;
  /** False: the change is stored, but applying it to the links is left to the next stats run. */
  applied: boolean;
  /** A create that matched a stored event, which came back unchanged. */
  existing: boolean;
}

export function outcomeOf(response: SmurfEventWriteResponse, existing = false): WriteOutcome {
  const { applied, ...detail } = response;
  return { detail, applied: applied !== false, existing };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isArrayOf(value: unknown, isItem: (item: unknown) => boolean): boolean {
  return Array.isArray(value) && value.every(isItem);
}

const isString = (value: unknown): boolean => typeof value === "string";

/**
 * The preview inside a refused write's 422 body, when it has the shape the dialog reads; null
 * otherwise. A 422 means the server refused, so a preview without a `refused` reason is given one.
 */
export function refusedPreviewFrom(body: unknown): SmurfEventPreview | null {
  if (!isObject(body) || !isObject(body.preview)) return null;
  const p = body.preview;
  const counts = p.counts;
  const valid =
    isArrayOf(p.networks, (n) => isObject(n) && isString(n.hash8) && typeof n.anchors === "number") &&
    isArrayOf(p.excluded, (x) => isObject(x) && isString(x.hash8) && isString(x.reason)) &&
    isArrayOf(p.endsLinks, (l) => isObject(l) && isString(l.a) && isString(l.b)) &&
    isObject(counts) && typeof counts.machines === "number" && typeof counts.attendees === "number" &&
    (p.span === undefined || (isObject(p.span) && isString(p.span.from) && isString(p.span.to))) &&
    (p.refused === undefined || isString(p.refused));
  if (!valid) return null;
  return { ...(p as unknown as SmurfEventPreview), refused: (p.refused as SmurfEventPreview["refused"]) ?? "no-venue" };
}
