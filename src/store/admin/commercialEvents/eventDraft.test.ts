import { test } from "vitest";
import { strict as assert } from "node:assert";
import { closesImmediately, draftFromEvent, emptyEventDraft, eventActions, moveTargets, personProblem, suspendDraftFor, toEventCreateRequest, toEventUpdateRequest, toSuspendRequest, validateEventDraft, validateSuspendDraft } from "./eventDraft";
import type { EventDraft } from "./eventDraft";
import type { AdminEvent } from "./types";

const event: AdminEvent = {
  id: "EV-AB23",
  name: "Cup",
  kind: "tournament",
  prizePoolUsd: 1000,
  startsAt: "2026-11-01T18:00:00.000Z",
  endsAt: "2026-11-02T18:00:30.000Z",
  maxGames: 20,
  allocationId: "a1",
  allocationName: "Spring cup",
  status: "open",
  phase: "upcoming",
  consumed: 3,
  held: 1,
  invalid: 0,
  suspensionMessage: null,
  adminNote: "note",
  createdBy: "Admin#1",
  createdVia: "admin",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedBy: "Admin#1",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

function valid(overrides: Partial<EventDraft> = {}): EventDraft {
  return { ...draftFromEvent(event), ...overrides };
}

test("a new draft starts at the next full UTC hour, lasts 7 days and has no game limit yet", () => {
  assert.deepEqual(emptyEventDraft(new Date("2026-10-09T15:20:00.000Z"), "a1"), {
    allocationId: "a1",
    name: "",
    kind: "tournament",
    prizePoolUsd: "0",
    startsAt: "2026-10-09T16:00",
    endsAt: "2026-10-16T16:00",
    maxGames: "",
    adminNote: "",
  });
  assert.equal(emptyEventDraft(new Date("2026-10-09T15:20:00.000Z")).allocationId, "");
});

test("draftFromEvent copies the editable fields as form values", () => {
  assert.deepEqual(draftFromEvent(event), {
    allocationId: "a1",
    name: "Cup",
    kind: "tournament",
    prizePoolUsd: "1000",
    startsAt: "2026-11-01T18:00",
    endsAt: "2026-11-02T18:00",
    maxGames: "20",
    adminNote: "note",
  });
  assert.equal(draftFromEvent({ ...event, adminNote: null }).adminNote, "");
});

test("admins are exempt from every date rule except end after start", () => {
  assert.equal(validateEventDraft(valid()), null);
  // 60 days long and entirely in the past: organizers would get too-long-duration and end-in-past.
  assert.equal(validateEventDraft(valid({ startsAt: "2020-01-01T00:00", endsAt: "2020-03-01T00:00" })), null);
});

test("an allocation must be chosen", () => {
  assert.equal(validateEventDraft(valid({ allocationId: "" })), "Allocation: Choose an allocation.");
});

test("the name is required and limited to 32 characters after trimming", () => {
  assert.equal(validateEventDraft(valid({ name: " " })), "Name: Enter a name.");
  assert.equal(validateEventDraft(valid({ name: "x".repeat(33) })), "Name: Use at most 32 characters.");
  assert.equal(validateEventDraft(valid({ name: ` ${"x".repeat(32)} ` })), null);
});

test("the type must be one of the kinds", () => {
  assert.equal(validateEventDraft(valid({ kind: "party" as EventDraft["kind"] })), "Type: Choose one of the options.");
});

test("the prize pool is a whole number from 0 to 10,000,000", () => {
  assert.equal(validateEventDraft(valid({ prizePoolUsd: "0" })), null);
  assert.equal(validateEventDraft(valid({ prizePoolUsd: "10.5" })), "Prize pool: Enter a whole number.");
  assert.equal(validateEventDraft(valid({ prizePoolUsd: "-1" })), "Prize pool: Enter an amount from 0 to 10,000,000.");
  assert.equal(validateEventDraft(valid({ prizePoolUsd: "10000001" })), "Prize pool: Enter an amount from 0 to 10,000,000.");
});

test("the end must be after the start", () => {
  assert.equal(validateEventDraft(valid({ endsAt: "2026-11-01T18:00" })), "End: The end must be after the start.");
});

test("the game limit is a whole number from 1 to 10,000 and not below the used games", () => {
  assert.equal(validateEventDraft(valid({ maxGames: "" })), "Game limit: Enter a whole number.");
  assert.equal(validateEventDraft(valid({ maxGames: "0" })), "Game limit: Enter a number from 1 to 10,000.");
  assert.equal(validateEventDraft(valid({ maxGames: "10001" })), "Game limit: Enter a number from 1 to 10,000.");
  assert.equal(validateEventDraft(valid({ maxGames: "3" }), 4), "Game limit: The game limit can't be lower than the games already used or in progress (4).");
  assert.equal(validateEventDraft(valid({ maxGames: "4" }), 4), null);
});

test("the admin note is limited to 2000 characters", () => {
  assert.equal(validateEventDraft(valid({ adminNote: "x".repeat(2001) })), "Admin note: Use at most 2,000 characters.");
});

test("the create request trims the name and converts numbers and dates", () => {
  assert.deepEqual(toEventCreateRequest(valid({ name: " Cup ", maxGames: "25" })), {
    allocationId: "a1",
    name: "Cup",
    kind: "tournament",
    prizePoolUsd: 1000,
    startsAt: "2026-11-01T18:00:00.000Z",
    endsAt: "2026-11-02T18:00:00.000Z",
    maxGames: 25,
    adminNote: "note",
  });
});

test("the update request holds only changed fields and never the allocation", () => {
  assert.deepEqual(toEventUpdateRequest(valid({ allocationId: "a2" }), event), {});
  assert.deepEqual(
    toEventUpdateRequest(valid({ name: "Cup 2", kind: "other", prizePoolUsd: "0", startsAt: "2026-11-01T19:00", endsAt: "2026-11-03T18:00", maxGames: "30", adminNote: "" }), event),
    { name: "Cup 2", kind: "other", prizePoolUsd: 0, startsAt: "2026-11-01T19:00:00.000Z", endsAt: "2026-11-03T18:00:00.000Z", maxGames: 30, adminNote: "" },
  );
});

test("an end at or before now closes the event at once", () => {
  const now = new Date("2026-11-01T12:00:00.000Z");
  assert.equal(closesImmediately({ endsAt: "2026-11-01T12:00" }, now), true);
  assert.equal(closesImmediately({ endsAt: "2026-11-01T11:59" }, now), true);
  assert.equal(closesImmediately({ endsAt: "2026-11-01T12:01" }, now), false);
  assert.equal(closesImmediately({ endsAt: "" }, now), false);
});

test("the suspension message is required, at most 500 characters after trimming", () => {
  const draft = suspendDraftFor(event);
  assert.deepEqual(draft, { suspensionMessage: "", adminNote: "note" });
  assert.equal(validateSuspendDraft(draft), "Message: Enter a message.");
  assert.equal(validateSuspendDraft({ ...draft, suspensionMessage: "x".repeat(501) }), "Message: Use at most 500 characters.");
  assert.equal(validateSuspendDraft({ ...draft, suspensionMessage: ` ${"x".repeat(500)} ` }), null);
  assert.equal(validateSuspendDraft({ suspensionMessage: "m", adminNote: "x".repeat(2001) }), "Admin note: Use at most 2,000 characters.");
});

test("the suspend request trims the message and sends the note only when changed", () => {
  assert.deepEqual(toSuspendRequest({ suspensionMessage: " Prize pool unclear ", adminNote: "note" }, event), { suspensionMessage: "Prize pool unclear" });
  assert.deepEqual(toSuspendRequest({ suspensionMessage: "m", adminNote: "ticket 12" }, event), { suspensionMessage: "m", adminNote: "ticket 12" });
});

test("admin actions follow the state machine", () => {
  assert.deepEqual(eventActions({ status: "open" }), { edit: true, move: true, close: true, suspend: true, lift: false, managePeople: true });
  assert.deepEqual(eventActions({ status: "suspended" }), { edit: true, move: true, close: true, suspend: false, lift: true, managePeople: true });
  assert.deepEqual(eventActions({ status: "closed" }), { edit: false, move: false, close: false, suspend: false, lift: false, managePeople: false });
});

test("move targets are every other allocation, whatever its state", () => {
  const allocations = [{ id: "a1", state: "active" }, { id: "a2", state: "expired" }, { id: "a3", state: "upcoming" }];
  assert.deepEqual(moveTargets(allocations, "a1").map((a) => a.id), ["a2", "a3"]);
});

test("personProblem allows one role per account and compares exactly", () => {
  const people = {
    delegates: [{ battleTag: "Del#1", addedBy: "Org#1", addedAt: "2026-10-01T00:00:00.000Z" }],
    hosts: [{ battleTag: "Host#2", addedBy: "Del#1", addedAt: "2026-10-01T00:00:00.000Z" }],
  };
  assert.equal(personProblem(people, ""), "Select a player.");
  assert.equal(personProblem(people, "Del#1"), "Del#1 is already a delegate. Remove that role first.");
  assert.equal(personProblem(people, "Host#2"), "Host#2 is already an authorized host. Remove that role first.");
  assert.equal(personProblem(people, "del#1"), null);
});
