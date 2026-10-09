import { test } from "vitest";
import { strict as assert } from "node:assert";
import { draftFromTag, emptyDraft, isStaleSelection, NOTE_MAX_LENGTH, NOTE_TOO_LONG_PROBLEM, toTagRequest, validateDraft } from "./draft";
import type { CommercialLicenseDraft } from "./draft";

const tag = {
  battleTag: "Foo#1234",
  note: "streams on twitch",
  notify: false,
  restrictions: { asPlayer: true, asObserver: false, floTv: "custom" as const },
  createdBy: "Mod#1",
  createdAt: "2026-10-08T10:00:00Z",
  updatedBy: "Mod#2",
  updatedAt: "2026-10-09T10:00:00Z",
};

function draftWith(overrides: Partial<CommercialLicenseDraft>): CommercialLicenseDraft {
  return { ...emptyDraft(), ...overrides };
}

test("emptyDraft starts with notifications on and no restrictions", () => {
  assert.deepEqual(emptyDraft(), { battleTag: "", note: "", notify: true, asPlayer: false, asObserver: false, floTv: "none" });
});

test("draftFromTag copies only the editable fields, flattening the restrictions", () => {
  assert.deepEqual(draftFromTag(tag), {
    battleTag: "Foo#1234",
    note: "streams on twitch",
    notify: false,
    asPlayer: true,
    asObserver: false,
    floTv: "custom",
  });
});

test("toTagRequest drops the battleTag and always sends the restrictions", () => {
  assert.deepEqual(toTagRequest(draftWith({ battleTag: "Foo#1234", note: "n" })), {
    note: "n",
    notify: true,
    restrictions: { asPlayer: false, asObserver: false, floTv: "none" },
  });
  assert.deepEqual(toTagRequest(draftWith({ asPlayer: true, asObserver: true, floTv: "all" })).restrictions, {
    asPlayer: true,
    asObserver: true,
    floTv: "all",
  });
});

test("editing a tag round-trips its restrictions unchanged", () => {
  assert.deepEqual(toTagRequest(draftFromTag(tag)).restrictions, tag.restrictions);
});

test("a new draft needs a battleTag", () => {
  assert.equal(validateDraft(emptyDraft(), false, []), "Select a player.");
});

test("a new draft cannot target an already tagged player, case-insensitively", () => {
  const draft = draftWith({ battleTag: "foo#1234" });
  assert.equal(validateDraft(draft, false, ["Foo#1234"]), "This player is already tagged. Edit the existing entry instead.");
});

test("editing an existing tag is not a duplicate", () => {
  assert.equal(validateDraft(draftFromTag(tag), true, ["Foo#1234"]), null);
});

test("the note is limited to NOTE_MAX_LENGTH characters", () => {
  const ok = draftWith({ battleTag: "Foo#1", note: "x".repeat(NOTE_MAX_LENGTH) });
  const tooLong = { ...ok, note: "x".repeat(NOTE_MAX_LENGTH + 1) };
  assert.equal(validateDraft(ok, false, []), null);
  assert.equal(validateDraft(tooLong, false, []), `The note can be at most ${NOTE_MAX_LENGTH} characters.`);
});

test("a duplicate tag is reported before an over-long note", () => {
  const draft = draftWith({ battleTag: "Foo#1234", note: "x".repeat(NOTE_MAX_LENGTH + 1) });
  assert.match(validateDraft(draft, false, ["foo#1234"])!, /already tagged/);
  assert.equal(validateDraft(draft, false, []), NOTE_TOO_LONG_PROBLEM);
});

test("restrictions never block saving", () => {
  assert.equal(validateDraft(draftWith({ battleTag: "Foo#1", asPlayer: true, asObserver: true, floTv: "all" }), false, []), null);
});

test("blur resets the search to empty, which is not an edit", () => {
  assert.equal(isStaleSelection("Foo#1234", ""), false);
  assert.equal(isStaleSelection("Foo#1234", "  "), false);
});

test("editing the search text after a selection makes it stale", () => {
  assert.equal(isStaleSelection("Foo#1234", "Foo#1234"), false);
  assert.equal(isStaleSelection("Foo#1234", "foo#1234"), false);
  assert.equal(isStaleSelection("Foo#1234", "Bar#99"), true);
  assert.equal(isStaleSelection("Foo#1234", " Foo#1234 "), false);
  assert.equal(isStaleSelection("Foo#1234", "FOO#1234"), false);
  assert.equal(isStaleSelection("Foo#1234", "Foo#123"), true);
  assert.equal(isStaleSelection("Foo#1234", " Bar#1 "), true);
  assert.equal(isStaleSelection("", "anything"), false);
});
