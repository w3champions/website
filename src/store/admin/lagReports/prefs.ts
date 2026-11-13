import { defineStore } from "pinia";

const LAG_REPORTS_PREFS_KEY = "w3c-admin-lag-reports-prefs";

export type LagReportsFilterKey =
  | "player"
  | "game"
  | "server"
  | "proxy"
  | "proxyIp"
  | "categories"
  | "tags"
  | "dates"
  | "explicit"
  | "repeat"
  | "playerCount";

export type LagReportsColumnKey =
  | "createdAt"
  | "floGameId"
  | "gameId"
  | "gameName"
  | "mapPath"
  | "serverNodeName"
  | "serverNodeId"
  | "playerCount"
  | "proxiedCount"
  | "lagEvents"
  | "connectionEvents"
  | "repeat"
  | "hasExplicitReport"
  | "submittedBy"
  | "players";

const ALL_FILTER_KEYS: LagReportsFilterKey[] = [
  "player",
  "game",
  "server",
  "proxy",
  "proxyIp",
  "categories",
  "tags",
  "dates",
  "explicit",
  "repeat",
  "playerCount",
];

const ALL_COLUMN_KEYS: LagReportsColumnKey[] = [
  "createdAt",
  "floGameId",
  "gameId",
  "gameName",
  "mapPath",
  "serverNodeName",
  "serverNodeId",
  "playerCount",
  "proxiedCount",
  "lagEvents",
  "connectionEvents",
  "repeat",
  "hasExplicitReport",
  "submittedBy",
  "players",
];

type LagReportsPrefsState = {
  pinnedFilters: LagReportsFilterKey[];
  visibleColumns: LagReportsColumnKey[];
};

function getDefaultPrefs(): LagReportsPrefsState {
  return {
    pinnedFilters: ["server", "categories", "player", "dates"],
    // The upstream table's original set — the additional columns are opt-in.
    visibleColumns: ["createdAt", "floGameId", "gameName", "serverNodeName", "hasExplicitReport", "players"],
  };
}

function loadPrefs(): LagReportsPrefsState {
  if (typeof window === "undefined") {
    return getDefaultPrefs();
  }

  const raw = window.localStorage.getItem(LAG_REPORTS_PREFS_KEY);
  if (!raw) {
    return getDefaultPrefs();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LagReportsPrefsState>;
    const defaults = getDefaultPrefs();

    return {
      pinnedFilters: Array.isArray(parsed.pinnedFilters)
        ? parsed.pinnedFilters.filter((key): key is LagReportsFilterKey => ALL_FILTER_KEYS.includes(key))
        : defaults.pinnedFilters,
      visibleColumns: Array.isArray(parsed.visibleColumns)
        ? parsed.visibleColumns.filter((key): key is LagReportsColumnKey => ALL_COLUMN_KEYS.includes(key))
        : defaults.visibleColumns,
    };
  } catch {
    return getDefaultPrefs();
  }
}

export const useLagReportsPrefsStore = defineStore("lagReportsPrefs", {
  state: (): LagReportsPrefsState => loadPrefs(),
  actions: {
    toggleFilterPin(key: LagReportsFilterKey): void {
      this.pinnedFilters = this.pinnedFilters.includes(key)
        ? this.pinnedFilters.filter((k) => k !== key)
        : [...this.pinnedFilters, key];
      this.persist();
    },
    toggleColumn(key: LagReportsColumnKey): void {
      if (this.visibleColumns.includes(key)) {
        // Keep at least one column visible.
        if (this.visibleColumns.length === 1) return;
        this.visibleColumns = this.visibleColumns.filter((k) => k !== key);
      } else {
        // Preserve canonical column order regardless of toggle order.
        this.visibleColumns = ALL_COLUMN_KEYS.filter((k) => k === key || this.visibleColumns.includes(k));
      }
      this.persist();
    },
    persist(): void {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(
        LAG_REPORTS_PREFS_KEY,
        JSON.stringify({
          pinnedFilters: this.pinnedFilters,
          visibleColumns: this.visibleColumns,
        }),
      );
    },
  },
});
