import assert from "node:assert/strict";
import { test } from "vitest";
import { filterNames, NAMES_FILTER_ABOVE, NAMES_INLINE, orderedNames } from "./names";
import type { AccountName } from "./types";

const n = (battleTag: string, banCount: number, lastBannedAt: string | null, current = false): AccountName => ({ battleTag, banCount, lastBannedAt, current });

test("current name, then names with bans newest ban first, then the rest", () => {
  const names = [n("OldName#1001", 0, null), n("BanTwo#1001", 2, "2026-01-01T00:00:00.000Z"), n("BanOne#1001", 1, "2026-10-01T00:00:00.000Z"), n("Tester#1001", 0, null, true), n("Spare#1001", 0, null)];
  assert.deepEqual(orderedNames(names, null).map((x) => x.battleTag), ["Tester#1001", "BanOne#1001", "BanTwo#1001", "OldName#1001", "Spare#1001"]);
});
test("a banned name without a date goes last among banned names, ties keep server order", () => {
  const names = [n("NoDate#1001", 1, null), n("TieA#1001", 1, "2026-05-01T00:00:00.000Z"), n("TieB#1001", 1, "2026-05-01T00:00:00.000Z")];
  assert.deepEqual(orderedNames(names, null).map((x) => x.battleTag), ["TieA#1001", "TieB#1001", "NoDate#1001"]);
});
test("a searched name beyond the inline ones moves to second place, ignoring case", () => {
  const names = [n("Tester#1001", 0, null, true), ...["A", "B", "C", "D"].map((x) => n(`Name${x}#1001`, 0, null)), n("Тестер#1002", 0, null)];
  assert.deepEqual(orderedNames(names, "тестер#1002").slice(0, NAMES_INLINE).map((x) => x.battleTag), ["Tester#1001", "Тестер#1002", "NameA#1001", "NameB#1001"]);
  assert.deepEqual(orderedNames(names, "nameb#1001").map((x) => x.battleTag), ["Tester#1001", "NameA#1001", "NameB#1001", "NameC#1001", "NameD#1001", "Тестер#1002"]);
});
test("the names filter matches a trimmed substring ignoring case", () => {
  const names = [n("Тестер#1002", 1, "2026-11-01T00:00:00.000Z", true), n("Tester#1001", 0, null)];
  assert.deepEqual(filterNames(names, " тест ").map((x) => x.battleTag), ["Тестер#1002"]);
  assert.equal(filterNames(names, "").length, 2);
  assert.equal(NAMES_FILTER_ABOVE, 20);
});
test("an unparsable ban date is treated like a missing one", () => {
  const names = [n("Broken#1001", 1, "not a date"), n("Dated#1001", 1, "2026-05-01T00:00:00.000Z"), n("Other#1001", 1, "2026-06-01T00:00:00.000Z")];
  assert.deepEqual(orderedNames(names, null).map((x) => x.battleTag), ["Other#1001", "Dated#1001", "Broken#1001"]);
});
