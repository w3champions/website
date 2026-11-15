// UTC, English month abbreviations from a fixed list (Intl en-GB writes "Sept" on newer ICU).
export const MONTHS: readonly string[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DAY_MS = 86_400_000;

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** "24 Nov"; "5 Jan 2027" when the UTC year differs from now's. */
export function dayMonth(iso: string, now: Date): string {
  const d = new Date(iso);
  const text = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  return d.getUTCFullYear() === now.getUTCFullYear() ? text : `${text} ${d.getUTCFullYear()}`;
}

/** "2026-11-27". */
export function ymdUtc(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** "15 Nov 00:51" in now's UTC year, else "2025-02-01". */
export function shortDateTime(iso: string, now: Date): string {
  const d = new Date(iso);
  if (d.getUTCFullYear() !== now.getUTCFullYear()) return ymdUtc(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

/** null = permanent, ends last. */
export function endsLater(a: string | null, b: string | null): boolean {
  if (a === null) return b !== null;
  if (b === null) return false;
  return new Date(a).getTime() > new Date(b).getTime();
}
