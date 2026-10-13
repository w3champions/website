import { afterEach, describe, expect, it, vi } from "vitest";
import { optimizePortrait } from "./OptimizePortraitService";

const mocks = vi.hoisted(() => ({ still: vi.fn(), animated: vi.fn() }));
vi.mock("./StillPortraitService", () => ({ exportStillPortrait: mocks.still }));
vi.mock("./AnimatedPortraitService", () => ({ exportAnimatedPortrait: mocks.animated }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("stored portrait optimization", () => {
  it("re-encodes the whole image without compositing another frame", async () => {
    const image = { width: 256, height: 256, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(image));
    const context = { drawImage: vi.fn(), imageSmoothingQuality: "low" };
    const canvas = { width: 0, height: 0, getContext: vi.fn().mockReturnValue(context) };
    vi.stubGlobal("document", { createElement: vi.fn().mockReturnValue(canvas) });
    const output = new File(["encoded"], "portrait.webp", { type: "image/webp" });
    mocks.still.mockResolvedValue(output);
    expect(await optimizePortrait(new File(["jpeg"], "SPECIAL_120.jpg"), vi.fn())).toBe(output);
    expect(context.drawImage).toHaveBeenCalledExactlyOnceWith(image, 0, 0, 256, 256);
    expect(image.close).toHaveBeenCalledOnce();
  });

  it("preserves animation and existing framing", async () => {
    const source = new File([new Uint8Array([...new TextEncoder().encode("RIFF....WEBPANIM"), 0, 0, 0, 0])], "SPECIAL_120.jpg");
    const image = { width: 256, height: 256, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(image));
    const status = vi.fn();
    await optimizePortrait(source, status);
    expect(mocks.animated).toHaveBeenCalledWith(source, "webp", { x: 0, y: 0, side: 256 }, null, status, true);
    expect(mocks.still).not.toHaveBeenCalled();
    expect(image.close).toHaveBeenCalledOnce();
  });

  it("requires explicit cropping for a non-square image", async () => {
    const image = { width: 400, height: 256, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(image));
    await expect(optimizePortrait(new File(["jpeg"], "portrait.jpg"), vi.fn())).rejects.toThrow("Use Replace portrait");
    expect(mocks.still).not.toHaveBeenCalled();
    expect(image.close).toHaveBeenCalledOnce();
  });
});
