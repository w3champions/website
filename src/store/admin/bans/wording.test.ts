import assert from "node:assert/strict";
import { test } from "vitest";
import { banView, FIXTURE_NOW, fixtureModeName } from "./fixtures.testing";
import { authorName } from "./tags";
import { translateEn as t } from "./translate.testing";
import { bannedAsText, changeLine, endsText, endsTooltip, isRenamed, issuedText, lastChangeByText, lastChangeByTooltip, lastChangeText, modesText, revokedNoticeText, shownReasonOf, statusLabel, statusWords } from "./wording";

const now = FIXTURE_NOW;
const f = { t, modeName: fixtureModeName, now };
const names = (id: string) => (id === "t1" ? "Translation one" : undefined);
const change = (field: "endDate" | "gameModes" | "banReason" | "userVisibleBanReason", old: unknown, next: unknown) => ({ at: "2026-11-15T08:40:00.000Z", by: "ModTwo#3002", field, old, new: next });

test("status words under the end date", () => {
  assert.equal(statusWords(banView({ endDate: "2026-11-21T09:00:00.000Z" }), now, t), "6 days left");
  assert.equal(statusWords(banView({ endDate: "2026-11-16T09:00:00.000Z" }), now, t), "1 day left");
  assert.equal(statusWords(banView({ endDate: "2026-11-15T20:00:00.000Z" }), now, t), "ends today");
  assert.equal(statusWords(banView({ endDate: null }), now, t), "in effect");
  assert.equal(statusWords(banView({ status: "expired", endDate: "2026-11-12T12:00:00.000Z" }), now, t), "expired 3 d ago");
  assert.equal(statusWords(banView({ status: "expired", endDate: "2026-11-15T06:00:00.000Z" }), now, t), "expired today");
  assert.equal(statusWords(banView({ status: "expired", endDate: "2026-08-01T00:00:00.000Z" }), now, t), "expired");
  assert.equal(statusWords(banView({ status: "revoked", revoked: { at: "2026-11-15T09:45:00.000Z", by: "ModTwo#3002", note: "Test note" } }), now, t), "revoked 15 Nov");
});
test("status labels", () => {
  assert.deepEqual((["inEffect", "expired", "revoked"] as const).map((s) => statusLabel(s, t)), ["In effect", "Expired", "Revoked"]);
});
test("ends line and tooltip", () => {
  assert.deepEqual([endsText(banView(), t), endsTooltip(banView(), t)], ["2026-12-02", "2026-12-02 00:00 UTC"]);
  assert.deepEqual([endsText(banView({ endDate: null }), t), endsTooltip(banView({ endDate: null }), t)], ["Permanent", "No end date"]);
});
test("last change is prefixed only for edits and revokes", () => {
  assert.equal(lastChangeText(banView(), now, t), "2 Nov 00:00");
  assert.equal(lastChangeText(banView({ lastChange: { kind: "edited", at: "2026-11-15T08:40:00.000Z", by: "ModTwo#3002" } }), now, t), "Edited 15 Nov 08:40");
  assert.equal(lastChangeText(banView({ lastChange: { kind: "revoked", at: "2025-03-04T17:30:00.000Z", by: "ModTwo#3002" } }), now, t), "Revoked 2025-03-04");
});
test("who changed it, with the issuer only when someone else", () => {
  const edited = banView({ issuedBy: "Helper(bot)", lastChange: { kind: "edited", at: "2026-11-15T08:40:00.000Z", by: "ModTwo#3002" } });
  assert.equal(lastChangeByText(banView(), t), "ModOne");
  assert.equal(lastChangeByText(edited, t), "ModTwo · issued by Helper(bot)");
  assert.equal(lastChangeByTooltip(edited, t), "ModTwo#3002, issued by Helper(bot)");
  assert.equal(lastChangeByTooltip(banView(), t), "ModOne#3001");
  assert.equal(lastChangeByText(banView({ issuedBy: "Mod One", lastChange: { kind: "revoked", at: "2026-11-15T08:40:00.000Z", by: "Mod Two" } }), t), "Mod Two · issued by Mod One");
  assert.equal(authorName("Mod Two"), "Mod Two");
});
test("banned-as and issued lines", () => {
  assert.equal(bannedAsText(banView(), t), "Banned as Tester#1001");
  assert.equal(bannedAsText(banView({ battleTag: "Тестер#1002", currentBattleTag: "тестер#1002" }), t), "Banned as Тестер#1002");
  assert.equal(isRenamed(banView({ battleTag: "Тестер#1002", currentBattleTag: "тестер#1002" })), false);
  assert.equal(isRenamed(banView({ currentBattleTag: "Тестер#1002" })), true);
  assert.equal(bannedAsText(banView({ currentBattleTag: "Тестер#1002" }), t), "Banned as Tester#1001 (now Тестер#1002)");
  assert.equal(issuedText(banView({ issuedBy: "Helper(bot)" }), t), "Issued 2026-11-02 00:00 UTC by Helper(bot)");
});
test("modes and the revoke notice", () => {
  assert.equal(modesText([], fixtureModeName, t), "All game modes");
  assert.equal(modesText([2, 1], fixtureModeName, t), "Mode 2, Mode 1");
  assert.equal(revokedNoticeText({ otherBansInEffect: 0 }, t), "Revoked. No ban remains in effect on this account.");
  assert.equal(revokedNoticeText({ otherBansInEffect: 1 }, t), "Revoked. 1 other ban on this account stays in effect.");
  assert.equal(revokedNoticeText({ otherBansInEffect: 3 }, t), "Revoked. 3 other bans on this account stay in effect.");
});
test("a change shows its field and old → new values", () => {
  assert.deepEqual(changeLine(change("endDate", null, "2026-12-19T08:40:00.000Z"), f, names), { field: "End", old: "Permanent", new: "2026-12-19" });
  assert.deepEqual(changeLine(change("gameModes", [], [2, 4]), f, names), { field: "Game modes", old: "All game modes", new: "Mode 2, Mode 4" });
  assert.equal(changeLine(change("banReason", "x".repeat(70), "short"), f, names).old, `${"x".repeat(59)}…`);
  assert.equal(changeLine(change("banReason", "x".repeat(60), "short"), f, names).old, "x".repeat(60));
  assert.deepEqual(changeLine(change("userVisibleBanReason", { translationId: "t1" }, null), f, names), { field: "Shown to the player", old: "Translation one", new: "nothing" });
});
test("a malformed old value is shown, not thrown", () => {
  assert.equal(changeLine(change("gameModes", "2", [2]), f, names).old, "2");
  assert.equal(changeLine(change("endDate", 5, null), f, names).old, "5");
  assert.equal(changeLine(change("banReason", undefined, "short"), f, names).old, "nothing");
});
test("the reason shown to the player and its kind", () => {
  assert.deepEqual(shownReasonOf({ freeText: "Shown text one" }, names, t), { kind: "free", text: "Shown text one" });
  assert.deepEqual(shownReasonOf({ translationId: "t1" }, names, t), { kind: "translation", text: "Translation one" });
  assert.deepEqual(shownReasonOf({ translationId: "gone" }, names, t), { kind: "translation", text: "[translation not found: gone]" });
  assert.equal(shownReasonOf(undefined, names, t), null);
  assert.equal(shownReasonOf({ freeText: "" }, names, t), null);
});
test("an end date that is not a date is shown as stored", () => {
  assert.equal(changeLine(change("endDate", "not a date", "2026-12-02T00:00:00.000Z"), f, names).old, "not a date");
});
