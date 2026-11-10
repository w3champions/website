// State logic for the launcher download-source choice. Pure: no DOM, no storage,
// no network, so every rule is testable on its own.

export type DownloadSource = "global" | "intl" | "cn";
/** What the installer links ask for: a concrete source, or "let the service decide". */
export type LinkSource = DownloadSource | "auto";
export type InstallerPlatform = "windows" | "mac-arm64" | "mac-x64";

/** A saved choice wins over the service's detection; with neither, the service decides. */
export function effectiveSource(
  detected: DownloadSource | null,
  saved: DownloadSource | null,
): LinkSource {
  return saved ?? detected ?? "auto";
}

/**
 * What to store after the visitor picks `chosen`. Picking what detection would
 * choose anyway stores nothing, so the page keeps following detection.
 */
export function nextSaved(
  detected: DownloadSource | null,
  chosen: DownloadSource,
): DownloadSource | null {
  return chosen === detected ? null : chosen;
}

export function installerUrl(base: string, platform: InstallerPlatform, source: LinkSource): string {
  return `${base}launcher-e/${platform}?source=${source}`;
}

/** The sources in display order: the detected one first, otherwise the standard download. */
export function orderedSources(detected: DownloadSource | null): readonly DownloadSource[] {
  return detected === "cn" ? ["cn", "intl", "global"] : ["global", "intl", "cn"];
}

/**
 * The source to suggest after a download from `clicked` seemed slow or stuck: the
 * next one in display order, wrapping around. After "auto" (the service decided)
 * the backup download is the safe suggestion.
 */
export function fallbackSource(clicked: LinkSource, detected: DownloadSource | null): DownloadSource {
  if (clicked === "auto") return "intl";
  const order = orderedSources(detected);
  return order[(order.indexOf(clicked) + 1) % order.length];
}

/** Language used for the Chinese line shown beside the site-language text. */
export const SUPPLEMENT_LOCALE = "zh";

/** The Chinese text to add beside the localized one, or null when it already is that text. */
export function chineseSupplement(localized: string, chinese: string): string | null {
  return localized === chinese ? null : chinese;
}

export const SAVED_SOURCE_STORAGE_KEY = "w3c-launcher-download-source";

export function parseSavedSource(raw: string | null): DownloadSource | null {
  return raw === "global" || raw === "intl" || raw === "cn" ? raw : null;
}
