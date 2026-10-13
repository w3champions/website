import { afterEach, describe, expect, it, vi } from "vitest";
import { exportStillPortrait } from "./StillPortraitService";

afterEach(() => vi.unstubAllGlobals());

describe("still portrait WebP export", () => {
  it("uses the native WebP encoder without loading a worker", async () => {
    const worker = vi.fn();
    vi.stubGlobal("Worker", worker);
    const canvas = { toBlob: (done: (blob: Blob) => void) => done(new Blob(["native"], { type: "image/webp" })) } as HTMLCanvasElement;
    const file = await exportStillPortrait(canvas);
    expect(file.type).toBe("image/webp");
    expect(file.name).toBe("portrait.webp");
    expect(await file.text()).toBe("native");
    expect(worker).not.toHaveBeenCalled();
  });

  it("encodes pixels with the worker when canvas silently falls back to PNG", async () => {
    const terminate = vi.fn();
    const pixels = new Uint8ClampedArray([12, 34, 56, 255]);
    class Worker {
      onmessage?: (event: { data: { bytes: Uint8Array } }) => void;
      terminate = terminate;
      postMessage(data: { pixels: Uint8ClampedArray; width: number; height: number }, transfer: ArrayBuffer[]) {
        expect(data).toEqual({ pixels, width: 1, height: 1 });
        expect(transfer).toEqual([pixels.buffer]);
        this.onmessage?.({ data: { bytes: new Uint8Array([1, 2, 3]) } });
      }
    }
    vi.stubGlobal("Worker", Worker);
    const canvas = {
      width: 1,
      height: 1,
      toBlob: (done: (blob: Blob) => void) => done(new Blob(["png fallback"], { type: "image/png" })),
      getContext: () => ({ getImageData: () => ({ data: pixels }) }),
    } as unknown as HTMLCanvasElement;
    const file = await exportStillPortrait(canvas);
    expect(file.type).toBe("image/webp");
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    expect(terminate).toHaveBeenCalledOnce();
  });
});
