import { test } from "vitest";
import { strict as assert } from "node:assert";
import { translateEn as t } from "./translate.testing";
import { itemFlagLabels, reportStatusLabel, sourceLabel, tombstoneReasonLabel, verdictKindOf } from "./labels";
import { itemActions, pairActions } from "./actions";
import { actionDialogCopy, holdersText } from "./dialogCopy";
import { actionResultLines } from "./result";
import { appendAuditPage, auditActionLabel, auditOutcomeText, auditTargetText } from "./audit";
import { errorText } from "./errors";
import { HardwareSmurfApiError } from "@/services/admin/HardwareSmurfService";
import type { AuditEntry, HardwareLink } from "@/services/admin/smurf-detection/HardwareSmurfResponse";

function link(overrides: Partial<HardwareLink> = {}): HardwareLink {
  return {
    _id: "A#1|B#2",
    a: "A#1",
    b: "B#2",
    source: "hardware",
    createdAt: "2026-10-01T10:00:00.000Z",
    lastConfirmedAt: "2026-10-02T10:00:00.000Z",
    evidence: { matched: [] },
    ...overrides,
  };
}

// --- labels ---

test("tombstone reasons map to plain-language labels", () => {
  assert.equal(tombstoneReasonLabel("location-veto", t), "Ruled out: seen in different places at the same time");
  assert.equal(tombstoneReasonLabel("venue", t), "Shared location (venue)");
  assert.equal(tombstoneReasonLabel("rule-no-longer-met", t), "Evidence no longer sufficient");
  assert.equal(tombstoneReasonLabel("over-cap", t), "Paused, comes back automatically");
  assert.equal(tombstoneReasonLabel("not-smurf", t), "Marked not a smurf by a moderator");
  assert.equal(tombstoneReasonLabel("verdict-revoked", t), "Moderator confirmation revoked");
  assert.equal(tombstoneReasonLabel("no-shared-internal", t), "Ruled out: different hardware");
});

test("an unknown or missing tombstone reason shows as Ended", () => {
  assert.equal(tombstoneReasonLabel("something-new", t), "Ended");
  assert.equal(tombstoneReasonLabel(undefined, t), "Ended");
  assert.equal(tombstoneReasonLabel("constructor", t), "Ended");
});

test("sources have labels and an unknown source shows as sent", () => {
  assert.equal(sourceLabel("hardware", t), "Hardware");
  assert.equal(sourceLabel("legacy-machineguid", t), "Legacy");
  assert.equal(sourceLabel("moderator", t), "Moderator");
  assert.equal(sourceLabel("account", t), "Account");
  assert.equal(sourceLabel("future", t), "future");
});

test("a verdict without kind is not-smurf", () => {
  assert.equal(verdictKindOf(undefined), null);
  assert.equal(verdictKindOf({ author: "M#1", reason: "r", at: "x" }), "not-smurf");
  assert.equal(verdictKindOf({ kind: "smurf", author: "M#1", reason: "r", at: "x" }), "smurf");
});

test("report status reads pending, delivered or none", () => {
  assert.equal(reportStatusLabel(link({ reportPending: true }), t), "Report pending");
  assert.equal(reportStatusLabel(link({ reportedAt: "2026-10-03T08:30:00.000Z" }), t), "Reported 2026-10-03 08:30 UTC");
  assert.equal(reportStatusLabel(link(), t), "—");
});

test("item flags show only what the server marked", () => {
  const none = itemFlagLabels({ stat: { common: false, overCap: false, placeholder: false }, trusted: false, ignored: false }, t);
  assert.deepEqual(none, []);

  const all = itemFlagLabels({ stat: { common: true, overCap: true, placeholder: true }, trusted: true, ignored: true }, t);
  assert.deepEqual(all.map((f) => f.label), ["Excluded: shared", "Excluded: over the account cap", "Excluded: placeholder", "Trusted", "Ignored"]);

  assert.deepEqual(itemFlagLabels({ stat: null }, t).map((f) => f.label), ["No stats yet"]);
});

// --- actions ---

test("no actions without SmurfCheckerAdministration", () => {
  assert.deepEqual(pairActions(link(), false), []);
  assert.deepEqual(itemActions({ trusted: false, ignored: false }, false), []);
});

test("a pair without a verdict offers both verdicts", () => {
  assert.deepEqual(pairActions(link(), true), [
    { action: "smurf", replaces: null },
    { action: "not-smurf", replaces: null },
  ]);
  assert.deepEqual(pairActions(link({ invalidatedAt: "2026-10-03T00:00:00.000Z", invalidReason: "venue" }), true), [
    { action: "smurf", replaces: null },
    { action: "not-smurf", replaces: null },
  ]);
});

test("a confirmed pair offers its revoke and the replacing not-smurf", () => {
  const confirmed = link({ verdict: { kind: "smurf", author: "M#1", reason: "r", at: "x" }, source: "moderator" });
  assert.deepEqual(pairActions(confirmed, true), [
    { action: "revoke-smurf", replaces: null },
    { action: "not-smurf", replaces: "smurf" },
  ]);
});

test("a refuted pair (also a legacy verdict without kind) offers its revoke and the replacing confirm", () => {
  const refuted = link({ invalidatedAt: "x", invalidReason: "not-smurf", verdict: { author: "M#1", reason: "r", at: "x" } });
  assert.deepEqual(pairActions(refuted, true), [
    { action: "revoke-not-smurf", replaces: null },
    { action: "smurf", replaces: "not-smurf" },
  ]);
});

test("item actions follow the trusted and ignored state", () => {
  assert.deepEqual(itemActions({ trusted: false, ignored: false }, true), [
    { action: "trust", replaces: null },
    { action: "ignore", replaces: null },
  ]);
  assert.deepEqual(itemActions({ trusted: true, ignored: false }, true), [
    { action: "revoke-trust", replaces: null },
    { action: "ignore", replaces: "trust" },
  ]);
  assert.deepEqual(itemActions({ trusted: false, ignored: true }, true), [
    { action: "revoke-ignore", replaces: null },
    { action: "trust", replaces: "ignore" },
  ]);
  assert.deepEqual(itemActions({ trusted: true, ignored: true }, true), [
    { action: "revoke-trust", replaces: null },
    { action: "revoke-ignore", replaces: null },
  ]);
});

// --- dialog copy ---

test("holder count text: singular, plural and capped", () => {
  assert.equal(holdersText({ count: 1, capped: false }, t), "1 account holds this item");
  assert.equal(holdersText({ count: 37, capped: false }, t), "37 accounts hold this item");
  assert.equal(holdersText({ count: 1000, capped: true }, t), "1000+ accounts hold this item");
});

test("the trust dialog shows the holder count and warns that a shared item links everyone on it", () => {
  const copy = actionDialogCopy({ action: "trust", replaces: null, battleTag: "Foo#1", item: { kind: "disk", hash8: "0a1b2c3d" }, holders: { count: 12, capped: false } }, t);

  assert.equal(copy.needsReason, true);
  assert.equal(copy.tone, "error");
  assert.equal(copy.holders, "12 accounts hold this item");
  assert.match(copy.warning ?? "", /links everyone/);
  assert.match(copy.body, /0a1b2c3d/);
  assert.equal(copy.replaceNotice, null);
});

test("the ignore dialog shows the capped holder count and a wide-impact warning", () => {
  const copy = actionDialogCopy({ action: "ignore", replaces: "trust", battleTag: "Foo#1", item: { kind: "disk", hash8: "0a1b2c3d" }, holders: { count: 1000, capped: true } }, t);

  assert.equal(copy.tone, "warning");
  assert.equal(copy.holders, "1000+ accounts hold this item");
  assert.match(copy.warning ?? "", /every account/);
  assert.match(copy.replaceNotice ?? "", /replaces the trust/);
});

test("the holder line is absent while the count is unknown", () => {
  const copy = actionDialogCopy({ action: "trust", replaces: null, battleTag: "Foo#1", item: { kind: "disk", hash8: "0a1b2c3d" }, holders: null }, t);
  assert.equal(copy.holders, null);
});

test("pair dialogs name both accounts and say when they replace the opposite verdict", () => {
  const confirm = actionDialogCopy({ action: "smurf", replaces: "not-smurf", battleTag: "A#1", other: "B#2" }, t);
  assert.match(confirm.body, /A#1/);
  assert.match(confirm.body, /B#2/);
  assert.match(confirm.replaceNotice ?? "", /replaces the "Not a smurf" verdict/);
  assert.equal(confirm.needsReason, true);

  const revoke = actionDialogCopy({ action: "revoke-smurf", replaces: null, battleTag: "A#1", other: "B#2" }, t);
  assert.equal(revoke.needsReason, false);
  assert.equal(revoke.replaceNotice, null);
});

// --- result ---

test("result lines show what the server returned, nothing more", () => {
  assert.deepEqual(actionResultLines({ message: "Smurf verdict revoked; the link is back under engine control", outcome: "released" }, t), [
    "Smurf verdict revoked; the link is back under engine control",
    "Outcome: released",
  ]);
  assert.deepEqual(actionResultLines({ message: "Item trusted", queued: 3, ignoreRemoved: 1 }, t), ["Item trusted", "Ignore removed", "3 accounts queued for a re-check"]);
  assert.deepEqual(actionResultLines({ message: "Not-smurf verdict set", replaced: "smurf" }, t), ["Not-smurf verdict set", "Replaced: Confirmed smurf"]);
  assert.deepEqual(actionResultLines({ message: "again", repaired: true, trustRemoved: 0 }, t), ["again", "Repaired: the earlier change was applied again"]);
});

// --- audit ---

test("audit actions have labels; an unknown one shows as sent", () => {
  assert.equal(auditActionLabel("trust-add", t), "Trusted item");
  assert.equal(auditActionLabel("verdict-revoke", t), "Revoked verdict");
  assert.equal(auditActionLabel("brand-new", t), "brand-new");
});

test("audit targets read as accounts and hash8 only", () => {
  assert.equal(auditTargetText({ kind: "pair", a: "A#1", b: "B#2" }), "A#1 ↔ B#2");
  assert.equal(auditTargetText({ kind: "item", battleTag: "A#1", hash8: "0a1b2c3d", itemKind: "disk" }), "disk 0a1b2c3d (A#1)");
  assert.equal(auditTargetText({ kind: "identifier", type: "hardwareItem", valueHash8: "deadbeef" }), "hardwareItem deadbeef");
});

test("audit outcome shows the set values and skips null and false", () => {
  assert.equal(auditOutcomeText({ replaced: "smurf", repaired: false, queued: 4, verdict: null }, t), "Replaced: smurf · Queued: 4");
  assert.equal(auditOutcomeText({}, t), "—");
  assert.equal(auditOutcomeText({ somethingNew: "x" }, t), "somethingNew: x");
});

function entry(id: string): AuditEntry {
  return { id, at: "2026-10-01T10:00:00.000Z", author: "M#1", action: "trust-add", target: { kind: "pair", a: "A#1", b: "B#2" }, accounts: ["A#1"], outcome: {} };
}

test("appendAuditPage appends, drops duplicates and keeps the new cursor", () => {
  const first = appendAuditPage(null, { entries: [entry("1"), entry("2")], next: "c1" });
  assert.deepEqual(first.entries.map((e) => e.id), ["1", "2"]);
  assert.equal(first.next, "c1");

  const second = appendAuditPage(first, { entries: [entry("2"), entry("3")], next: null });
  assert.deepEqual(second.entries.map((e) => e.id), ["1", "2", "3"]);
  assert.equal(second.next, null);
  assert.deepEqual(first.entries.map((e) => e.id), ["1", "2"], "the previous page list is not mutated");
});

// --- errors ---

test("errorText shows the server's message, else a generic one", () => {
  assert.equal(errorText(new HardwareSmurfApiError(409, "The pair changed meanwhile; read it again"), t), "The pair changed meanwhile; read it again");
  assert.equal(errorText(new HardwareSmurfApiError(502, null), t), "The request failed. Please try again.");
  assert.equal(errorText(new TypeError("Failed to fetch"), t), "The request failed. Please try again.");
});
