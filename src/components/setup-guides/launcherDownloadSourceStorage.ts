import { type DownloadSource, parseSavedSource, SAVED_SOURCE_STORAGE_KEY } from "./launcherDownloadSource";

// Storage can be missing or throw (private windows, blocked site data), and the
// download buttons must work regardless, so every access is guarded.

export function readSavedSource(): DownloadSource | null {
  try {
    return parseSavedSource(localStorage.getItem(SAVED_SOURCE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeSavedSource(source: DownloadSource | null): void {
  try {
    if (source === null) localStorage.removeItem(SAVED_SOURCE_STORAGE_KEY);
    else localStorage.setItem(SAVED_SOURCE_STORAGE_KEY, source);
  } catch {
    // The choice then lasts for this page view only.
  }
}
