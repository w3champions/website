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

type SemanticColors = {
  warning: LagAnnotationStyle;
  info: LagAnnotationStyle;
  error: LagAnnotationStyle;
};

/**
 * Read semantic annotation styles from the active Vuetify theme.
 * Uses tonal semantics: line/text in semantic colour and a translucent fill.
 */
export function readLagChipColors(): SemanticColors {
  const style = getComputedStyle(document.body);

  const make = (sem: string): LagAnnotationStyle => {
    const raw = style.getPropertyValue(`--v-theme-${sem}`).trim();
    const comps = raw.split(/[\s,]+/).filter(Boolean).slice(0, 3).join(",");
    if (!comps) return { border: "#444", bgColor: "rgba(68,68,68,0.18)", textColor: "#444" };

    const tone = `rgb(${comps})`;
    return {
      border: tone,
      bgColor: `rgba(${comps},0.18)`,
      textColor: tone,
    };
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
