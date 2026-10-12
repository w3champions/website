/** Paging and filter state of an admin list page, kept in the URL query string. */

export interface ListPaging {
  page: number;
  itemsPerPage: number;
}

export interface ListQueryState<K extends string> extends ListPaging {
  filters: Record<K, string>;
}

/** A query value as text; missing, repeated (array) and null values read as empty. */
export function queryText(query: Record<string, unknown>, key: string): string {
  const value = query[key];
  return typeof value === "string" ? value : "";
}

export function positiveInt(text: string, fallback: number): number {
  const value = Number(text);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

/** Reads the named filters (as text) and the `page` / `itemsPerPage` paging from a route query. */
export function readListQuery<K extends string>(query: Record<string, unknown>, filterKeys: readonly K[], defaultPageSize: number): ListQueryState<K> {
  const filters = {} as Record<K, string>;
  for (const key of filterKeys) filters[key] = queryText(query, key);
  return {
    filters,
    page: positiveInt(queryText(query, "page"), 1),
    itemsPerPage: positiveInt(queryText(query, "itemsPerPage"), defaultPageSize),
  };
}

/** True when both states hold the same filter texts (compared exactly, never case-folded) and paging. */
export function sameListQuery<K extends string>(a: ListQueryState<K>, b: ListQueryState<K>): boolean {
  if (a.page !== b.page || a.itemsPerPage !== b.itemsPerPage) return false;
  return (Object.keys(a.filters) as K[]).every((key) => a.filters[key] === b.filters[key]);
}

/** The route query for the current state: empty filters and default paging are left out. */
export function buildListQuery(filters: Readonly<Record<string, string | null | undefined>>, page: number, itemsPerPage: number, defaultPageSize: number): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value) query[key] = value;
  }
  if (page !== 1) query.page = String(page);
  if (itemsPerPage !== defaultPageSize) query.itemsPerPage = String(itemsPerPage);
  return query;
}

/** The paging to adopt after a data-table `update:options`, or `null` when it equals the current paging. */
export function nextTablePage(options: ListPaging, current: ListPaging, defaultPageSize: number): ListPaging | null {
  if (options.page === current.page && options.itemsPerPage === current.itemsPerPage) return null;
  return {
    page: options.page > 0 ? options.page : 1,
    itemsPerPage: options.itemsPerPage > 0 ? options.itemsPerPage : defaultPageSize,
  };
}
