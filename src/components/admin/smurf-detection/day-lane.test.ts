import { expect, test } from "vitest";
import { bandOf, dayText, laneBars, logAxis } from "./day-lane";

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
