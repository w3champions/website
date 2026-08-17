import { defineStore } from "pinia";

const LAG_REPORTS_PREFS_KEY = "w3c-admin-lag-reports-prefs";

export type LagReportsFilterKey =
  | "player"
  | "game"
  | "server"
  | "proxy"
  | "proxyIp"
  | "categories"
  | "dates"
  | "explicit";

const ALL_FILTER_KEYS: LagReportsFilterKey[] = [
  "player",
  "game",
  "server",
  "proxy",
  "proxyIp",
  "categories",
  "dates",
  "explicit",
];

type LagReportsPrefsState = {
  pinnedFilters: LagReportsFilterKey[];
};

function getDefaultPrefs(): LagReportsPrefsState {
  return {
    pinnedFilters: ["server", "categories", "player", "dates"],
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
    persist(): void {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(
        LAG_REPORTS_PREFS_KEY,
        JSON.stringify({
          pinnedFilters: this.pinnedFilters,
        }),
      );
    },
  },
});
