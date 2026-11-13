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

export type SortOrder = "asc" | "desc";

export interface ColumnSort {
  key: string;
  order: SortOrder;
}

/** "facts.identifiers:desc": the list's sort as it stands in the URL. */
export function sortToQuery(sort: ColumnSort): string {
  return `${sort.key}:${sort.order}`;
}

/** The sort in a URL value; absent when it is missing, malformed or names a column the table does not have (the default order then). */
export function sortFromQuery(value: unknown, columns: readonly string[]): ColumnSort | null {
  if (typeof value !== "string") return null;
  const at = value.lastIndexOf(":");
  const key = value.slice(0, at);
  const order = value.slice(at + 1);
  if (at < 0 || !columns.includes(key) || (order !== "asc" && order !== "desc")) return null;
  return { key, order };
}
