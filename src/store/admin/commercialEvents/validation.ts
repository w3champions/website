import { utcInputToIso } from "./dates";

/** C-E3: adminNote (allocation and event) is 0–2000 characters. */
export const ADMIN_NOTE_MAX_LENGTH = 2000;

export type WholeNumber = { ok: true; value: number } | { ok: false };

/** Integer typed into a form field (plain digits, optional minus); anything else is not a whole number. */
export function parseWholeNumber(raw: string | number): WholeNumber {
  const text = String(raw).trim();
  if (!/^-?\d+$/.test(text)) return { ok: false };
  return { ok: true, value: Number(text) };
}

/** Problem with a whole-number field limited to [min, max], or null. */
export function wholeNumberProblem(raw: string | number, min: number, max: number, rangeText: string): string | null {
  const parsed = parseWholeNumber(raw);
  if (!parsed.ok) return "Enter a whole number.";
  return parsed.value < min || parsed.value > max ? rangeText : null;
}

/** Names are checked after trimming (spec §6.1). */
export function nameProblem(name: string, max: number): string | null {
  const trimmed = name.trim();
  if (trimmed === "") return "Enter a name.";
  return trimmed.length > max ? `Use at most ${max} characters.` : null;
}

export function adminNoteProblem(note: string): string | null {
  return note.length > ADMIN_NOTE_MAX_LENGTH ? `Admin note: Use at most ${ADMIN_NOTE_MAX_LENGTH.toLocaleString("en-US")} characters.` : null;
}

/** Admin date rule: both dates valid and endsAt > startsAt; nothing else (admins are exempt from the other date rules). */
export function dateRangeProblem(startsAt: string, endsAt: string): string | null {
  const start = utcInputToIso(startsAt);
  if (start === null) return "Start: Enter a valid date and time (UTC).";
  const end = utcInputToIso(endsAt);
  if (end === null) return "End: Enter a valid date and time (UTC).";
  // toISOString output has a fixed shape, so string order is time order.
  return end > start ? null : "End: The end must be after the start.";
}

/** For request builders, which run only after validation passed. */
export function requireWholeNumber(raw: string | number): number {
  const parsed = parseWholeNumber(raw);
  if (!parsed.ok) throw new Error(`Not a whole number: ${String(raw)}`);
  return parsed.value;
}

/** For request builders, which run only after validation passed. */
export function requireIso(value: string): string {
  const iso = utcInputToIso(value);
  if (iso === null) throw new Error(`Not a valid UTC date: ${value}`);
  return iso;
}
