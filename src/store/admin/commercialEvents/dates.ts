import { format } from "date-fns";

/**
 * Admin date fields are `<input type="datetime-local">` values labelled "(UTC)":
 * "YYYY-MM-DDTHH:mm" read as UTC, because every server rule and every allocation
 * period boundary is UTC.
 */
const INPUT_PATTERN = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?$/;

/** ISO instant → UTC form value; "" when missing or unparsable. */
export function isoToUtcInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

/** UTC form value → ISO instant (seconds dropped); null for empty, malformed or impossible dates such as 30 February. */
export function utcInputToIso(value: string): string | null {
  const match = INPUT_PATTERN.exec(value.trim());
  if (!match) return null;
  const date = new Date(`${match[1]}:00.000Z`);
  // JS rolls 2026-02-30 over to 2 March; the round trip catches it.
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 16) !== match[1]) return null;
  return date.toISOString();
}

/** "2026-10-09 14:05 UTC", or a dash for a missing value. */
export function formatUtc(iso: string | null | undefined): string {
  const input = isoToUtcInput(iso);
  return input === "" ? "—" : `${input.replace("T", " ")} UTC`;
}

/** 00:00 UTC of `now`'s UTC date plus `addDays`, as a form value. */
export function utcDayStartInput(now: Date, addDays = 0): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + addDays)).toISOString().slice(0, 16);
}

/** The next full UTC hour after `now` plus `addHours`, as a form value. */
export function utcNextHourInput(now: Date, addHours = 0): string {
  const date = new Date(now.getTime());
  date.setUTCMinutes(0, 0, 0);
  date.setUTCHours(date.getUTCHours() + 1 + addHours);
  return date.toISOString().slice(0, 16);
}

/** Field hint showing a UTC form value in the viewer's own time zone. */
export function localTimeHint(value: string): string {
  const iso = utcInputToIso(value);
  return iso === null ? "" : `Your local time: ${format(new Date(iso), "yyyy-MM-dd HH:mm")}`;
}
