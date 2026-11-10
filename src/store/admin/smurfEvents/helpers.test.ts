import { test } from "vitest";
import { strict as assert } from "node:assert";
import { SmurfEventsApiError } from "@/services/admin/SmurfEventsService";
import type { SmurfEventDetail, SmurfEventPreview, SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { reviewDecisions, reviewNeedsReason, smurfEventActions } from "./actions";
import { draftFromEvent, draftProblem, emptyDraft, previewKey, saveBlocker, type SmurfEventDraft, toManualRequest, toPreviewRequest } from "./draft";
import { errorText, exclusionLabel, originLabel, refusalLabel, reviewColor, reviewLabel } from "./labels";
import { translateEn as t } from "./translate.testing";

const DRAFT: SmurfEventDraft = { name: "LAN party", from: "2026-10-01T00:00", to: "2026-10-03T00:00", anchors: ["Anchor#1001", "Anchor#1002"], reason: "" };
const PREVIEW: SmurfEventPreview = { networks: [], excluded: [], counts: { machines: 0, attendees: 0 }, endsLinks: [] };

function summary(id: string, review: SmurfEventSummary["review"]): SmurfEventSummary {
  return {
    id,
    name: id,
    origin: "detected",
    review,
    from: "2026-10-01T00:00:00.000Z",
    to: "2026-10-02T00:00:00.000Z",
    counts: { networks: 1, machines: 1, attendees: 1, homes: 1 },
    endedLinks: 0,
    createdAt: "2026-10-03T00:00:00.000Z",
  };
}

test("an empty draft spans the previous UTC day and has no anchors", () => {
  const draft = emptyDraft(new Date("2026-10-05T13:45:00.000Z"));

  assert.deepEqual(draft, { name: "", from: "2026-10-04T00:00", to: "2026-10-05T00:00", anchors: [], reason: "" });
});

test("a manual event's draft uses the span and anchors the moderator entered", () => {
  const event = {
    ...summary("1", "unreviewed"),
    origin: "manual",
    name: "LAN party",
    from: "2026-10-01T06:00:00.000Z",
    to: "2026-10-02T22:00:00.000Z",
    requested: { from: "2026-10-01T00:00:00.000Z", to: "2026-10-03T00:00:00.000Z" },
    anchors: ["Anchor#1001", "Anchor#1002"],
  } as SmurfEventDetail;

  assert.deepEqual(draftFromEvent(event), DRAFT);
});

test("draftProblem checks name, dates, anchors and reason in field order", () => {
  assert.equal(draftProblem(DRAFT), null);
  assert.equal(draftProblem({ ...DRAFT, name: "   " })?.name, "problem_name");
  assert.equal(draftProblem({ ...DRAFT, name: "x".repeat(101) })?.name, "problem_name_long");
  assert.equal(draftProblem({ ...DRAFT, from: "" })?.name, "problem_dates");
  assert.equal(draftProblem({ ...DRAFT, to: DRAFT.from })?.name, "problem_order");
  assert.equal(draftProblem({ ...DRAFT, anchors: ["Anchor#1001"] })?.name, "problem_anchors");
  assert.equal(draftProblem({ ...DRAFT, anchors: ["Anchor#1001", " Anchor#1001 "] })?.name, "problem_anchors");
  assert.equal(draftProblem({ ...DRAFT, anchors: Array.from({ length: 21 }, (_, i) => `Anchor#${i}`) })?.name, "problem_anchors");
  assert.deepEqual(draftProblem({ ...DRAFT, anchors: ["Anchor#1001", "not a tag"] }), { name: "problem_anchor_format", named: { tag: "not a tag" } });
  assert.equal(draftProblem({ ...DRAFT, reason: "x".repeat(1001) })?.name, "problem_reason_long");
});

test("requests trim the name and anchors, drop duplicate anchors and send the reason only when given", () => {
  const draft = { ...DRAFT, name: "  LAN party ", anchors: [" Anchor#1001", "Anchor#1001", "Anchor#1002 "] };

  assert.deepEqual(toPreviewRequest(draft), { name: "LAN party", from: "2026-10-01T00:00:00.000Z", to: "2026-10-03T00:00:00.000Z", anchors: ["Anchor#1001", "Anchor#1002"] });
  assert.equal(Object.hasOwn(toManualRequest(draft), "reason"), false);
  assert.equal(toManualRequest({ ...draft, reason: " known LAN " }).reason, "known LAN");
});

test("the preview key follows the span and anchors, not the name, reason or anchor order", () => {
  const key = previewKey(DRAFT);

  assert.notEqual(key, null);
  assert.equal(previewKey({ ...DRAFT, name: "Other", reason: "why" }), key);
  assert.equal(previewKey({ ...DRAFT, anchors: [...DRAFT.anchors].reverse() }), key);
  assert.notEqual(previewKey({ ...DRAFT, to: "2026-10-04T00:00" }), key);
  assert.equal(previewKey({ ...DRAFT, anchors: [] }), null);
});

test("saveBlocker allows Save only after a non-refused preview of the current draft", () => {
  const current = { preview: PREVIEW, key: previewKey(DRAFT), loading: false };

  assert.equal(saveBlocker(DRAFT, current), null);
  assert.equal(saveBlocker({ ...DRAFT, name: "" }, current), "invalid");
  assert.equal(saveBlocker(DRAFT, { preview: null, key: null, loading: false }), "preview_needed");
  assert.equal(saveBlocker(DRAFT, { ...current, loading: true }), "preview_loading");
  assert.equal(saveBlocker({ ...DRAFT, to: "2026-10-04T00:00" }, current), "preview_stale");
  assert.equal(saveBlocker(DRAFT, { ...current, preview: { ...PREVIEW, refused: "too-long" } }), "preview_refused");
});

test("moderators with administration may review any event and edit or delete only manual ones", () => {
  assert.deepEqual(smurfEventActions({ origin: "manual" }, true), { review: true, edit: true, delete: true });
  assert.deepEqual(smurfEventActions({ origin: "detected" }, true), { review: true, edit: false, delete: false });
  assert.deepEqual(smurfEventActions({ origin: "manual" }, false), { review: false, edit: false, delete: false });
});

test("the review decisions offered are the ones other than the current review", () => {
  assert.deepEqual(reviewDecisions("unreviewed"), ["confirmed", "denied"]);
  assert.deepEqual(reviewDecisions("denied"), ["confirmed", "unreviewed"]);
});

test("a deny needs a reason; confirm and unreview do not", () => {
  assert.equal(reviewNeedsReason("denied"), true);
  assert.equal(reviewNeedsReason("confirmed"), false);
  assert.equal(reviewNeedsReason("unreviewed"), false);
});

test("origins, reviews, refusals and exclusions have labels; unknown values show as sent", () => {
  assert.equal(originLabel("carried-over", t), "Carried over");
  assert.equal(originLabel("manual", t), "Manual");
  assert.equal(originLabel("future" as never, t), "future");
  assert.equal(reviewLabel("unreviewed", t), "Unreviewed");
  assert.equal(reviewColor("unreviewed"), "warning");
  assert.equal(reviewColor("confirmed"), "success");
  assert.equal(refusalLabel("no-venue", t), "No shared location was found for these players in this span.");
  assert.equal(exclusionLabel("home", t), "Home network");
  assert.equal(exclusionLabel("other" as never, t), "other");
});

test("errorText shows the server's message, else a generic text", () => {
  assert.equal(errorText(new SmurfEventsApiError(409, "Only manual events can be edited", null), t), "Only manual events can be edited");
  assert.equal(errorText(new Error("network"), t), "The request failed. Please try again.");
});
