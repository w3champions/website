import { describe, expect, it } from "vitest";
import { portraitCrop } from "./portraitCrop";

describe("portrait crop bounds", () => {
  it.each([[1600, 900], [900, 1600], [256, 256]])("fills the square without sampling outside a %i × %i source", (width, height) => {
    for (const zoom of [1, 1.5, 4]) {
      for (const position of [0, 50, 100]) {
        const crop = portraitCrop(width, height, zoom, position, position);
        expect(crop.side).toBeGreaterThan(0);
        expect(crop.x).toBeGreaterThanOrEqual(0);
        expect(crop.y).toBeGreaterThanOrEqual(0);
        expect(crop.x + crop.side).toBeLessThanOrEqual(width);
        expect(crop.y + crop.side).toBeLessThanOrEqual(height);
      }
    }
  });

  it("centres the initial crop and permits reaching both ends of a landscape image", () => {
    expect(portraitCrop(600, 400, 1, 50, 50)).toEqual({ x: 100, y: 0, side: 400 });
    expect(portraitCrop(600, 400, 1, 0, 50).x).toBe(0);
    expect(portraitCrop(600, 400, 1, 100, 50).x).toBe(200);
  });

  it("clamps out of range controls to prevent empty edges", () => {
    expect(portraitCrop(600, 400, 0.5, -20, 120)).toEqual({ x: 0, y: 0, side: 400 });
  });
});
