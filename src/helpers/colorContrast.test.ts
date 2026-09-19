import { describe, expect, it } from "vitest";
import { contrastRatio, ensureContrast, hexToHsl, resolveBackgroundHex } from "./colorContrast";

describe("contrastRatio", () => {
  it("reports the maximum ratio for black against white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
  });

  it("reports no contrast for a colour against itself", () => {
    expect(contrastRatio("#3a7bd5", "#3a7bd5")).toBeCloseTo(1, 5);
  });

  it("is symmetric in its arguments", () => {
    expect(contrastRatio("#1a1a2e", "#e94560")).toBeCloseTo(
      contrastRatio("#e94560", "#1a1a2e"),
      5,
    );
  });
});

describe("ensureContrast", () => {
  const DARK_BG = "#1e1e1e";
  const LIGHT_BG = "#fafafa";

  it("leaves a colour that already clears the target untouched", () => {
    // A bright green is perfectly legible on the dark themes already.
    expect(ensureContrast("#7ee787", DARK_BG, 4.5)).toBe("#7ee787");
  });

  it("lightens a near-black author colour until it is legible on a dark background", () => {
    // `|cff000000` is the classic map-file offender: invisible on nightelf/undead.
    const fixed = ensureContrast("#000000", DARK_BG, 4.5);
    expect(contrastRatio(fixed, DARK_BG)).toBeGreaterThanOrEqual(4.5);
  });

  it("darkens a near-white author colour until it is legible on a light background", () => {
    const fixed = ensureContrast("#ffffff", LIGHT_BG, 4.5);
    expect(contrastRatio(fixed, LIGHT_BG)).toBeGreaterThanOrEqual(4.5);
  });

  it("rescues a mid-grey, which inverting lightness would leave unreadable", () => {
    // The case that motivated clamping over inversion: #808080 inverts to roughly
    // itself and stays illegible either way.
    const fixed = ensureContrast("#808080", "#7a7a7a", 4.5);
    expect(contrastRatio(fixed, "#7a7a7a")).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the author's hue and saturation, moving only lightness", () => {
    // "The green bit stays green" — the whole reason for clamping rather than
    // recolouring or stripping.
    const original = hexToHsl("#0a3d0a");
    const adjusted = hexToHsl(ensureContrast("#0a3d0a", DARK_BG, 4.5));
    expect(adjusted.h).toBeCloseTo(original.h, 0);
    expect(adjusted.s).toBeCloseTo(original.s, 2);
    expect(adjusted.l).toBeGreaterThan(original.l);
  });

  it("reaches the target for every hue on both backgrounds", () => {
    for (let hue = 0; hue < 360; hue += 15) {
      for (const background of [DARK_BG, LIGHT_BG]) {
        const color = hslToHex(hue, 1, 0.5);
        const fixed = ensureContrast(color, background, 4.5);
        expect(contrastRatio(fixed, background)).toBeGreaterThanOrEqual(4.4);
      }
    }
  });
});

function sextant(h: number, chroma: number, secondary: number): [number, number, number] {
  if (h < 60) return [chroma, secondary, 0];
  if (h < 120) return [secondary, chroma, 0];
  if (h < 180) return [0, chroma, secondary];
  if (h < 240) return [0, secondary, chroma];
  if (h < 300) return [secondary, 0, chroma];
  return [chroma, 0, secondary];
}

/** Local test helper: builds an input colour without depending on the module under test. */
function hslToHex(h: number, s: number, l: number): string {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const secondary = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = l - chroma / 2;
  const [r, g, b] = sextant(h, chroma, secondary);
  const channel = (value: number): string => Math.round((value + match) * 255).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

describe("resolveBackgroundHex", () => {
  it("uses the theme colour when it is a plain hex", () => {
    expect(resolveBackgroundHex("#0d0718", true)).toBe("#0d0718");
  });

  it("expands a three-digit hex", () => {
    expect(resolveBackgroundHex("#eee", false)).toBe("#eeeeee");
  });

  it("falls back to a solid dark surface when the theme colour is not a hex", () => {
    // Vuetify themes may hand back rgba() or a var() reference, which carries no
    // usable luminance on its own.
    expect(resolveBackgroundHex("rgba(13, 7, 24, 0.9)", true)).toBe("#121212");
  });

  it("falls back to a solid light surface on a light theme", () => {
    expect(resolveBackgroundHex("var(--w3-bg-glass)", false)).toBe("#ffffff");
  });

  it("falls back when the theme colour is missing entirely", () => {
    expect(resolveBackgroundHex(undefined, true)).toBe("#121212");
    expect(resolveBackgroundHex("", false)).toBe("#ffffff");
  });
});
