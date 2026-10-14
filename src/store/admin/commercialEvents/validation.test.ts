import { test } from "vitest";
import { strict as assert } from "node:assert";
import { adminNoteProblem, dateRangeProblem, nameProblem, parseWholeNumber, requireIso, requireWholeNumber, wholeNumberProblem } from "./validation";

test("parseWholeNumber accepts integers from text or numbers only", () => {
  assert.deepEqual(parseWholeNumber("42"), { ok: true, value: 42 });
  assert.deepEqual(parseWholeNumber(" 7 "), { ok: true, value: 7 });
  assert.deepEqual(parseWholeNumber(3), { ok: true, value: 3 });
  assert.deepEqual(parseWholeNumber("-1"), { ok: true, value: -1 });
  assert.deepEqual(parseWholeNumber(""), { ok: false });
  assert.deepEqual(parseWholeNumber("1.5"), { ok: false });
  assert.deepEqual(parseWholeNumber("1e3"), { ok: false });
  assert.deepEqual(parseWholeNumber("abc"), { ok: false });
});

test("wholeNumberProblem checks integer and range", () => {
  assert.equal(wholeNumberProblem("10", 1, 100, "Enter a number from 1 to 100."), null);
  assert.equal(wholeNumberProblem("0", 1, 100, "Enter a number from 1 to 100."), "Enter a number from 1 to 100.");
  assert.equal(wholeNumberProblem("101", 1, 100, "Enter a number from 1 to 100."), "Enter a number from 1 to 100.");
  assert.equal(wholeNumberProblem("2.5", 1, 100, "Enter a number from 1 to 100."), "Enter a whole number.");
  assert.equal(wholeNumberProblem("", 1, 100, "Enter a number from 1 to 100."), "Enter a whole number.");
});

test("nameProblem trims before checking the length", () => {
  assert.equal(nameProblem("   ", 32), "Enter a name.");
  assert.equal(nameProblem(` ${"x".repeat(32)} `, 32), null);
  assert.equal(nameProblem("x".repeat(33), 32), "Use at most 32 characters.");
});

test("adminNoteProblem allows up to 2000 characters", () => {
  assert.equal(adminNoteProblem(""), null);
  assert.equal(adminNoteProblem("x".repeat(2000)), null);
  assert.equal(adminNoteProblem("x".repeat(2001)), "Admin note: Use at most 2,000 characters.");
});

test("dateRangeProblem needs two valid UTC values with the end after the start", () => {
  assert.equal(dateRangeProblem("", "2026-10-10T00:00"), "Start: Enter a valid date and time (UTC).");
  assert.equal(dateRangeProblem("2026-10-10T00:00", "2026-02-30T00:00"), "End: Enter a valid date and time (UTC).");
  assert.equal(dateRangeProblem("2026-10-10T00:00", "2026-10-10T00:00"), "End: The end must be after the start.");
  assert.equal(dateRangeProblem("2026-10-10T00:00", "2026-10-09T23:59"), "End: The end must be after the start.");
  assert.equal(dateRangeProblem("2026-10-10T00:00", "2026-10-10T00:01"), null);
});

test("require helpers return parsed values and throw on invalid input", () => {
  assert.equal(requireWholeNumber("12"), 12);
  assert.equal(requireIso("2026-10-10T00:00"), "2026-10-10T00:00:00.000Z");
  assert.throws(() => requireWholeNumber("x"));
  assert.throws(() => requireIso("x"));
});
