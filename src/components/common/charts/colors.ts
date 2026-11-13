const hexToRgba = (hex: string, alpha: number): string => {
  const body = hex.replace("#", "");
  const full = body.length === 3 ? body.split("").map((c) => c + c).join("") : body;
  const value = parseInt(full, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

/**
 * Applies an alpha to a colour, whether it arrived as rgb() or as hex.
 *
 * Both turn up: fixed palettes tend to be written as rgb(), while colours read
 * from the Vuetify theme come back as hex. Handling only one silently returns
 * the colour unchanged, which turns an intended tint into a solid fill.
 */
export const withAlpha = (color: string, alpha: number): string => {
  if (alpha === 1) return color;
  if (color.startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  return color.startsWith("#") ? hexToRgba(color, alpha) : color;
};
