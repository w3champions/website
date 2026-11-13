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

/** The width of one day: the window's days share the width equally. */
function slotWidth(window: DayWindow, width: number): number {
  return width / (window.toDay - window.fromDay + 1);
}

/**
 * One bar per day with use. The window's first day starts at x 0, heights scale to the largest value
 * of the days shown. Days outside the window are dropped.
 */
export function laneBars(days: Array<[number, number]>, window: DayWindow, width: number, height: number): LaneBar[] {
  const slot = slotWidth(window, width);
  const inWindow = days.filter(([day]) => day >= window.fromDay && day <= window.toDay);
  const largest = Math.max(1, ...inWindow.map(([, value]) => value));
  return inWindow.map(([day, value]) => ({ x: (day - window.fromDay) * slot, w: slot, h: (value / largest) * height, day, value }));
}

/** The shaded band of the event days, from the start of its first day to the end of its last. */
export function bandOf(window: EventWindow, width: number): { x: number; w: number } {
  const slot = slotWidth(window, width);
  return { x: (window.eventFromDay - window.fromDay) * slot, w: (window.eventToDay - window.eventFromDay + 1) * slot };
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
  const largest = Math.max(1, ...values);
  if (largest === 1) return (v) => (v >= 1 ? 1 : 0);
  const span = Math.log(largest);
  return (v) => Math.min(1, Math.max(0, Math.log(Math.max(v, 1)) / span));
}

/** "2026-10-09" for a UTC day number (days since 1970-01-01). */
export function dayText(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}
