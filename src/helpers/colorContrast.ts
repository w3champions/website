/**
 * Contrast repair for author-supplied colours.
 *
 * Warcraft 3 map files carry colours the author picked while looking at the game's
 * own dark UI. The site renders those strings on four themes — human and orc are
 * light, nightelf and undead are dark — so a colour that was legible in the editor
 * can land invisible here. `|cff000000` on undead and `|cffffffff` on human are the
 * everyday cases.
 *
 * The repair clamps luminance rather than inverting it: hue and saturation are the
 * author's meaning ("the green force", "the red difficulty tier") and survive
 * untouched, while lightness is pushed just far enough to clear a WCAG contrast
 * target against the real background. Inverting lightness would fix the two extremes
 * but leave mid-greys as mid-greys, and would flip the relative brightness of a
 * multi-colour description, reading its emphasis backwards.
 */

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** WCAG 2.x relative-luminance channel transfer. */
function channelLuminance(srgb: number): number {
  return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function parseHex(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full = value.length === 3
    ? value.split("").map((c) => c + c).join("")
    : value;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

function toHex(r: number, g: number, b: number): string {
  const channel = (value: number): string =>
    Math.round(Math.min(1, Math.max(0, value)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** WCAG 2.x relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map(channelLuminance);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Which sextant of the colour wheel the max channel puts us in, in degrees. */
function hueOf(r: number, g: number, b: number, max: number, delta: number): number {
  if (max === r) return 60 * (((g - b) / delta) % 6);
  if (max === g) return 60 * ((b - r) / delta + 2);
  return 60 * ((r - g) / delta + 4);
}

/** The RGB triple for a hue's sextant, before the lightness match is added back. */
function rgbBySextant(h: number, chroma: number, secondary: number): [number, number, number] {
  if (h < 60) return [chroma, secondary, 0];
  if (h < 120) return [secondary, chroma, 0];
  if (h < 180) return [0, chroma, secondary];
  if (h < 240) return [0, secondary, chroma];
  if (h < 300) return [secondary, 0, chroma];
  return [chroma, 0, secondary];
}

export function hexToHsl(hex: string): Hsl {
  const [r, g, b] = parseHex(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l };

  const s = delta / (1 - Math.abs(2 * l - 1));
  const h = hueOf(r, g, b, max, delta);

  return { h: (h + 360) % 360, s, l };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const secondary = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = l - chroma / 2;
  const [r, g, b] = rgbBySextant(h, chroma, secondary);
  return toHex(r + match, g + match, b + match);
}

/** Binary-search steps used to close in on the target ratio. 12 gets within ~0.02% of L. */
const SEARCH_STEPS = 12;

interface Candidate {
  hex: string;
  /** How far the lightness had to move from the author's own, 0..1. */
  distance: number;
  ratio: number;
}

/**
 * Walk lightness from the author's value toward `limit` (1 for white, 0 for black)
 * and return the first point that clears `minRatio` — or the endpoint if none does.
 *
 * Contrast is monotonic along this walk, so a binary search on the 0..1 position
 * between the two finds the nearest legible lightness in that direction.
 */
function searchDirection(
  { h, s, l }: Hsl,
  limit: number,
  background: string,
  minRatio: number,
): Candidate {
  const at = (position: number): string => hslToHex({ h, s, l: l + position * (limit - l) });

  let low = 0;
  let high = 1;
  for (let step = 0; step < SEARCH_STEPS; step++) {
    const mid = (low + high) / 2;
    if (contrastRatio(at(mid), background) >= minRatio) high = mid;
    else low = mid;
  }

  const hex = at(high);
  return { hex, distance: high * Math.abs(limit - l), ratio: contrastRatio(hex, background) };
}

/**
 * Return `color` unchanged if it already clears `minRatio` against `background`,
 * otherwise the same hue and saturation at the nearest lightness that does.
 *
 * Both directions are searched rather than picking one from the background's
 * luminance: against a mid-tone background, lightening a colour can top out below
 * the target while darkening it clears easily (pure white on a #7a7a7a surface only
 * reaches 4.3:1, but black reaches 4.9:1). Whichever direction succeeds with the
 * smaller move from the author's lightness wins, so the result stays as close to
 * what they wrote as legibility allows.
 */
export function ensureContrast(color: string, background: string, minRatio = 4.5): string {
  if (contrastRatio(color, background) >= minRatio) return color;

  const hsl = hexToHsl(color);
  const lighter = searchDirection(hsl, 1, background, minRatio);
  const darker = searchDirection(hsl, 0, background, minRatio);

  const lighterWorks = lighter.ratio >= minRatio;
  const darkerWorks = darker.ratio >= minRatio;

  if (lighterWorks && darkerWorks) {
    return lighter.distance <= darker.distance ? lighter.hex : darker.hex;
  }
  if (lighterWorks) return lighter.hex;
  if (darkerWorks) return darker.hex;

  // No lightness of this hue clears the target — the background is pathological.
  // Return whichever extreme is least bad rather than leaving the text invisible.
  return lighter.ratio >= darker.ratio ? lighter.hex : darker.hex;
}

/** Solid stand-ins for when a theme's surface colour carries no usable luminance. */
const FALLBACK_DARK_SURFACE = "#121212";
const FALLBACK_LIGHT_SURFACE = "#ffffff";

const PLAIN_HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * The background to measure contrast against, given a theme colour and whether the
 * active theme is dark.
 *
 * Vuetify hands back whatever the theme declared, which here is a translucent
 * `rgba()` for `surface` and a `var()` reference for some others. Neither has a
 * luminance of its own — what shows through is the solid page colour — so anything
 * that is not a plain hex falls back to a representative solid surface.
 */
export function resolveBackgroundHex(themeColor: string | undefined, isDark: boolean): string {
  if (themeColor && PLAIN_HEX.test(themeColor)) {
    const value = themeColor.slice(1);
    const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
    return `#${full.toLowerCase()}`;
  }
  return isDark ? FALLBACK_DARK_SURFACE : FALLBACK_LIGHT_SURFACE;
}
