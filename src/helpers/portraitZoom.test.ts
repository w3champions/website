import { describe, expect, it } from "vitest";
import { PORTRAIT_MIN_ZOOM } from "./portraitCrop";
import { portraitZoomFromSlider, portraitZoomToSlider } from "./portraitZoom";

describe("portrait zoom slider scale", () => {
  it("reserves the first fifth for fitting within the frame", () => {
    expect(portraitZoomToSlider(PORTRAIT_MIN_ZOOM, PORTRAIT_MIN_ZOOM)).toBe(0);
    expect(portraitZoomToSlider(1, PORTRAIT_MIN_ZOOM)).toBe(20);
    expect(portraitZoomFromSlider(10, PORTRAIT_MIN_ZOOM)).toBe((PORTRAIT_MIN_ZOOM + 1) / 2);
    expect(portraitZoomFromSlider(60, PORTRAIT_MIN_ZOOM)).toBe(2);
    expect(portraitZoomFromSlider(100, PORTRAIT_MIN_ZOOM)).toBe(4);
  });
  it.each([PORTRAIT_MIN_ZOOM, 1])("keeps percentage entry and slider positions consistent with minimum %f", (minimum) => {
    for (const zoom of [minimum, 1, 1.25, 1.5, 2, 3, 4]) {
      expect(portraitZoomFromSlider(portraitZoomToSlider(zoom, minimum), minimum)).toBeCloseTo(zoom, 10);
    }
    expect(portraitZoomFromSlider(-10, minimum)).toBe(minimum);
    expect(portraitZoomFromSlider(110, minimum)).toBe(4);
  });
});
