import { test } from "vitest";
import { strict as assert } from "node:assert";
import { allocationOptionLabel, allocationStateLabel, auditActionLabel, auditDetailsSummary, eventStatusColor, eventStatusLabel, eventUsedLabel, formatPrizePool, formatWatchTime, kindLabel, memberSummary, outcomeLabel, periodRangeLabel, periodUsageLabel, recurrenceLabel, roleLabel, teamLines } from "./format";
import type { PeriodUsage } from "./types";

const period: PeriodUsage = {
  periodId: "a1:2026-10-05T00:00:00.000Z",
  periodStart: "2026-10-05T00:00:00.000Z",
  periodEnd: "2026-10-12T00:00:00.000Z",
  size: 10,
  consumed: 3,
  held: 2,
  invalid: 1,
  used: 5,
  available: 5,
  warning: "none",
};

test("spec §14 labels for recurrence, kind, state and roles", () => {
  assert.deepEqual(["once", "weekly", "monthly"].map((r) => recurrenceLabel(r as "once")), ["One-time", "Weekly", "Monthly"]);
  assert.deepEqual(["show-matches", "tournament", "other"].map((k) => kindLabel(k as "other")), ["Show matches", "Tournament", "Other"]);
  assert.deepEqual(["upcoming", "active", "expired"].map((s) => allocationStateLabel(s as "active")), ["Upcoming", "Active", "Expired"]);
  assert.equal(roleLabel("delegate"), "Delegate");
  assert.equal(roleLabel("host"), "Authorized host");
});

test("eventStatusLabel combines status and phase", () => {
  assert.equal(eventStatusLabel({ status: "open", phase: "upcoming" }), "Open · upcoming");
  assert.equal(eventStatusLabel({ status: "open", phase: "active" }), "Open · active");
  assert.equal(eventStatusLabel({ status: "open", phase: null }), "Open");
  assert.equal(eventStatusLabel({ status: "suspended", phase: null }), "Suspended");
  assert.equal(eventStatusLabel({ status: "closed" }), "Closed");
});

test("eventStatusColor distinguishes the states", () => {
  assert.equal(eventStatusColor({ status: "open", phase: "active" }), "success");
  assert.equal(eventStatusColor({ status: "open", phase: "upcoming" }), "info");
  assert.equal(eventStatusColor({ status: "suspended" }), "warning");
  assert.equal(eventStatusColor({ status: "closed" }), "grey");
});

test("outcomeLabel uses the spec terms and reasons", () => {
  assert.equal(outcomeLabel({ outcome: "in-progress" }), "In progress");
  assert.equal(outcomeLabel({ outcome: "valid", invalidReason: null }), "Counted");
  assert.equal(outcomeLabel({ outcome: "invalid", invalidReason: "start-failed" }), "Not counted: Failed to start");
  assert.equal(outcomeLabel({ outcome: "invalid", invalidReason: "no-result" }), "Not counted: No result");
  assert.equal(outcomeLabel({ outcome: "invalid", invalidReason: "terminated" }), "Not counted: Terminated");
  assert.equal(outcomeLabel({ outcome: "invalid", invalidReason: "no-winner" }), "Not counted: No winner");
  assert.equal(outcomeLabel({ outcome: "invalid", invalidReason: null }), "Not counted");
});

test("periodUsageLabel shows used of size with the held games", () => {
  assert.equal(periodUsageLabel(period), "5 / 10 (2 in progress)");
  assert.equal(periodUsageLabel(null), "—");
  assert.equal(periodUsageLabel(undefined), "—");
});

test("periodRangeLabel shows both UTC bounds", () => {
  assert.equal(periodRangeLabel(period), "2026-10-05 00:00 UTC – 2026-10-12 00:00 UTC");
});

test("eventUsedLabel counts consumed and held against the limit", () => {
  assert.equal(eventUsedLabel({ consumed: 7, held: 1, maxGames: 20 }), "8 / 20");
});

test("formatPrizePool uses US$ with thousands separators", () => {
  assert.equal(formatPrizePool(0), "US$0");
  assert.equal(formatPrizePool(10000000), "US$10,000,000");
});

test("formatWatchTime picks the two largest units", () => {
  assert.equal(formatWatchTime(0), "0s");
  assert.equal(formatWatchTime(45.4), "45s");
  assert.equal(formatWatchTime(725), "12m 5s");
  assert.equal(formatWatchTime(7385), "2h 3m");
  assert.equal(formatWatchTime(-3), "0s");
});

test("teamLines lists players per team and marks the winner", () => {
  assert.deepEqual(
    teamLines([
      { playerCount: 2, players: [{ battleTag: "A#1", won: true }, { battleTag: "B#2", won: true }] },
      { playerCount: 2, players: [{ battleTag: "C#3", won: false }, { battleTag: "D#4", won: false }] },
    ]),
    ["A#1, B#2 (winner)", "C#3, D#4"],
  );
  assert.deepEqual(teamLines([{ playerCount: 3, players: [] }]), ["3 players (names hidden)"]);
});

test("memberSummary lists up to three tags and counts the rest", () => {
  const entry = (battleTag: string) => ({ battleTag, addedBy: "Admin#1", addedAt: "2026-10-01T00:00:00.000Z" });
  assert.equal(memberSummary([]), "—");
  assert.equal(memberSummary([entry("A#1"), entry("B#2")]), "A#1, B#2");
  assert.equal(memberSummary([entry("A#1"), entry("B#2"), entry("C#3"), entry("D#4"), entry("E#5")]), "A#1, B#2, C#3 +2");
});

test("allocationOptionLabel adds the state", () => {
  assert.equal(allocationOptionLabel({ name: "Spring cup", state: "upcoming" }), "Spring cup (Upcoming)");
});

test("auditActionLabel turns the action id into words", () => {
  assert.equal(auditActionLabel("event-created"), "Event created");
  assert.equal(auditActionLabel("game-terminated"), "Game terminated");
});

test("auditDetailsSummary shows changes as from → to, other details as key: value", () => {
  assert.equal(
    auditDetailsSummary({ changes: { name: { from: "Cup", to: "Cup 2" }, maxGames: { from: 10, to: 20 }, adminNote: { from: null, to: "x" } } }),
    "name: Cup → Cup 2; maxGames: 10 → 20; adminNote: — → x",
  );
  assert.equal(auditDetailsSummary({ acknowledged: true, battleTag: "Foo#1" }), "acknowledged: true; battleTag: Foo#1");
  assert.equal(auditDetailsSummary({}), "");
  assert.equal(auditDetailsSummary(null), "");
});

test("auditDetailsSummary shows ISO-looking strings as UTC display dates", () => {
  assert.equal(
    auditDetailsSummary({ changes: { endsAt: { from: "2026-11-02T18:00:00Z", to: "2026-11-03T18:30:00.000Z" } } }),
    "endsAt: 2026-11-02 18:00 UTC → 2026-11-03 18:30 UTC",
  );
  assert.equal(auditDetailsSummary({ suspendedAt: "2026-11-01T09:15:00Z", note: "2026 plans" }), "suspendedAt: 2026-11-01 09:15 UTC; note: 2026 plans");
});
