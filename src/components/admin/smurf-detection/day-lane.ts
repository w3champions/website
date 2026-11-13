export interface DayWindow {
  fromDay: number;
  toDay: number;
}

export interface EventWindow extends DayWindow {
  eventFromDay: number;
  eventToDay: number;
}

export interface LaneBar {
  x: number;
  w: number;
  h: number;
  day: number;
  value: number;
}

const MS_PER_DAY = 86_400_000;

/** A window of whole, finite days that does not end before it starts. */
export function isValidWindow(window: DayWindow): boolean {
  return Number.isFinite(window.fromDay) && Number.isFinite(window.toDay) && window.toDay >= window.fromDay;
}

/** The width of one day: the window's days share the width equally. Only for a valid window. */
function slotWidth(window: DayWindow, width: number): number {
  return width / (window.toDay - window.fromDay + 1);
}

/**
 * One bar per day with use. The window's first day starts at x 0, heights scale to the largest value
 * of the days shown. Days outside the window and non-finite days or values are dropped; an invalid
 * window has no bars.
 */
export function laneBars(days: Array<[number, number]>, window: DayWindow, width: number, height: number): LaneBar[] {
  if (!isValidWindow(window)) return [];
  const slot = slotWidth(window, width);
  const inWindow = days.filter(([day, value]) => Number.isFinite(day) && Number.isFinite(value) && day >= window.fromDay && day <= window.toDay);
  const largest = Math.max(1, ...inWindow.map(([, value]) => value));
  return inWindow.map(([day, value]) => ({ x: (day - window.fromDay) * slot, w: slot, h: (value / largest) * height, day, value }));
}

/**
 * The shaded band of the event days, from the start of its first day to the end of its last, kept
 * inside the width. Empty for an invalid window or event days.
 */
export function bandOf(window: EventWindow, width: number): { x: number; w: number } {
  const empty = { x: 0, w: 0 };
  if (!isValidWindow(window) || !Number.isFinite(window.eventFromDay) || !Number.isFinite(window.eventToDay)) return empty;
  const slot = slotWidth(window, width);
  const start = Math.max(window.eventFromDay, window.fromDay);
  const end = Math.min(window.eventToDay, window.toDay);
  if (end < start) return empty;
  return { x: (start - window.fromDay) * slot, w: (end - start + 1) * slot };
}

/** Whether a UTC day number lies inside the event. */
export function isEventDay(day: number, window: EventWindow): boolean {
  return day >= window.eventFromDay && day <= window.eventToDay;
}

/**
 * A log axis from 1 to the largest value in the data: a value maps to 0..1 (1 and below to 0, the
 * largest value to 1). Nothing but the data decides where the axis ends.
 */
export function logAxis(values: number[]): (v: number) => number {
  const largest = Math.max(1, ...values.filter(Number.isFinite));
  if (largest === 1) return (v) => (v >= 1 ? 1 : 0);
  const span = Math.log(largest);
  return (v) => (Number.isFinite(v) ? Math.min(1, Math.max(0, Math.log(Math.max(v, 1)) / span)) : 0);
}

/** "2026-10-09" for a UTC day number (days since 1970-01-01); empty for a number that is no day. */
export function dayText(day: number): string {
  const date = new Date(day * MS_PER_DAY);
  return Number.isFinite(day) && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : "";
}
