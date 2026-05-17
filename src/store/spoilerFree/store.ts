import { defineStore } from "pinia";
import type { SpoilerFreeState } from "./types";

const SPOILER_FREE_SETTINGS_KEY = "w3c-spoiler-free-settings";

function getDefaultSettings(): SpoilerFreeState {
  return {
    hideWinner: false,
    hideDuration: false,
  };
}

function loadSettingsFromStorage(): SpoilerFreeState {
  if (typeof window === "undefined") {
    return getDefaultSettings();
  }

  const rawSettings = window.localStorage.getItem(SPOILER_FREE_SETTINGS_KEY);
  if (!rawSettings) {
    return getDefaultSettings();
  }

  try {
    const parsedSettings = JSON.parse(rawSettings) as Partial<SpoilerFreeState>;

    return {
      hideWinner: Boolean(parsedSettings.hideWinner),
      hideDuration: Boolean(parsedSettings.hideDuration),
    };
  } catch {
    return getDefaultSettings();
  }
}

export const useSpoilerFreeStore = defineStore("spoilerFree", {
  state: (): SpoilerFreeState => loadSettingsFromStorage(),
  actions: {
    setHideWinner(value: boolean): void {
      this.hideWinner = value;
      this.persist();
    },
    setHideDuration(value: boolean): void {
      this.hideDuration = value;
      this.persist();
    },
    persist(): void {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(
        SPOILER_FREE_SETTINGS_KEY,
        JSON.stringify({
          hideWinner: this.hideWinner,
          hideDuration: this.hideDuration,
        }),
      );
    },
  },
});
