import assert from "node:assert/strict";
import { test } from "vitest";
import { addProblems, againDraft, type BanDraft, draftFromBan, editProblems, emptyDraft, overlapDraftOf, problemText, revokeNoteProblem, toCreateRequest, toEditRequest, withKind } from "./banForm";
import { banView, FIXTURE_NOW, machineBanView, machineIdRow } from "./fixtures.testing";
import { initialPicker, toggleId } from "./machinePicker";
import { translateEn as t } from "./translate.testing";

const now = FIXTURE_NOW;
const ctx = { accountKey: "1001", now, picker: null };
const filled = { ...emptyDraft(), scope: "modes", gameModes: [2, 4], duration: 3, banReason: " Test reason one " } as BanDraft;
const machinePicker = (ticked: string[]) => ({ ...initialPicker([machineIdRow({ machineId: "a" }), machineIdRow({ machineId: "b", shared: true, recommended: false })]), ticked });
test("an empty Add form names every missing part, in order", () => {
  assert.deepEqual(addProblems(emptyDraft(), { accountKey: null, now, picker: null }), ["player_missing", "scope_missing", "end_missing", "reason_missing"]);
});
test("scope has no default and an empty mode selection is an error", () => {
  assert.deepEqual(addProblems({ ...filled, gameModes: [] }, ctx), ["modes_empty"]);
  assert.deepEqual(addProblems(filled, ctx), []);
});
test("a custom end must parse and lie in the future", () => {
  const custom = { ...filled, duration: "custom" } as BanDraft;
  assert.deepEqual(addProblems({ ...custom, endInput: "2026-02-30T10:00" }, ctx), ["end_invalid"]);
  assert.deepEqual(addProblems({ ...custom, endInput: "2026-11-15T11:00" }, ctx), ["end_past"]);
  assert.deepEqual(addProblems({ ...custom, endInput: "" }, ctx), ["end_missing"]);
  assert.equal(problemText("end_past", t), "The end must be in the future. To end a ban now, use Revoke.");
});
test("the reason is required and at most 2,000 characters", () => {
  assert.deepEqual(addProblems({ ...filled, banReason: "x".repeat(2001) }, ctx), ["reason_too_long"]);
  assert.deepEqual(addProblems({ ...filled, banReason: "x".repeat(2000) }, ctx), []);
  assert.deepEqual(addProblems({ ...filled, banReason: "   " }, ctx), ["reason_missing"]);
});
test("only one of free text and predefined translation", () => {
  assert.deepEqual(addProblems({ ...filled, freeText: "Shown text one", translationId: "t1" }, ctx), ["shown_both"]);
});
test("a machine ban needs a ticked ID", () => {
  assert.deepEqual(addProblems(withKind(filled, "machine"), { ...ctx, picker: machinePicker([]) }), ["machine_none_selected"]);
});
test("create sends the contract's pairs and a trimmed reason", () => {
  assert.deepEqual(toCreateRequest(filled, ctx), {
    accountKey: "1001",
    type: "regular",
    allGameModes: false,
    gameModes: [2, 4],
    permanent: false,
    endDate: "2026-11-18T12:00:00.000Z",
    banReason: "Test reason one",
  });
  const perm = toCreateRequest({ ...filled, scope: "all", duration: "permanent", freeText: "Shown text one" }, ctx);
  assert.deepEqual([perm.allGameModes, perm.gameModes, perm.permanent, perm.endDate, perm.userVisibleBanReason], [true, [], true, null, { freeText: "Shown text one" }]);
});
test("a machine ban is global and carries every ticked ID as it is", () => {
  const request = toCreateRequest(withKind(filled, "machine"), { ...ctx, picker: machinePicker(["a", "b"]) });
  assert.deepEqual([request.type, request.allGameModes, request.gameModes, request.machineIds], ["machine", true, [], ["a", "b"]]);
});
test("edit sends only what changed, always with the version", () => {
  const ban = banView({ gameModes: [2], version: 3 });
  assert.equal(toEditRequest(draftFromBan(ban), ban, null), null);
  assert.deepEqual(toEditRequest({ ...draftFromBan(ban), banReason: "Test reason two" }, ban, null), { version: 3, banReason: "Test reason two" });
  assert.deepEqual(toEditRequest({ ...draftFromBan(ban), permanent: true }, ban, null), { version: 3, permanent: true, endDate: null });
  assert.deepEqual(toEditRequest({ ...draftFromBan(ban), scope: "all", gameModes: [] }, ban, null), { version: 3, allGameModes: true, gameModes: [] });
  assert.deepEqual(toEditRequest({ ...draftFromBan(ban), gameModes: [2] }, ban, null), null); // same set
});
test("a permanent ban with Permanent still ticked is unchanged even when the end field has text", () => {
  const ban = banView({ endDate: null, version: 3 });
  const draft = { ...draftFromBan(ban), endInput: "2026-12-24T10:00" };
  assert.equal(toEditRequest(draft, ban, null), null);
  assert.deepEqual(editProblems(draft, ban, { now, picker: null }), []);
  assert.deepEqual(toEditRequest({ ...draft, banReason: "Test reason two" }, ban, null), { version: 3, banReason: "Test reason two" });
});
test("the shown reason can be changed between kinds or removed", () => {
  const ban = banView({ version: 3, userVisibleBanReason: { freeText: "Shown text one" } });
  assert.deepEqual(toEditRequest({ ...draftFromBan(ban), freeText: "" }, ban, null), { version: 3, userVisibleBanReason: null });
  assert.deepEqual(toEditRequest({ ...draftFromBan(ban), freeText: "", translationId: "t1" }, ban, null), { version: 3, userVisibleBanReason: { translationId: "t1" } });
  assert.equal(toEditRequest(draftFromBan(banView()), banView(), null), null); // none before, none now: nothing sent
});
test("an unchanged end is never re-sent or re-validated", () => {
  const ban = banView({ endDate: "2026-12-02T00:00:30.000Z" }); // seconds the form cannot show
  assert.deepEqual(editProblems({ ...draftFromBan(ban), banReason: "Test reason two" }, ban, { now, picker: null }), []);
  assert.equal("endDate" in (toEditRequest({ ...draftFromBan(ban), banReason: "Test reason two" }, ban, null) ?? {}), false);
});
test("an edited end in the past is refused with the Revoke hint", () => {
  assert.deepEqual(editProblems({ ...draftFromBan(banView()), endInput: "2026-11-15T11:00" }, banView(), { now, picker: null }), ["end_past"]);
});
test("the reason length is validated only when the text changed", () => {
  const ban = banView({ banReason: "x".repeat(2500) });
  assert.deepEqual(editProblems({ ...draftFromBan(ban), permanent: true }, ban, { now, picker: null }), []);
  assert.deepEqual(editProblems({ ...draftFromBan(ban), banReason: "y".repeat(2500) }, ban, { now, picker: null }), ["reason_too_long"]);
});
test("a machine-only change sends only version and machine", () => {
  const ban = machineBanView({ version: 3 });
  const picker = toggleId(initialPicker([machineIdRow({ machineId: "aa11bb22" }), machineIdRow({ machineId: "cc33dd44" })], ban.machine!.machineIds, ban.issuedAt), "cc33dd44");
  assert.deepEqual(toEditRequest(draftFromBan(ban), ban, picker), { version: 3, machine: { version: 1, machineIds: ["aa11bb22"] } });
});
test("Ban again copies scope and reasons but no end", () => {
  const draft = againDraft(banView({ gameModes: [2], banReason: "Test reason one" }));
  assert.deepEqual([draft.kind, draft.scope, draft.gameModes, draft.banReason, draft.duration], ["regular", "modes", [2], "Test reason one", null]);
  assert.equal(againDraft(machineBanView()).kind, "regular");
});
test("the revoke note is required, at most 500 characters", () => {
  assert.equal(revokeNoteProblem("  "), "note_missing");
  assert.equal(revokeNoteProblem("x".repeat(501)), "note_too_long");
  assert.equal(revokeNoteProblem("Test note"), null);
});
test("the overlap notice sees the form's scope and end", () => {
  assert.deepEqual(overlapDraftOf(filled, "add", now), { kind: "regular", allGameModes: false, gameModes: [2, 4], end: { permanent: false, endDate: "2026-11-18T12:00:00.000Z" } });
  assert.deepEqual(overlapDraftOf(withKind(emptyDraft(), "machine"), "add", now), { kind: "machine", allGameModes: true, gameModes: [], end: null });
  assert.equal(overlapDraftOf({ ...filled, duration: "custom", endInput: "bad" }, "add", now).end, null);
  assert.deepEqual(overlapDraftOf({ ...draftFromBan(banView({ gameModes: [] })), permanent: true }, "edit", now), { kind: "regular", allGameModes: true, gameModes: [], end: { permanent: true } });
});
