import { DETECTED_SOURCE_STORAGE_KEY, type DetectedSource, type DownloadSource, parseDetectedSource, parseSavedSource, SAVED_SOURCE_STORAGE_KEY } from "./launcherDownloadSource";

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

/** Detection's answer from earlier in this browser session, if any. */
export function readDetectedSource(): DetectedSource | null {
  try {
    return parseDetectedSource(sessionStorage.getItem(DETECTED_SOURCE_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Only definite answers are kept: an unknown one is asked again on the next visit. */
export function writeDetectedSource(source: DetectedSource): void {
  try {
    sessionStorage.setItem(DETECTED_SOURCE_STORAGE_KEY, source);
  } catch {
    // Detection then runs again on the next page view.
  }
}
