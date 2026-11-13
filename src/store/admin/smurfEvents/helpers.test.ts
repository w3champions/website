import { test } from "vitest";
import { strict as assert } from "node:assert";
import { SmurfEventsApiError } from "@/services/admin/SmurfEventsService";
import type { SmurfEventDetail, SmurfEventPreview, SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { reviewDecisions, reviewNeedsReason, smurfEventActions } from "./actions";
import { draftFromEvent, draftProblem, emptyDraft, previewKey, saveBlocker, type SmurfEventDraft, toManualRequest, toPreviewRequest } from "./draft";
import { countText, errorText, exclusionLabel, factLabel, historyActionLabel, manualEventErrorText, originLabel, previewCountsText, refusalLabel, reviewColor, reviewFactsText, reviewLabel } from "./labels";
import { mergeEvents, outcomeOf, refusedPreviewFrom, summaryOf } from "./events";
import { factSort, factText, sortFromQuery, sortToQuery } from "./facts";
import { translateEn as t } from "./translate.testing";

const DRAFT: SmurfEventDraft = { name: "LAN party", from: "2026-10-01T00:00", to: "2026-10-03T00:00", anchors: ["Anchor#1001", "Anchor#1002"], reason: "" };
const PREVIEW: SmurfEventPreview = { networks: [], excluded: [], counts: { machines: 0, attendees: 0 }, endsLinks: [] };

function summary(id: string, review: SmurfEventSummary["review"]): SmurfEventSummary {
  return {
    id,
    name: id,
    named: false,
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

test("a preview request names the event it replaces only when one is given", () => {
  assert.equal(Object.hasOwn(toPreviewRequest(DRAFT), "replacing"), false);
  assert.equal(Object.hasOwn(toPreviewRequest(DRAFT, null), "replacing"), false);
  assert.equal(toPreviewRequest(DRAFT, "ev1").replacing, "ev1");
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

test("any event may be reviewed and only manual ones edited or deleted", () => {
  assert.deepEqual(smurfEventActions({ origin: "manual" }), { review: true, edit: true, delete: true });
  assert.deepEqual(smurfEventActions({ origin: "detected" }), { review: true, edit: false, delete: false });
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
  assert.equal(reviewColor("confirmed"), "primary");
  assert.equal(refusalLabel("no-venue", t), "No shared location was found for these players in this span.");
  assert.equal(exclusionLabel("home", t), "Home network");
  assert.equal(exclusionLabel("other" as never, t), "other");
});

test("errorText shows the server's message, else a generic text", () => {
  assert.equal(errorText(new SmurfEventsApiError(409, "Only manual events can be edited", null), t), "Only manual events can be edited");
  assert.equal(errorText(new Error("network"), t), "The request failed. Please try again.");
});

test("manual event routes show a tailored text for 503 and the usual text otherwise", () => {
  const notReady = new SmurfEventsApiError(503, "Index still building", null);
  assert.match(manualEventErrorText(notReady, t), /still preparing the data manual events need.*Try again later/);
  assert.equal(errorText(notReady, t), "Index still building");
  assert.equal(manualEventErrorText(new SmurfEventsApiError(400, "Bad anchors", null), t), "Bad anchors");
  assert.equal(manualEventErrorText(new Error("network"), t), "The request failed. Please try again.");
});

test("a busy answer says how long to wait when the server gave a wait, else the usual text", () => {
  const usual = "The server is busy right now. Nothing was saved. Try again in a moment.";
  assert.equal(manualEventErrorText(new SmurfEventsApiError(429, null, null), t), usual);
  assert.equal(manualEventErrorText(new SmurfEventsApiError(429, null, null, null), t), usual);
  assert.equal(manualEventErrorText(new SmurfEventsApiError(429, null, null, 30), t), "The server is busy right now. Nothing was saved. Try again in 30 seconds.");
  assert.equal(manualEventErrorText(new SmurfEventsApiError(429, null, null, 1), t), "The server is busy right now. Nothing was saved. Try again in 1 second.");
});

test("counts use the singular form for one", () => {
  assert.equal(countText("preview_ends_links", 1, t), "Saving ends 1 link");
  assert.equal(countText("preview_ends_links", 2, t), "Saving ends 2 links");
  assert.equal(countText("preview_anchors", 1, t), "1 anchor");
  assert.equal(countText("deny_links", 1, t), "Denying brings back 1 link");
  assert.equal(countText("deny_links", 0, t), "Denying brings back 0 links");
  assert.equal(previewCountsText({ machines: 1, attendees: 3 }, t), "1 machine, 3 attendees");
});

test("mergeEvents keeps the server order and replaces a repeated event in its first place", () => {
  const merged = mergeEvents([summary("a", "unreviewed"), summary("b", "confirmed")], [summary("c", "confirmed"), summary("a", "denied"), summary("c", "denied")]);
  assert.deepEqual(merged.map((e) => `${e.id}:${e.review}`), ["a:denied", "b:confirmed", "c:denied"]);
});

test("summaryOf keeps the list-row fields only, and outcomeOf separates the applied flag", () => {
  const detail: SmurfEventDetail = {
    ...summary("a", "confirmed"),
    reviewedBy: "Mod#1",
    attendees: [],
    networks: [],
    machines: [],
    evidence: { networkDaysBefore: 0, networkDaysAfter: 0, returningAttendees: 0 },
    endedLinksList: [],
    notCounted: [],
    recorded: {},
    evidenceRecorded: true,
  };
  assert.deepEqual(Object.keys(summaryOf(detail)).sort(), ["counts", "createdAt", "endedLinks", "from", "id", "name", "named", "origin", "review", "reviewedBy", "to"]);
  const facts = { at: "2026-10-05T00:00:00.000Z", networks: 1, identifiers: 2, attendees: 3, notCounted: 0, endedLinks: 0 };
  assert.deepEqual(summaryOf({ ...detail, named: true, facts }).facts, facts);
  assert.equal(summaryOf({ ...detail, named: true }).named, true);
  assert.equal(outcomeOf({ ...detail, applied: false }).applied, false);
  assert.equal(outcomeOf(detail).applied, true);
  assert.equal(outcomeOf(detail).applies, true);
  assert.equal(outcomeOf({ ...detail, applies: true }).applies, true);
  assert.equal(outcomeOf({ ...detail, applies: false }).applies, false);
  assert.equal("applies" in outcomeOf({ ...detail, applies: false }).detail, false);
  assert.equal("applied" in outcomeOf({ ...detail, applied: false }).detail, false);
});

test("a 422 preview is used only with the shape the dialog reads, and counts as refused", () => {
  assert.equal(refusedPreviewFrom(null), null);
  assert.equal(refusedPreviewFrom({ error: "x" }), null);
  assert.equal(refusedPreviewFrom({ preview: { ...PREVIEW, networks: "none" } }), null);
  assert.equal(refusedPreviewFrom({ preview: { ...PREVIEW, endsLinks: [{ a: 1 }] } }), null);
  assert.equal(refusedPreviewFrom({ preview: { ...PREVIEW, counts: undefined } }), null);
  assert.equal(refusedPreviewFrom({ preview: { ...PREVIEW, refused: "too-long" } })?.refused, "too-long");
  assert.equal(refusedPreviewFrom({ preview: PREVIEW })?.refused, "no-venue");
});

test("history actions and facts read as labels, and an unknown one as sent", () => {
  assert.equal(historyActionLabel("event-rename", t), "Renamed");
  assert.equal(historyActionLabel("event-future", t), "event-future");
  assert.equal(factLabel("maxAccountsEver", t), "Most accounts ever on one identifier");
  assert.equal(factLabel("future", t), "future");
});

test("a review entry's facts read in a fixed order and an entry without facts reads as none", () => {
  assert.equal(reviewFactsText({ factsEndedLinks: 4, factsNetworks: 2, factsLiveLinks: 0, reason: "x" }, t), "Networks 2, Links ended 4, Links among attendees still live 0");
  assert.equal(reviewFactsText({ previousName: "A" }, t), null);
});

test("a review entry's fact numbers read through the same factText as the list: at least N when capped", () => {
  assert.equal(
    reviewFactsText({ factsNetworks: 2, factsMaxAccountsEver: 31, factsMaxAccountsEverCapped: true, factsLiveLinks: 12, factsLiveLinksCapped: true, factsEndedLinks: 4 }, t),
    "Networks 2, Most accounts ever on one identifier at least 31, Links ended 4, Links among attendees still live at least 12",
  );
  assert.equal(reviewFactsText({ factsMaxAccountsEver: 31, factsMaxAccountsEverCapped: false }, t), "Most accounts ever on one identifier 31");
});

test("a review entry's truncated-table flag makes identifiers and most accounts read at least N, a timeout says so, and a number wins over the timeout flag", () => {
  assert.equal(reviewFactsText({ factsIdentifiers: 14, factsMaxAccountsEver: 9, factsIdentifiersTruncated: true }, t), "Identifiers at least 14, Most accounts ever on one identifier at least 9");
  assert.equal(reviewFactsText({ factsNetworks: 2, factsLiveLinksTimedOut: true }, t), "Networks 2, Links among attendees still live could not be counted");
  assert.equal(reviewFactsText({ factsLiveLinks: 3, factsLiveLinksTimedOut: true }, t), "Links among attendees still live 3");
});

test("a 422 preview keeps its applies flag", () => {
  assert.equal(refusedPreviewFrom({ preview: { ...PREVIEW, applies: false } })?.applies, false);
});

test("factText shows a dash for an unknown value, the number, or the capped number as at least N", () => {
  assert.equal(factText(undefined, undefined, t), "\u2014");
  assert.equal(factText(12, undefined, t), "12");
  assert.equal(factText(0, undefined, t), "0");
  assert.equal(factText(7, true, t), "at least 7");
  assert.equal(factText(undefined, true, t), "\u2014");
});

test("factSort puts an unknown value after every number", () => {
  assert.ok(factSort(1, 2) < 0);
  assert.ok(factSort(2, 1) > 0);
  assert.equal(factSort(3, 3), 0);
  assert.ok(factSort(undefined, 0) > 0);
  assert.ok(factSort(0, undefined) < 0);
  assert.equal(factSort(undefined, undefined), 0);
});

test("the sort round-trips through the URL value and an unknown or malformed value means the default order", () => {
  const columns = ["facts.identifiers", "facts.networks"];

  assert.equal(sortToQuery({ key: "facts.identifiers", order: "desc" }), "facts.identifiers:desc");
  assert.deepEqual(sortFromQuery("facts.identifiers:desc", columns), { key: "facts.identifiers", order: "desc" });
  assert.deepEqual(sortFromQuery("facts.networks:asc", columns), { key: "facts.networks", order: "asc" });
  for (const bad of [undefined, "", "facts.identifiers", "facts.identifiers:up", "name:asc", ":asc", ["facts.networks:asc"], null]) assert.equal(sortFromQuery(bad, columns), null);
});
