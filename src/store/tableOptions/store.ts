import { defineStore } from "pinia";
import type { MatchTableOptionsState } from "./types";

const MATCH_TABLE_OPTIONS_KEY = "w3c-match-table-options";

function getDefaultMatchTableOptions(): MatchTableOptionsState {
  return {
    showHeroes: false,
    showRelativeStartTime: false,
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
      showHeroes: Boolean(parsedSettings.showHeroes),
      showRelativeStartTime: Boolean(parsedSettings.showRelativeStartTime),
    };
  } catch {
    return getDefaultMatchTableOptions();
  }
}

export const useTableOptionsStore = defineStore("tableOptions", {
  state: (): MatchTableOptionsState => loadMatchTableOptions(),
  actions: {
    setShowHeroes(value: boolean): void {
      this.showHeroes = value;
      this.persist();
    },
    setShowRelativeStartTime(value: boolean): void {
      this.showRelativeStartTime = value;
      this.persist();
    },
    persist(): void {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(
        MATCH_TABLE_OPTIONS_KEY,
        JSON.stringify({
          showHeroes: this.showHeroes,
          showRelativeStartTime: this.showRelativeStartTime,
        }),
      );
    },
  },
});
