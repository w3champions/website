// State logic for the launcher download-source choice. Pure: no DOM, no storage,
// no network, so every rule is testable on its own.

export type DownloadSource = "cn" | "global";
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

/** The other source of the two. */
export function otherSource(source: LinkSource): DownloadSource {
  return source === "cn" ? "global" : "cn";
}

export function installerUrl(base: string, platform: InstallerPlatform, source: LinkSource): string {
  return `${base}launcher-e/${platform}?source=${source}`;
}

export const SAVED_SOURCE_STORAGE_KEY = "w3c-launcher-download-source";

export function parseSavedSource(raw: string | null): DownloadSource | null {
  return raw === "cn" || raw === "global" ? raw : null;
}

// Fixed Chinese strings: the site always starts in English, so the China-related
// text is shown in Chinese regardless of the site language.
export const ZH = {
  label: "下载线路",
  global: "国际线路（GitHub）",
  china: "中国大陆线路",
  detectedNotice: "检测到您在中国大陆，已自动使用中国大陆线路下载。",
  chosenByYou: "（你的选择）",
  useChina: "中国大陆用户：使用中国大陆线路",
  useGlobal: "改用国际线路（GitHub）",
  hintGlobalSource: (platformName: string) => `下载没反应或很慢？用中国大陆线路重新下载 ${platformName} 版`,
  hintChinaSource: "下载没反应或很慢？试试国际线路（GitHub）",
} as const;
