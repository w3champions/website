import assert from "node:assert/strict";
import { test } from "vitest";
import { banSummary, FIXTURE_NOW, fixtureModeName, machineIdRow } from "./fixtures.testing";
import { hiddenOlderCount, impactIds, impactNeeded, initialPicker, lastUsedText, machineIdsChanged, machineSaveLabel, otherAccountBanText, otherAccountsMoreText, otherAccountsText, pickerFooterText, pickerProblem, pickerSummary, resetToSaved, revealOlder, rowNote, selectNone, selectRecommended, toggleId, visibleRows } from "./machinePicker";
import { translateEn as t } from "./translate.testing";
import type { BanSummary, OtherAccount } from "./types";

const now = FIXTURE_NOW;
const issued = "2026-11-02T00:00:00.000Z";
const rows = [
  machineIdRow({ machineId: "a", lastUsed: "2026-11-13T00:00:00.000Z", recommended: true, otherAccountCount: 2 }),
  machineIdRow({ machineId: "b", lastUsed: "2026-11-10T00:00:00.000Z", shared: true, recommended: false, otherAccountCount: 200, otherAccountsCapped: true }),
  machineIdRow({ machineId: "c", lastUsed: "2026-06-01T00:00:00.000Z", recommended: false }),
  machineIdRow({ machineId: "d", firstUsed: null, lastUsed: null, recommended: false }),
];
test("Add starts from the server's recommended flag", () => assert.deepEqual(initialPicker(rows).ticked, ["a"]));
test("ticked first, then last used; old unticked IDs sit behind Show older", () => {
  const s = initialPicker(rows);
  assert.deepEqual(visibleRows(s, now).map((r) => r.row.machineId), ["a", "b"]);
  assert.equal(hiddenOlderCount(s, now), 2);
  assert.deepEqual(visibleRows(revealOlder(s), now).map((r) => r.row.machineId), ["a", "b", "c", "d"]);
});
test("ticking does not move rows and a ticked old ID stays visible", () => {
  const s = toggleId(revealOlder(initialPicker(rows)), "d");
  assert.deepEqual(visibleRows(s, now).map((r) => r.row.machineId), ["a", "b", "c", "d"]);
  assert.equal(hiddenOlderCount({ ...s, showOlder: false }, now), 1); // c hidden, d ticked stays
});
test("Edit pins the ban's IDs whatever their age and keeps unticked ones in place", () => {
  const s = toggleId(initialPicker(rows, ["c", "a"], issued), "c");
  const v = visibleRows(s, now);
  assert.deepEqual(v.map((r) => r.row.machineId), ["a", "c", "b"]);
  assert.deepEqual(v.map((r) => r.willBeRemoved), [false, true, false]);
  assert.equal(rowNote(v[1], t), "Will be removed from this ban");
});
test("an ID on the ban missing from the account's list is still listed and ticked", () => {
  const s = initialPicker(rows, ["zz"], issued);
  assert.ok(s.ticked.includes("zz"));
  assert.equal(visibleRows(s, now)[0].row.machineId, "zz");
});
test("IDs first used after the ban are marked new and do not join it by themselves", () => {
  const fresh = machineIdRow({ machineId: "n", firstUsed: "2026-11-05T00:00:00.000Z", lastUsed: "2026-11-15T00:00:00.000Z", recommended: true });
  const s = initialPicker([...rows, fresh], ["a"], issued);
  const v = visibleRows(s, now).find((r) => r.row.machineId === "n")!;
  assert.deepEqual([v.newSinceBan, v.ticked], [true, false]);
  assert.equal(rowNote(v, t), "New since this ban");
  assert.equal(resetToSaved(toggleId(s, "n")).ticked.includes("n"), false);
  assert.equal(visibleRows(s, now).find((r) => r.row.machineId === "a")!.newSinceBan, false); // on the ban
  assert.equal(visibleRows(initialPicker([fresh]), now)[0].newSinceBan, false); // Add: no ban to compare with
});
test("an ID first used before the ban, or without a date, is not new", () => {
  const before = machineIdRow({ machineId: "p", firstUsed: "2026-10-01T00:00:00.000Z" });
  const undated = machineIdRow({ machineId: "q", firstUsed: null });
  const v = visibleRows(revealOlder(initialPicker([before, undated], ["aa11bb22"], issued)), now);
  assert.deepEqual(v.filter((r) => r.row.machineId !== "aa11bb22").map((r) => r.newSinceBan), [false, false]);
});
test("removed and added are counted against the ban", () => {
  const s = toggleId(toggleId(initialPicker(rows, ["a", "c"], issued), "c"), "b");
  assert.deepEqual(pickerSummary(s), { selected: 2, total: 4, counted: 1, removed: 1, added: 1 });
  assert.equal(pickerFooterText(pickerSummary(s), null, "edit", t), "2 of 4 selected · 1 removed, 1 added");
  assert.equal(machineIdsChanged(resetToSaved(s)), false);
});
test("IDs labelled 'Not one PC': the same label ticked or not, counted apart, kept on the ban", () => {
  const s = toggleId(initialPicker(rows), "b");
  assert.deepEqual(impactIds(s), ["a"]);
  assert.deepEqual(s.ticked, ["a", "b"]);
  assert.equal(machineSaveLabel(pickerSummary(s), null, "add", t), "Ban account + 1 machine");
  assert.equal(rowNote(visibleRows(s, now)[1], t), "Not one PC");
  assert.equal(rowNote(visibleRows(initialPicker(rows), now)[1], t), "Not one PC");
});
test("Save label and footer repeat the collateral count", () => {
  const s = toggleId(initialPicker(rows), "c");
  assert.equal(machineSaveLabel(pickerSummary(s), { otherAccounts: 2, capped: false }, "add", t), "Ban account + 2 machines · locks out at least 2 other accounts");
  assert.equal(pickerFooterText(pickerSummary(s), { otherAccounts: 1, capped: false }, "add", t), "2 of 4 selected · at least 1 other account uses the selected IDs and will be locked out too");
  assert.equal(machineSaveLabel(pickerSummary(s), { otherAccounts: 0, capped: false }, "edit", t), "Save");
});
test("Recommended, Reset and None", () => {
  const add = selectNone(initialPicker(rows));
  assert.deepEqual([add.ticked, add.pinned], [[], []]);
  assert.deepEqual(selectRecommended(add).ticked, ["a"]);
  const edit = selectNone(initialPicker(rows, ["c"], issued));
  assert.deepEqual([edit.ticked, edit.pinned], [[], ["c"]]);
  assert.deepEqual(resetToSaved(edit).ticked, ["c"]);
});
test("at least one ID is required", () => assert.equal(pickerProblem(selectNone(initialPicker(rows))), "machine_none_selected"));
test("each other account says what it is banned from now, or its last ban", () => {
  const fm = { t, modeName: fixtureModeName, now };
  const other = (state: OtherAccount["state"], ban: Partial<BanSummary> | null): OtherAccount => ({ accountKey: "1002", currentBattleTag: "Тестер#1002", state, ban: ban && banSummary(ban) });
  assert.equal(otherAccountBanText(other("bannedNow", { endDate: "2026-11-24T00:00:00.000Z" }), fm), "Banned now: Everything until 24 Nov");
  assert.equal(otherAccountBanText(other("bannedNow", { gameModes: [1], endDate: null }), fm), "Banned now: Mode 1 permanent");
  assert.equal(otherAccountBanText(other("bannedBefore", { status: "expired", gameModes: [2], endDate: "2026-10-08T00:00:00.000Z" }), fm), "Last ban: Mode 2, ended 8 Oct");
  assert.equal(otherAccountBanText(other("bannedBefore", { status: "revoked" }), fm), "Last ban: All game modes, revoked");
  assert.equal(otherAccountBanText(other("neverBanned", null), fm), "Never banned");
});
test("a duplicate ID on the ban does not make the unchanged selection look changed", () => {
  const edit = initialPicker(rows, ["a", "a", "c"], issued);
  assert.equal(machineIdsChanged(edit), false);
  assert.equal(machineIdsChanged(toggleId(edit, "c")), true);
});
test("an account banned now whose ban is not in effect falls back to the bare modes", () => {
  const fm = { t, modeName: fixtureModeName, now };
  const account: OtherAccount = { accountKey: "1002", currentBattleTag: "Тестер#1002", state: "bannedNow", ban: banSummary({ status: "expired", gameModes: [1], endDate: "2026-10-08T00:00:00.000Z" }) };
  assert.equal(otherAccountBanText(account, fm), "Banned now: Mode 1");
});
test("more accounts than listed say how many", () => {
  const listed = Array.from({ length: 20 }, (_, i) => ({ accountKey: String(2000 + i), currentBattleTag: `Tester#${2000 + i}`, state: "neverBanned" as const, ban: null }));
  assert.equal(otherAccountsMoreText({ total: 35, capped: false, accounts: listed }, t), "First 20 of 35");
  assert.equal(otherAccountsMoreText({ total: 200, capped: true, accounts: listed }, t), "First 20 of 200+");
  assert.equal(otherAccountsMoreText({ total: 3, capped: false, accounts: listed.slice(0, 3) }, t), null);
});
test("cells", () => {
  assert.equal(otherAccountsText(rows[1]), "200+");
  assert.equal(otherAccountsText(rows[0]), "2");
  assert.equal(lastUsedText(rows[0], now, t), "2026-11-13 (2 days ago)");
  assert.equal(lastUsedText(machineIdRow({ lastUsed: "2026-11-15T01:00:00.000Z" }), now, t), "2026-11-15 (today)");
  assert.equal(lastUsedText(rows[3], now, t), "No date known");
});
test("Save needs the impact in Add whenever IDs are counted, in Edit only once they differ from the ban's", () => {
  assert.equal(impactNeeded(initialPicker(rows)), true);
  assert.equal(impactNeeded(selectNone(initialPicker(rows))), false);
  const edit = initialPicker(rows, ["a", "c"], issued);
  assert.equal(impactNeeded(edit), false);
  assert.equal(impactNeeded(toggleId(edit, "c")), true);
  assert.equal(impactNeeded(toggleId(edit, "d")), true);
  assert.equal(impactNeeded(selectNone(edit)), false);
});
