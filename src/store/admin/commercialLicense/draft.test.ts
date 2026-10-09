import { test } from "vitest";
import { strict as assert } from "node:assert";
import { draftFromTag, emptyDraft, isStaleSelection, NOTE_MAX_LENGTH, NOTE_TOO_LONG_PROBLEM, toTagRequest, validateDraft } from "./draft";

const tag = {
  battleTag: "Foo#1234",
  note: "streams on twitch",
  notify: false,
  createdBy: "Mod#1",
  createdAt: "2026-10-08T10:00:00Z",
  updatedBy: "Mod#2",
  updatedAt: "2026-10-09T10:00:00Z",
};

test("emptyDraft starts with notifications on", () => {
  assert.deepEqual(emptyDraft(), { battleTag: "", note: "", notify: true });
});

test("draftFromTag copies only the editable fields", () => {
  assert.deepEqual(draftFromTag(tag), { battleTag: "Foo#1234", note: "streams on twitch", notify: false });
});

test("toTagRequest drops the battleTag", () => {
  assert.deepEqual(toTagRequest({ battleTag: "Foo#1234", note: "n", notify: true }), { note: "n", notify: true });
});

test("a new draft needs a battleTag", () => {
  assert.equal(validateDraft(emptyDraft(), false, []), "Select a player.");
});

test("a new draft cannot target an already tagged player, case-insensitively", () => {
  const draft = { battleTag: "foo#1234", note: "", notify: true };
  assert.equal(validateDraft(draft, false, ["Foo#1234"]), "This player is already tagged. Edit the existing entry instead.");
});

test("editing an existing tag is not a duplicate", () => {
  assert.equal(validateDraft(draftFromTag(tag), true, ["Foo#1234"]), null);
});

test("the note is limited to NOTE_MAX_LENGTH characters", () => {
  const ok = { battleTag: "Foo#1", note: "x".repeat(NOTE_MAX_LENGTH), notify: true };
  const tooLong = { ...ok, note: "x".repeat(NOTE_MAX_LENGTH + 1) };
  assert.equal(validateDraft(ok, false, []), null);
  assert.equal(validateDraft(tooLong, false, []), `The note can be at most ${NOTE_MAX_LENGTH} characters.`);
});

test("a duplicate tag is reported before an over-long note", () => {
  const draft = { battleTag: "Foo#1234", note: "x".repeat(NOTE_MAX_LENGTH + 1), notify: true };
  assert.match(validateDraft(draft, false, ["foo#1234"])!, /already tagged/);
  assert.equal(validateDraft(draft, false, []), NOTE_TOO_LONG_PROBLEM);
});

test("editing the search text after a selection makes it stale", () => {
  assert.equal(isStaleSelection("Foo#1234", "Foo#1234"), false);
  assert.equal(isStaleSelection("Foo#1234", "foo#1234"), false);
  assert.equal(isStaleSelection("Foo#1234", "Bar#99"), true);
  assert.equal(isStaleSelection("Foo#1234", ""), true);
  assert.equal(isStaleSelection("", "anything"), false);
});
