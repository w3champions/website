import { expect, test } from "vitest";
import { bandOf, dayText, isValidWindow, laneBars, logAxis } from "./day-lane";

const WINDOW = { fromDay: 100, toDay: 109 };

test("laneBars puts the first day of the window at x 0 and scales heights to the largest value", () => {
  const bars = laneBars([[100, 2], [104, 8], [109, 4]], WINDOW, 100, 20);

  expect(bars.map((b) => b.x)).toEqual([0, 40, 90]);
  expect(bars.map((b) => b.w)).toEqual([10, 10, 10]);
  expect(bars.map((b) => b.h)).toEqual([5, 20, 10]);
  expect(bars.map((b) => b.day)).toEqual([100, 104, 109]);
  expect(bars.map((b) => b.value)).toEqual([2, 8, 4]);
});

test("laneBars drops days outside the window and scales to what is shown", () => {
  const bars = laneBars([[99, 50], [101, 5], [110, 50]], WINDOW, 100, 10);

  expect(bars).toHaveLength(1);
  expect(bars[0]).toMatchObject({ day: 101, h: 10 });
});

test("laneBars of no days is empty", () => {
  expect(laneBars([], WINDOW, 100, 10)).toEqual([]);
});

test("bandOf covers the first through the last event day", () => {
  expect(bandOf({ ...WINDOW, eventFromDay: 103, eventToDay: 105 }, 100)).toEqual({ x: 30, w: 30 });
  expect(bandOf({ ...WINDOW, eventFromDay: 100, eventToDay: 100 }, 100)).toEqual({ x: 0, w: 10 });
});

test("logAxis maps the largest value to 1 and a smaller one below it", () => {
  const axis = logAxis([2, 82]);

  expect(axis(82)).toBe(1);
  expect(axis(2)).toBeGreaterThan(0);
  expect(axis(2)).toBeLessThan(1);
  expect(axis(1)).toBe(0);
});

test("logAxis ends at the data's largest value, whatever it is", () => {
  expect(logAxis([3, 7])(7)).toBe(1);
  expect(logAxis([5, 1000])(1000)).toBe(1);
  expect(logAxis([5, 1000])(500)).toBeLessThan(1);
  expect(logAxis([1])(1)).toBe(1);
  expect(logAxis([])(1)).toBe(1);
});

test("dayText is the UTC date of a day number", () => {
  expect(dayText(0)).toBe("1970-01-01");
  expect(dayText(20_000)).toBe("2024-10-04");
});

const EVENT = { eventFromDay: 103, eventToDay: 105 };

test("an inverted or non-finite window gives no bars and a finite empty band", () => {
  for (const bad of [{ fromDay: 110, toDay: 100 }, { fromDay: 100, toDay: 99 }, { fromDay: Number.NaN, toDay: 109 }, { fromDay: 100, toDay: Number.POSITIVE_INFINITY }]) {
    expect(isValidWindow(bad)).toBe(false);
    expect(laneBars([[100, 2]], bad, 100, 10)).toEqual([]);
    const band = bandOf({ ...bad, ...EVENT }, 100);
    expect(Number.isFinite(band.x) && Number.isFinite(band.w)).toBe(true);
    expect(band.w).toBe(0);
  }
  expect(isValidWindow(WINDOW)).toBe(true);
});

test("non-finite days and values are dropped from the bars", () => {
  const bars = laneBars([[Number.NaN, 3], [101, Number.NaN], [102, Number.POSITIVE_INFINITY], [103, 4]], WINDOW, 100, 10);

  expect(bars.map((b) => b.day)).toEqual([103]);
  expect(Object.values(bars[0]).every(Number.isFinite)).toBe(true);
});

test("a band whose event days lie outside the window stays inside the width", () => {
  const band = bandOf({ ...WINDOW, eventFromDay: 95, eventToDay: 130 }, 100);

  expect(band).toEqual({ x: 0, w: 100 });
  expect(bandOf({ ...WINDOW, eventFromDay: 200, eventToDay: 210 }, 100).w).toBe(0);
  expect(bandOf({ ...WINDOW, eventFromDay: Number.NaN, eventToDay: 105 }, 100)).toEqual({ x: 0, w: 0 });
});

test("logAxis ignores non-finite values", () => {
  const axis = logAxis([2, Number.NaN, Number.POSITIVE_INFINITY, 82]);

  expect(axis(82)).toBe(1);
  expect(Number.isFinite(axis(Number.NaN))).toBe(true);
  expect(axis(Number.NaN)).toBe(0);
});

test("dayText of a non-finite or out of range day is empty instead of throwing", () => {
  expect(dayText(Number.NaN)).toBe("");
  expect(dayText(Number.POSITIVE_INFINITY)).toBe("");
  expect(dayText(1e12)).toBe("");
});
