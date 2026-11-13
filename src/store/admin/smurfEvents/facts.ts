import { key, type Translate } from "./translate";

/** The text of a fact column: a dash when the value is unknown, "at least N" when the server counted only up to N, else the number. */
export function factText(value: number | undefined, capped: true | undefined, tr: Translate): string {
  if (value === undefined) return tr(key("fact_unknown"));
  return capped === true ? tr(key("fact_at_least"), { count: value }) : String(value);
}

/** Ascending order of fact values; an unknown value comes after every number. */
export function factSort(a: number | undefined, b: number | undefined): number {
  if (a === undefined || b === undefined) return a === b ? 0 : a === undefined ? 1 : -1;
  return a - b;
}

/**
 * The comparator Vuetify needs for a descending header: it swaps the two values before calling, so
 * numbers keep {@link factSort}'s order and only the unknown ones are turned back to the end.
 */
export function factSortSwapped(a: number | undefined, b: number | undefined): number {
  return a === undefined || b === undefined ? -factSort(a, b) : factSort(a, b);
}
