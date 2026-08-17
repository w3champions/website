import { defineStore } from "pinia";
import { LocationQuery } from "vue-router";
import { LagReportQueryParams } from "@/store/admin/lagReports/types";
import type { LagReportsFilterKey as FilterKey } from "@/store/admin/lagReports/prefs";

// ── The window ─────────────────────────────────────────────────────────
// Every read the list page makes scopes to the one date window living in
// ordinary filter state. It always holds a value: today+yesterday (UTC) by
// default, wider when explicitly chosen. Only explicit dates go to the URL
// and storage; the default is recomputed at landing so a bookmark doesn't
// fossilize the day it was saved on.
export const RETENTION_DAYS = 90;

export function utcDayString(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
}

export function retentionFloor(): string {
  return utcDayString(-RETENTION_DAYS);
}

export type LagFiltersState = {
  battleTag: string;
  gameSearch: string;
  // Typed name prefixes and exact node picks, each list OR'd on the server.
  serverNames: string[];
  serverNodes: Array<{ id: number; name: string }>;
  proxyName: string;
  proxyIp: string;
  issueCategories: string[];
  explicitOnly: boolean;
  dateFrom: string;
  dateTo: string;
  // False while the window is the recomputed default; true once chosen.
  datesExplicit: boolean;
};

export function applyDefaultWindow(filters: LagFiltersState): void {
  filters.dateFrom = utcDayString(-1);
  filters.dateTo = utcDayString(0);
  filters.datesExplicit = false;
}

export function createDefaultFilters(): LagFiltersState {
  return {
    battleTag: "",
    gameSearch: "",
    serverNames: [],
    serverNodes: [],
    proxyName: "",
    proxyIp: "",
    issueCategories: [],
    explicitOnly: false,
    dateFrom: utcDayString(-1),
    dateTo: utcDayString(0),
    datesExplicit: false,
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
  field: "battleTag" | "gameSearch" | "proxyName" | "proxyIp",
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

const serverFilter: FilterDescriptor = {
  key: "server",
  label: "Server",
  queryKeys: ["serverName", "serverNode"],
  hasValue: (f) => f.serverNames.length > 0 || f.serverNodes.length > 0,
  pillLabel: (f) => {
    const entries = [...f.serverNodes.map((n) => n.name), ...f.serverNames];
    const [first, ...rest] = entries;
    return first ? `Server: ${truncateLabel(first)}${rest.length > 0 ? ` +${rest.length}` : ""}` : "Server: …";
  },
  clear: (f) => {
    f.serverNames = [];
    f.serverNodes = [];
  },
  toParams: (f, p) => {
    p.serverNames = f.serverNames.length > 0 ? [...f.serverNames] : undefined;
    p.serverNodeIds = f.serverNodes.length > 0 ? f.serverNodes.map((n) => n.id) : undefined;
  },
  toQuery: (f, q) => {
    if (f.serverNames.length > 0) q.serverName = f.serverNames.join(",");
    // Exact node picks travel as id:name pairs so a shared link restores the
    // chip's display name without a lookup.
    if (f.serverNodes.length > 0) q.serverNode = f.serverNodes.map((n) => `${n.id}:${n.name}`).join(",");
  },
  fromQuery: (f, q) => {
    const names = queryString(q, "serverName");
    f.serverNames = names ? names.split(",").map((name) => name.trim()).filter(Boolean) : [];
    // id:name pairs — split on the FIRST colon so a name containing one survives.
    const nodes = queryString(q, "serverNode");
    f.serverNodes = nodes
      ? nodes
        .split(",")
        .map((pair) => {
          const sep = pair.indexOf(":");
          if (sep <= 0) return null;
          const id = Number.parseInt(pair.slice(0, sep), 10);
          const name = pair.slice(sep + 1).trim();
          return Number.isFinite(id) && name ? { id, name } : null;
        })
        .filter((n): n is { id: number; name: string } => n !== null)
      : [];
  },
};

const categoriesFilter: FilterDescriptor = {
  key: "categories",
  label: "Categories",
  queryKeys: ["issueCategory"],
  hasValue: (f) => f.issueCategories.length > 0,
  pillLabel: (f) => {
    const [first, ...rest] = f.issueCategories;
    return first ? `Categories: ${first}${rest.length > 0 ? ` +${rest.length}` : ""}` : "Categories: …";
  },
  clear: (f) => {
    f.issueCategories = [];
  },
  toParams: (f, p) => {
    p.issueCategories = f.issueCategories.length > 0 ? [...f.issueCategories] : undefined;
  },
  toQuery: (f, q) => {
    if (f.issueCategories.length > 0) q.issueCategory = f.issueCategories.join(",");
  },
  fromQuery: (f, q) => {
    // Passed through unfiltered: an unknown value is the server's to reject
    // (400), which surfaces — a local whitelist would silently drop a
    // category added after this build shipped.
    const raw = queryString(q, "issueCategory");
    f.issueCategories = raw ? raw.split(",").map((c) => c.trim()).filter(Boolean) : [];
  },
};

const datesFilter: FilterDescriptor = {
  key: "dates",
  label: "Dates",
  queryKeys: ["dateFrom", "dateTo"],
  // The window always holds dates; "has a value" means "was chosen" — the
  // default doesn't count toward active filters or Clear all.
  hasValue: (f) => f.datesExplicit,
  // Both bounds always exist under the window policy; the label is the
  // window itself, default or chosen alike.
  pillLabel: (f) => `${f.dateFrom} – ${f.dateTo}`,
  // Clearing restores the default window — an unbounded state is unreachable.
  clear: applyDefaultWindow,
  toParams: (f, p) => {
    // The window always holds values — the server never sees an unbounded
    // read unless the admin explicitly chose the full retention range.
    p.dateFrom = f.dateFrom;
    p.dateTo = f.dateTo;
  },
  toQuery: (f, q) => {
    // Only a chosen window goes into the URL; the default is recomputed at
    // landing so links to "the default view" stay current rather than pinned.
    if (f.datesExplicit) {
      q.dateFrom = f.dateFrom;
      q.dateTo = f.dateTo;
    }
  },
  fromQuery: (f, q) => {
    const from = queryString(q, "dateFrom");
    const to = queryString(q, "dateTo");
    if (from || to) {
      // A one-sided link (older builds produced them) gets the missing bound
      // filled from the window's own limits.
      f.dateFrom = from || retentionFloor();
      f.dateTo = to || utcDayString(0);
      f.datesExplicit = true;
    } else {
      applyDefaultWindow(f);
    }
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
  serverFilter,
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
