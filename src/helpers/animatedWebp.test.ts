import { describe, expect, it } from "vitest";
import { animatedWebpFrame, assembleAnimatedWebp } from "./animatedWebp";
import { animationDurationMilliseconds, portraitAnimationDimensions } from "./portraitAnimation";

function stillFrame(payload: number[], name = "VP8L"): Uint8Array {
  const bytes = new Uint8Array(20 + payload.length + payload.length % 2);
  bytes.set(new TextEncoder().encode("RIFF"));
  new DataView(bytes.buffer).setUint32(4, bytes.length - 8, true);
  bytes.set(new TextEncoder().encode("WEBP"), 8);
  bytes.set(new TextEncoder().encode(name), 12);
  new DataView(bytes.buffer).setUint32(16, payload.length, true);
  bytes.set(payload, 20);
  return bytes;
}

describe("animated WebP assembly", () => {
  it("keeps every delay, including the last hold and alpha replacement flag", () => {
    const durations = [100, 250, 500];
    const frames = durations.map((duration) => animatedWebpFrame(stillFrame([1, 2, 3]), duration));
    const animation = assembleAnimatedWebp(frames);
    expect(new DataView(animation.buffer).getUint32(4, true)).toBe(animation.length - 8);
    expect(animationDurationMilliseconds(animation, "webp")).toBe(850);
    expect(portraitAnimationDimensions(animation, "webp")).toEqual({ width: 256, height: 256, frames: 3 });
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      expect(frame[20] | frame[21] << 8 | frame[22] << 16).toBe(durations[i]);
      expect(frame[23]).toBe(2); // Replace transparent pixels, rather than overlaying a previous frame.
      expect(Array.from(frame.subarray(24))).toEqual(Array.from(stillFrame([1, 2, 3]).subarray(12)));
    }
  });

  it("omits top-level still metadata and keeps the alpha and image bitstreams", () => {
    const still = stillFrame([7, 8], "ALPH");
    const image = stillFrame([9, 10, 11], "VP8 ").subarray(12);
    const combined = new Uint8Array(still.length + image.length);
    combined.set(still);
    combined.set(image, still.length);
    const frame = animatedWebpFrame(combined, 1000);
    expect(new TextDecoder().decode(frame.subarray(24, 28))).toBe("ALPH");
    expect(new TextDecoder().decode(frame.subarray(34, 38))).toBe("VP8 ");
  });

  it("rejects truncated frames, invalid delays and empty animations", () => {
    expect(() => animatedWebpFrame(stillFrame([1, 2, 3]).slice(0, -2), 100)).toThrow();
    for (const delay of [0, -1, 1.5, 0x1000000]) expect(() => animatedWebpFrame(stillFrame([1]), delay)).toThrow();
    expect(() => assembleAnimatedWebp([])).toThrow();
  });
});
