import { describe, expect, it } from "vitest";
import { animationDurationMilliseconds, animationFrameDelaysMilliseconds, portraitAnimationDimensions, portraitAnimationFormat } from "./portraitAnimation";

const bytes = (text: string) => Uint8Array.from(text, (c) => c.charCodeAt(0));
const chunk = (name: string, data: number[], little = false) => {
  const size = new Uint8Array(4);
  new DataView(size.buffer).setUint32(0, data.length, little);
  return little ? [...bytes(name), ...size, ...data] : [...size, ...bytes(name), ...data, 0, 0, 0, 0];
};

describe("portrait animation detection", () => {
  it("detects APNG contents regardless of the filename", () => {
    const png = [137, ...bytes("PNG\r\n\x1a\n")];
    expect(portraitAnimationFormat(new Uint8Array([...png, ...chunk("acTL", [0, 0, 0, 3, 0, 0, 0, 0])]))).toBe("apng");
    expect(portraitAnimationFormat(new Uint8Array([...png, ...chunk("acTL", [0, 0, 0, 1, 0, 0, 0, 0])]))).toBeNull();
  });
  it("counts GIF images while skipping compressed data and extensions", () => {
    const header = [...bytes("GIF89a"), 1, 0, 1, 0, 0, 0, 0];
    const frame = [0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 0x2c, 0x2c, 0];
    expect(portraitAnimationFormat(new Uint8Array([...header, ...frame, 0x3b]))).toBeNull();
    expect(portraitAnimationFormat(new Uint8Array([...header, ...frame, 0x21, 0xfe, 1, 0x2c, 0, ...frame, 0x3b]))).toBe("gif");
  });
  it("reads WebP chunks including odd length padding", () => {
    const header = [...bytes("RIFF"), 0, 0, 0, 0, ...bytes("WEBP")];
    expect(portraitAnimationFormat(new Uint8Array([...header, ...chunk("VP8 ", [1], true), 0, ...chunk("ANIM", [0, 0, 0, 0, 0, 0], true)]))).toBe("webp");
    expect(portraitAnimationFormat(new Uint8Array([...header, ...chunk("VP8 ", [1, 2], true)]))).toBeNull();
  });
  it("handles empty, truncated and non-image input", () => {
    for (const data of [[], [137, 80, 78, 71], [...bytes("GIF89a")], [...bytes("not an image")]]) {
      expect(portraitAnimationFormat(new Uint8Array(data))).toBeNull();
    }
  });
});

it("reads GIF frame delays and APNG fractional delays", () => {
  const header = [...bytes("GIF89a"), 1, 0, 1, 0, 0, 0, 0];
  const frame = [0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 1, 0, 0];
  const gce = [0x21, 0xf9, 4, 0, 25, 0, 0, 0];
  expect(animationDurationMilliseconds(new Uint8Array([...header, ...gce, ...frame, ...frame, 0x3b]), "gif")).toBe(350);
  const png = [137, ...bytes("PNG\r\n\x1a\n")];
  expect(animationDurationMilliseconds(new Uint8Array([...png, ...chunk("fcTL", [...Array(20).fill(0), 0, 1, 0, 4, 0, 0])]), "apng")).toBe(250);
});

it("reads animation dimensions and frame counts before allocating decoded frames", () => {
  const gif = [...bytes("GIF89a"), 2, 0, 3, 0, 0, 0, 0];
  const gifFrame = [0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 1, 0, 0];
  expect(portraitAnimationDimensions(new Uint8Array([...gif, ...gifFrame, ...gifFrame, 0x3b]), "gif")).toEqual({ width: 2, height: 3, frames: 2 });
  const png = [137, ...bytes("PNG\r\n\x1a\n")];
  expect(portraitAnimationDimensions(new Uint8Array([...png, ...chunk("IHDR", [0, 0, 1, 0, 0, 0, 0, 128, 8, 6, 0, 0, 0]), ...chunk("fcTL", Array(26).fill(0))]), "apng")).toEqual({ width: 256, height: 128, frames: 1 });
  const webp = [...bytes("RIFF"), 0, 0, 0, 0, ...bytes("WEBP")];
  expect(portraitAnimationDimensions(new Uint8Array([...webp, ...chunk("VP8X", [2, 0, 0, 0, 255, 0, 0, 127, 0, 0], true), ...chunk("ANMF", Array(16).fill(0), true)]), "webp")).toEqual({ width: 256, height: 128, frames: 1 });
  expect(() => portraitAnimationDimensions(new Uint8Array([...webp, ...chunk("VP8X", [2], true)]), "webp")).toThrow();
  expect(() => portraitAnimationDimensions(new Uint8Array([...png, 0, 255, 255, 255, ...bytes("IHDR")]), "apng")).toThrow();
});

it("keeps APNG delays below the parser's playback clamp", () => {
  const png = [137, ...bytes("PNG\r\n\x1a\n")];
  const frame = chunk("fcTL", [...Array(20).fill(0), 0, 1, 0, 120, 0, 0]);
  const data = new Uint8Array([...png, ...frame, ...frame, ...frame]);
  expect(animationFrameDelaysMilliseconds(data, "apng")).toEqual([1000 / 120, 1000 / 120, 1000 / 120]);
  expect(animationDurationMilliseconds(data, "apng")).toBe(25);
});
