import { test } from "vitest";
import { strict as assert } from "node:assert";
import { draftFromAllocation, emptyAllocationDraft, hasRecordedUsage, isAllocationStarted, memberProblem, revertStartedFields, toAllocationCreateRequest, toAllocationUpdateRequest, validateAllocationDraft } from "./allocationDraft";
import type { AllocationDraft } from "./allocationDraft";
import type { Allocation } from "./types";

const allocation: Allocation = {
  id: "a1",
  name: "Spring cup",
  gamesPerPeriod: 50,
  recurrence: "weekly",
  startsAt: "2026-11-01T00:00:00.000Z",
  endsAt: "2026-12-01T12:34:56.789Z",
  allowEventCreation: true,
  adminNote: null,
  state: "upcoming",
  members: [{ battleTag: "Foo#1", addedBy: "Admin#1", addedAt: "2026-10-01T00:00:00.000Z" }],
  currentPeriod: null,
  resetsAt: null,
  createdBy: "Admin#1",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedBy: "Admin#1",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const beforeStart = new Date("2026-10-15T00:00:00.000Z");
const afterStart = new Date("2026-11-02T00:00:00.000Z");

function valid(overrides: Partial<AllocationDraft> = {}): AllocationDraft {
  return { ...draftFromAllocation(allocation), ...overrides };
}

test("a new draft is weekly, starts tomorrow 00:00 UTC, lasts 30 days and does not allow event creation", () => {
  assert.deepEqual(emptyAllocationDraft(new Date("2026-10-09T15:00:00.000Z")), {
    name: "",
    gamesPerPeriod: "",
    recurrence: "weekly",
    startsAt: "2026-10-10T00:00",
    endsAt: "2026-11-09T00:00",
    allowEventCreation: false,
    adminNote: "",
  });
});

test("draftFromAllocation copies the editable fields as UTC form values; a null note becomes empty", () => {
  assert.deepEqual(draftFromAllocation(allocation), {
    name: "Spring cup",
    gamesPerPeriod: "50",
    recurrence: "weekly",
    startsAt: "2026-11-01T00:00",
    endsAt: "2026-12-01T12:34",
    allowEventCreation: true,
    adminNote: "",
  });
});

test("an allocation has started once its start is not in the future", () => {
  assert.equal(isAllocationStarted(allocation, beforeStart), false);
  assert.equal(isAllocationStarted(allocation, new Date("2026-11-01T00:00:00.000Z")), true);
  assert.equal(isAllocationStarted(allocation, afterStart), true);
});

test("a complete draft is valid", () => {
  assert.equal(validateAllocationDraft(valid()), null);
});

test("the name is required and limited to 60 characters after trimming", () => {
  assert.equal(validateAllocationDraft(valid({ name: "  " })), "Name: Enter a name.");
  assert.equal(validateAllocationDraft(valid({ name: "x".repeat(61) })), "Name: Use at most 60 characters.");
  assert.equal(validateAllocationDraft(valid({ name: ` ${"x".repeat(60)} ` })), null);
});

test("games per period is a whole number from 1 to 100,000", () => {
  assert.equal(validateAllocationDraft(valid({ gamesPerPeriod: "" })), "Games per period: Enter a whole number.");
  assert.equal(validateAllocationDraft(valid({ gamesPerPeriod: "2.5" })), "Games per period: Enter a whole number.");
  assert.equal(validateAllocationDraft(valid({ gamesPerPeriod: "0" })), "Games per period: Enter a number from 1 to 100,000.");
  assert.equal(validateAllocationDraft(valid({ gamesPerPeriod: "100001" })), "Games per period: Enter a number from 1 to 100,000.");
  assert.equal(validateAllocationDraft(valid({ gamesPerPeriod: "100000" })), null);
});

test("the end must be after the start", () => {
  assert.equal(validateAllocationDraft(valid({ endsAt: "2026-11-01T00:00" })), "End: The end must be after the start.");
});

test("the admin note is limited to 2000 characters", () => {
  assert.equal(validateAllocationDraft(valid({ adminNote: "x".repeat(2001) })), "Admin note: Use at most 2,000 characters.");
});

test("the create request trims the name and converts numbers and UTC dates", () => {
  assert.deepEqual(toAllocationCreateRequest(valid({ name: "  Spring cup  ", adminNote: "contract 7" })), {
    name: "Spring cup",
    gamesPerPeriod: 50,
    recurrence: "weekly",
    startsAt: "2026-11-01T00:00:00.000Z",
    endsAt: "2026-12-01T12:34:00.000Z",
    allowEventCreation: true,
    adminNote: "contract 7",
  });
});

test("the update request holds only changed fields, comparing dates at minute precision", () => {
  assert.deepEqual(toAllocationUpdateRequest(valid(), allocation, beforeStart), {});
  assert.deepEqual(
    toAllocationUpdateRequest(valid({ name: "Summer cup", gamesPerPeriod: "60", endsAt: "2026-12-15T00:00", adminNote: "n" }), allocation, beforeStart),
    { name: "Summer cup", gamesPerPeriod: 60, endsAt: "2026-12-15T00:00:00.000Z", adminNote: "n" },
  );
  assert.deepEqual(
    toAllocationUpdateRequest(valid({ recurrence: "monthly", startsAt: "2026-11-02T00:00" }), allocation, beforeStart),
    { recurrence: "monthly", startsAt: "2026-11-02T00:00:00.000Z" },
  );
});

test("start and recurrence are never sent once the allocation has started", () => {
  assert.deepEqual(
    toAllocationUpdateRequest(valid({ recurrence: "monthly", startsAt: "2026-11-02T00:00", allowEventCreation: false }), allocation, afterStart),
    { allowEventCreation: false },
  );
});

test("memberProblem compares battle tags exactly", () => {
  assert.equal(memberProblem(allocation.members, ""), "Select a player.");
  assert.equal(memberProblem(allocation.members, "Foo#1"), "Foo#1 is already a member.");
  assert.equal(memberProblem(allocation.members, "foo#1"), null);
  assert.equal(memberProblem(allocation.members, "Bar#2"), null);
});

test("hasRecordedUsage is true only when the current period has counters", () => {
  const period = { periodId: "p", periodStart: "", periodEnd: "", size: 10, consumed: 0, held: 0, invalid: 0, used: 0, available: 10, warning: "none" as const };
  assert.equal(hasRecordedUsage({ currentPeriod: null }), false);
  assert.equal(hasRecordedUsage({ currentPeriod: period }), false);
  assert.equal(hasRecordedUsage({ currentPeriod: { ...period, invalid: 1 } }), true);
  assert.equal(hasRecordedUsage({ currentPeriod: { ...period, held: 1, used: 1 } }), true);
});

test("start and recurrence changed in the draft are put back once the allocation has started", () => {
  const draft = valid({ recurrence: "monthly", startsAt: "2026-11-03T00:00", name: "Renamed" });

  assert.equal(revertStartedFields(draft, allocation, afterStart), true);

  assert.equal(draft.recurrence, "weekly");
  assert.equal(draft.startsAt, "2026-11-01T00:00");
  assert.equal(draft.name, "Renamed");
});

test("start and recurrence stay as drafted before the start, and an untouched draft reports no change", () => {
  const draft = valid({ recurrence: "monthly" });
  assert.equal(revertStartedFields(draft, allocation, beforeStart), false);
  assert.equal(draft.recurrence, "monthly");

  assert.equal(revertStartedFields(valid({ name: "Renamed" }), allocation, afterStart), false);
});

test("an update built against the draft's own base leaves fields changed on the server since then alone", () => {
  const draft = valid({ name: "Renamed" });
  const newer: Allocation = { ...allocation, gamesPerPeriod: 80, adminNote: "set elsewhere" };

  assert.deepEqual(toAllocationUpdateRequest(draft, allocation, beforeStart), { name: "Renamed" });
  // Against the newer copy the untouched draft fields would revert it.
  assert.deepEqual(toAllocationUpdateRequest(draft, newer, beforeStart), { name: "Renamed", gamesPerPeriod: 50, adminNote: "" });
});
