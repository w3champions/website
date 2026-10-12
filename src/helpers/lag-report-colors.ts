/**
 * Lag-report colour helpers.
 *
 * Semantic colours (warning/info/error and their on-* counterparts) come from the active
 * Vuetify theme via standard --v-theme-* CSS custom properties. No hardcoded values here.
 *
 * Player-colour blending uses fixed ratios since those colours are dynamic per-player.
 */

export type LagAnnotationStyle = {
  border: string;
  bgColor: string;
  textColor: string;
};

export type SemanticColors = {
  warning: LagAnnotationStyle;
  info: LagAnnotationStyle;
  error: LagAnnotationStyle;
};

/**
 * Okabe–Ito hues for categorical series: distinguishable under the common colour-vision
 * deficiencies and readable on both themes. Yellow is left out because it vanishes on the light theme.
 */
export const OKABE_ITO_COLORS: readonly string[] = ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#56B4E9", "#D55E00"];

/** Neutral grey for callers that need a colour when `readThemeColor` finds the theme lacking one. */
export const THEME_FALLBACK_COLOR = "#888888";

/** `rgb()` / `rgba()` of a Vuetify theme colour, read from its --v-theme-* custom property; null when the theme lacks it. */
export function readThemeColor(name: string, alpha = 1): string | null {
  const raw = getComputedStyle(document.body).getPropertyValue(`--v-theme-${name}`).trim();
  const comps = raw.split(/[\s,]+/).filter(Boolean).slice(0, 3).join(",");
  if (!comps) return null;
  return alpha >= 1 ? `rgb(${comps})` : `rgba(${comps},${alpha})`;
}

const CHART_TEXT_ALPHA = 0.75;
const CHART_GRID_ALPHA = 0.12;

export interface ChartInkColors {
  /** Ticks, axis titles and legend labels. */
  text: string;
  /** Grid lines. */
  grid: string;
}

/** The theme's colours for a chart's text and grid; Chart.js's own defaults are dark greys that are hard to read on the dark themes. */
export function readChartInkColors(): ChartInkColors {
  return {
    text: readThemeColor("on-surface", CHART_TEXT_ALPHA) ?? THEME_FALLBACK_COLOR,
    grid: readThemeColor("on-surface", CHART_GRID_ALPHA) ?? THEME_FALLBACK_COLOR,
  };
}

/**
 * Read semantic annotation styles from the active Vuetify theme.
 * Uses tonal semantics: line/text in semantic colour and a translucent fill.
 */
export function readLagChipColors(): SemanticColors {
  const make = (sem: string): LagAnnotationStyle => {
    const tone = readThemeColor(sem);
    if (tone === null) return { border: "#444", bgColor: "rgba(68,68,68,0.18)", textColor: "#444" };
    return { border: tone, bgColor: readThemeColor(sem, 0.18) ?? tone, textColor: tone };
  };

  return { warning: make("warning"), info: make("info"), error: make("error") };
}

// ── Player-colour blending ────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  return {
    r: Number.parseInt(m[1], 16),
    g: Number.parseInt(m[2], 16),
    b: Number.parseInt(m[3], 16),
  };
}

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}

function blend(ch: number, target: number, ratio: number): number {
  return ch * (1 - ratio) + target * ratio;
}

function blendHex(rgb: { r: number; g: number; b: number }, target: number, ratio: number): string {
  return `#${toHex(blend(rgb.r, target, ratio))}${toHex(blend(rgb.g, target, ratio))}${toHex(blend(rgb.b, target, ratio))}`;
}

/**
 * Given a player base colour (#rrggbb) returns a chip/annotation style where the background
 * is darkened toward black and the text is brightened toward white.
 * Blend ratios come from the active Vuetify theme variables.
 */
export function playerColorStyle(baseColor: string): LagAnnotationStyle {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return { border: baseColor, bgColor: baseColor, textColor: "#ffffff" };

  const bgBlend = 0.58;
  const fgBlend = 0.38;

  const bgColor = blendHex(rgb, 0, bgBlend);
  const textColor = blendHex(rgb, 255, fgBlend);
  return { border: textColor, bgColor, textColor };
}

/**
 * Tonal-style marker for chart annotations: semantic-like translucent fill + base-colour line/text.
 */
export function playerColorTonalStyle(baseColor: string): LagAnnotationStyle {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return { border: baseColor, bgColor: baseColor, textColor: baseColor };

  const tone = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  return {
    border: tone,
    bgColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.18)`,
    textColor: tone,
  };
}
