import { test } from "vitest";
import { strict as assert } from "node:assert";
import { format } from "date-fns";
import { formatUtc, isoToUtcInput, localTimeHint, utcDayStartInput, utcInputToIso, utcNextHourInput } from "./dates";

test("isoToUtcInput gives the UTC minute value of a datetime-local input", () => {
  assert.equal(isoToUtcInput("2026-10-09T14:05:59.999Z"), "2026-10-09T14:05");
  assert.equal(isoToUtcInput("2026-10-09T16:05:00+02:00"), "2026-10-09T14:05");
  assert.equal(isoToUtcInput(null), "");
  assert.equal(isoToUtcInput(undefined), "");
  assert.equal(isoToUtcInput("not a date"), "");
});

test("utcInputToIso reads the value as UTC and accepts seconds and surrounding spaces", () => {
  assert.equal(utcInputToIso("2026-10-09T14:05"), "2026-10-09T14:05:00.000Z");
  assert.equal(utcInputToIso("2026-10-09T14:05:30"), "2026-10-09T14:05:00.000Z");
  assert.equal(utcInputToIso(" 2026-10-09T14:05 "), "2026-10-09T14:05:00.000Z");
});

test("utcInputToIso rejects empty, malformed and impossible dates", () => {
  assert.equal(utcInputToIso(""), null);
  assert.equal(utcInputToIso("2026-10-09"), null);
  assert.equal(utcInputToIso("2026-13-01T00:00"), null);
  assert.equal(utcInputToIso("2026-02-30T00:00"), null);
});

test("a stored instant survives the form round trip at minute precision", () => {
  assert.equal(utcInputToIso(isoToUtcInput("2026-03-31T23:59:00.000Z")), "2026-03-31T23:59:00.000Z");
});

test("formatUtc shows UTC with a suffix, and a dash when missing", () => {
  assert.equal(formatUtc("2026-10-09T14:05:00.000Z"), "2026-10-09 14:05 UTC");
  assert.equal(formatUtc(null), "—");
  assert.equal(formatUtc(""), "—");
});

test("default form values use UTC day starts and full UTC hours", () => {
  const now = new Date("2026-10-09T23:30:00.000Z");
  assert.equal(utcDayStartInput(now), "2026-10-09T00:00");
  assert.equal(utcDayStartInput(now, 1), "2026-10-10T00:00");
  assert.equal(utcDayStartInput(now, 31), "2026-11-09T00:00");
  assert.equal(utcNextHourInput(now), "2026-10-10T00:00");
  assert.equal(utcNextHourInput(now, 24 * 7), "2026-10-17T00:00");
});

test("localTimeHint shows the instant in the viewer's time zone, nothing for an invalid value", () => {
  const expected = format(new Date("2026-10-09T14:05:00.000Z"), "yyyy-MM-dd HH:mm");
  assert.equal(localTimeHint("2026-10-09T14:05"), `Your local time: ${expected}`);
  assert.equal(localTimeHint(""), "");
});
