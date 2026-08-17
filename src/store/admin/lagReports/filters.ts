import { defineStore } from "pinia";
import { LocationQuery } from "vue-router";
import { LagReportQueryParams } from "@/store/admin/lagReports/types";
import type { LagReportsFilterKey as FilterKey } from "@/store/admin/lagReports/prefs";

export type LagFiltersState = {
  battleTag: string;
  gameSearch: string;
  serverName: string;
  proxyName: string;
  proxyIp: string;
  issueCategory: string;
  explicitOnly: boolean;
  dateFrom: string;
  dateTo: string;
};

export function createDefaultFilters(): LagFiltersState {
  return {
    battleTag: "",
    gameSearch: "",
    serverName: "",
    proxyName: "",
    proxyIp: "",
    issueCategory: "",
    explicitOnly: false,
    dateFrom: "",
    dateTo: "",
  };
}

// What the filters contribute to a request — the page adds page/pageSize.
export type LagReportFilterParams = Omit<LagReportQueryParams, "page" | "pageSize">;

// The query-shaped record: what the filters contribute to the URL, and — in
// the same shape — what sessionStorage keeps for the restore offer. One
// serialization, two homes.
export type FiltersQueryRecord = Record<string, string>;

// One filter, whole: its pill, its lifecycle, and every serialization it
// takes part in. The page and the bar only ever loop over the registry —
// adding a filter means adding a descriptor here (plus an editor component
// if no existing one fits) and nothing else.
export type FilterDescriptor = {
  key: FilterKey;
  label: string;
  // A filter rendered as its own toolbar control (the All/Submitted toggle):
  // no pill and no editor, but Clear all and the active count still cover it.
  asToggle?: boolean;
  // The URL keys this filter reads. Presence of any marks an arrival as
  // carrying query state (deep links win over stored filters).
  queryKeys: string[];
  // Override when bare presence is not enough (explicitOnly counts only as "true").
  presentInQuery?(query: LocationQuery): boolean;
  hasValue(filters: LagFiltersState): boolean;
  pillLabel(filters: LagFiltersState): string;
  clear(filters: LagFiltersState): void;
  toParams(filters: LagFiltersState, params: LagReportFilterParams): void;
  toQuery(filters: LagFiltersState, query: FiltersQueryRecord): void;
  // Always assigns its fields: the value when present, the default when not,
  // so one loop hydrates the whole state from any query record.
  fromQuery(filters: LagFiltersState, query: LocationQuery): void;
};

function queryString(query: LocationQuery, key: string): string {
  const value = query[key];
  return typeof value === "string" ? value : "";
}

function truncateLabel(value: string, max = 28): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

// The prefix-matched text filters differ only in which field they carry —
// state field, query key and request param share the name.
function prefixTextFilter(
  key: FilterKey,
  label: string,
  pillPrefix: string,
  field: "battleTag" | "gameSearch" | "serverName" | "proxyName" | "proxyIp",
): FilterDescriptor {
  return {
    key,
    label,
    queryKeys: [field],
    hasValue: (f) => f[field] !== "",
    pillLabel: (f) => `${pillPrefix}: ${truncateLabel(f[field] || "…")}`,
    clear: (f) => {
      f[field] = "";
    },
    toParams: (f, p) => {
      p[field] = f[field] || undefined;
    },
    toQuery: (f, q) => {
      if (f[field]) q[field] = f[field];
    },
    fromQuery: (f, q) => {
      f[field] = queryString(q, field);
    },
  };
}

const categoriesFilter: FilterDescriptor = {
  key: "categories",
  label: "Categories",
  queryKeys: ["issueCategory"],
  hasValue: (f) => f.issueCategory !== "",
  pillLabel: (f) => (f.issueCategory ? `Category: ${f.issueCategory}` : "Category: …"),
  clear: (f) => {
    f.issueCategory = "";
  },
  toParams: (f, p) => {
    p.issueCategory = f.issueCategory || undefined;
  },
  toQuery: (f, q) => {
    if (f.issueCategory) q.issueCategory = f.issueCategory;
  },
  fromQuery: (f, q) => {
    f.issueCategory = queryString(q, "issueCategory");
  },
};

const datesFilter: FilterDescriptor = {
  key: "dates",
  label: "Dates",
  queryKeys: ["dateFrom", "dateTo"],
  hasValue: (f) => f.dateFrom !== "" || f.dateTo !== "",
  pillLabel: (f) => {
    const { dateFrom: from, dateTo: to } = f;
    if (from && to) return `${from} – ${to}`;
    if (from) return `From ${from}`;
    if (to) return `Until ${to}`;
    return "Dates: …";
  },
  clear: (f) => {
    f.dateFrom = "";
    f.dateTo = "";
  },
  toParams: (f, p) => {
    p.dateFrom = f.dateFrom || undefined;
    p.dateTo = f.dateTo || undefined;
  },
  toQuery: (f, q) => {
    if (f.dateFrom) q.dateFrom = f.dateFrom;
    if (f.dateTo) q.dateTo = f.dateTo;
  },
  fromQuery: (f, q) => {
    f.dateFrom = queryString(q, "dateFrom");
    f.dateTo = queryString(q, "dateTo");
  },
};

const explicitFilter: FilterDescriptor = {
  key: "explicit",
  label: "Submitted only",
  asToggle: true,
  queryKeys: ["explicitOnly"],
  presentInQuery: (q) => q.explicitOnly === "true",
  hasValue: (f) => f.explicitOnly,
  pillLabel: () => "Submitted only",
  clear: (f) => {
    f.explicitOnly = false;
  },
  toParams: (f, p) => {
    p.explicitOnly = f.explicitOnly || undefined;
  },
  toQuery: (f, q) => {
    if (f.explicitOnly) q.explicitOnly = "true";
  },
  fromQuery: (f, q) => {
    f.explicitOnly = q.explicitOnly === "true";
  },
};

// Registry order is menu order: the "+ Filter" menu and the pill bar both
// render straight from this list.
export const FILTER_REGISTRY: FilterDescriptor[] = [
  prefixTextFilter("server", "Server", "Server", "serverName"),
  categoriesFilter,
  prefixTextFilter("player", "Player", "Player", "battleTag"),
  datesFilter,
  prefixTextFilter("game", "Game ID / Name", "Game", "gameSearch"),
  prefixTextFilter("proxy", "Proxy", "Proxy", "proxyName"),
  prefixTextFilter("proxyIp", "Proxy IP", "Proxy IP", "proxyIp"),
  explicitFilter,
];

// ── Generic operations — every per-filter switch collapses into these ──

export function filterParams(filters: LagFiltersState): LagReportFilterParams {
  const params: LagReportFilterParams = {};
  for (const filter of FILTER_REGISTRY) filter.toParams(filters, params);
  return params;
}

export function filtersToQuery(filters: LagFiltersState): FiltersQueryRecord {
  const query: FiltersQueryRecord = {};
  for (const filter of FILTER_REGISTRY) filter.toQuery(filters, query);
  return query;
}

export function applyQueryToFilters(filters: LagFiltersState, query: LocationQuery): void {
  for (const filter of FILTER_REGISTRY) filter.fromQuery(filters, query);
}

export function queryHoldsFilterState(query: LocationQuery): boolean {
  return FILTER_REGISTRY.some((filter) =>
    filter.presentInQuery
      ? filter.presentInQuery(query)
      : filter.queryKeys.some((key) => typeof query[key] === "string")
  );
}

export function countActiveFilters(filters: LagFiltersState): number {
  return FILTER_REGISTRY.filter((filter) => filter.hasValue(filters)).length;
}

export function clearAllFilterValues(filters: LagFiltersState): void {
  for (const filter of FILTER_REGISTRY) filter.clear(filters);
}

// The filter state is a store so the page, the filter bar and its editors all
// read and write the same object — no prop-drilling, no prop mutation. The
// state survives in-app navigation, but the page re-hydrates every field from
// the URL, storage or the defaults on each entry, so nothing leaks between
// visits.
export const useLagReportsFiltersStore = defineStore("lagReportsFilters", {
  state: (): LagFiltersState => createDefaultFilters(),
});
