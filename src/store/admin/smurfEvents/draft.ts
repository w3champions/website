import { isoToUtcInput, utcDayStartInput, utcInputToIso } from "@/helpers/utc-dates";
import type { ManualEventRequest, SmurfEventDetail, SmurfEventPreview, SmurfEventPreviewRequest } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { REASON_MAX_LENGTH } from "@/store/admin/hardwareSmurfs/actions";

/** The server's input limits for a manual event. */
export const NAME_MAX_LENGTH = 100;
export const ANCHORS_MIN = 2;
export const ANCHORS_MAX = 20;
/** The BattleTag shape the server accepts: a name without `|` or `#`, then `#` and digits. */
const BATTLE_TAG = /^[^|#\s][^|#]*#\d+$/;

/** Form state of the manual event dialog; dates are UTC form values ("YYYY-MM-DDTHH:mm"). */
export interface SmurfEventDraft {
  name: string;
  from: string;
  to: string;
  anchors: string[];
  reason: string;
}

/** A form problem: the name of its text and the values it names. */
export interface DraftProblem {
  name: string;
  named?: Record<string, string | number>;
}

/** The previous full UTC day, without anchors. */
export function emptyDraft(now: Date): SmurfEventDraft {
  return { name: "", from: utcDayStartInput(now, -1), to: utcDayStartInput(now), anchors: [], reason: "" };
}

/** The span and anchors the moderator entered (`requested`), not the span the server found. */
export function draftFromEvent(event: SmurfEventDetail): SmurfEventDraft {
  const span = event.requested ?? { from: event.from, to: event.to };
  return { name: event.name, from: isoToUtcInput(span.from), to: isoToUtcInput(span.to), anchors: [...(event.anchors ?? [])], reason: "" };
}

/** Trimmed, without empty entries or repeats, in entry order. */
export function anchorsOf(draft: Pick<SmurfEventDraft, "anchors">): string[] {
  return [...new Set(draft.anchors.map((a) => a.trim()).filter((a) => a !== ""))];
}

/** The first problem in field order, or null. */
export function draftProblem(draft: SmurfEventDraft): DraftProblem | null {
  const name = draft.name.trim();
  if (name === "") return { name: "problem_name" };
  if (name.length > NAME_MAX_LENGTH) return { name: "problem_name_long", named: { max: NAME_MAX_LENGTH } };
  const from = utcInputToIso(draft.from);
  const to = utcInputToIso(draft.to);
  if (from === null || to === null) return { name: "problem_dates" };
  // toISOString output has a fixed shape, so string order is time order.
  if (to <= from) return { name: "problem_order" };
  const anchors = anchorsOf(draft);
  if (anchors.length < ANCHORS_MIN || anchors.length > ANCHORS_MAX) return { name: "problem_anchors", named: { min: ANCHORS_MIN, max: ANCHORS_MAX } };
  const malformed = anchors.find((a) => !BATTLE_TAG.test(a));
  if (malformed !== undefined) return { name: "problem_anchor_format", named: { tag: malformed } };
  if (draft.reason.trim().length > REASON_MAX_LENGTH) return { name: "problem_reason_long", named: { max: REASON_MAX_LENGTH } };
  return null;
}

function requireIso(value: string): string {
  const iso = utcInputToIso(value);
  if (iso === null) throw new Error(`Not a valid UTC date: ${value}`);
  return iso;
}

/** For a draft without problems. */
export function toPreviewRequest(draft: SmurfEventDraft): SmurfEventPreviewRequest {
  return { name: draft.name.trim(), from: requireIso(draft.from), to: requireIso(draft.to), anchors: anchorsOf(draft) };
}

/** For a draft without problems; the reason only when one was entered. */
export function toManualRequest(draft: SmurfEventDraft): ManualEventRequest {
  const reason = draft.reason.trim();
  return reason === "" ? toPreviewRequest(draft) : { ...toPreviewRequest(draft), reason };
}

/**
 * What a preview depends on: the span and the anchors (in any order). The name and reason do not
 * change it, so editing them keeps the preview. Null while the draft has a problem.
 */
export function previewKey(draft: SmurfEventDraft): string | null {
  if (draftProblem(draft) !== null) return null;
  const { from, to, anchors } = toPreviewRequest(draft);
  return JSON.stringify([from, to, [...anchors].sort()]);
}

export interface PreviewState {
  preview: SmurfEventPreview | null;
  /** The {@link previewKey} of the draft `preview` was made for. */
  key: string | null;
  loading: boolean;
}

export type SaveBlocker = "invalid" | "preview_loading" | "preview_needed" | "preview_stale" | "preview_refused";

/** Why Save is not offered yet, or null: it needs a valid draft and a non-refused preview of it. */
export function saveBlocker(draft: SmurfEventDraft, state: PreviewState): SaveBlocker | null {
  const current = previewKey(draft);
  if (current === null) return "invalid";
  if (state.loading) return "preview_loading";
  if (state.preview === null || state.key === null) return "preview_needed";
  if (state.key !== current) return "preview_stale";
  if (state.preview.refused !== undefined) return "preview_refused";
  return null;
}
