import { defineStore } from "pinia";
import type { MatchTableOptionsState } from "./types";

const MATCH_TABLE_OPTIONS_KEY = "w3c-match-table-options";

function getDefaultMatchTableOptions(): MatchTableOptionsState {
  return {
    showCountryFlags: true,
    showServerInfo: false,
    showHeroes: false,
    showPlayerAliases: false,
  };
}

function loadMatchTableOptions(): MatchTableOptionsState {
  if (typeof window === "undefined") {
    return getDefaultMatchTableOptions();
  }

  const rawSettings = window.localStorage.getItem(MATCH_TABLE_OPTIONS_KEY);
  if (!rawSettings) {
    return getDefaultMatchTableOptions();
  }

  try {
    const parsedSettings = JSON.parse(rawSettings) as Partial<MatchTableOptionsState>;

    return {
      showCountryFlags: parsedSettings.showCountryFlags !== false,
      showServerInfo: Boolean(parsedSettings.showServerInfo),
      showHeroes: Boolean(parsedSettings.showHeroes),
      showPlayerAliases: Boolean(parsedSettings.showPlayerAliases),
    };
  } catch {
    return getDefaultMatchTableOptions();
  }
}

export const useTableOptionsStore = defineStore("tableOptions", {
  state: (): MatchTableOptionsState => loadMatchTableOptions(),
  actions: {
    setShowCountryFlags(value: boolean): void {
      this.showCountryFlags = value;
      this.persist();
    },
    setShowServerInfo(value: boolean): void {
      this.showServerInfo = value;
      this.persist();
    },
    setShowHeroes(value: boolean): void {
      this.showHeroes = value;
      this.persist();
    },
    setShowPlayerAliases(value: boolean): void {
      this.showPlayerAliases = value;
      this.persist();
    },
    persist(): void {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(
        MATCH_TABLE_OPTIONS_KEY,
        JSON.stringify({
          showCountryFlags: this.showCountryFlags,
          showServerInfo: this.showServerInfo,
          showHeroes: this.showHeroes,
          showPlayerAliases: this.showPlayerAliases,
        }),
      );
    },
  },
});
