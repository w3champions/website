import { afterEach, describe, expect, it, vi } from "vitest";
import { exportAnimatedPortrait } from "./AnimatedPortraitService";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("animated portrait worker lifecycle", () => {
  it("passes first-frame mode and crop to the worker and releases it after export", async () => {
    const terminate = vi.fn();
    const status = vi.fn();
    const file = new File(["source"], "portrait.gif");
    const crop = { x: 25, y: 10, side: 128 };
    class Worker {
      onmessage?: (event: { data: { status?: string; bytes?: Uint8Array } }) => void;
      terminate = terminate;
      postMessage(data: unknown) {
        expect(data).toEqual({ file, format: "gif", crop, frameURL: null, keepAnimation: false });
        this.onmessage?.({ data: { status: "Preparing the first frame…" } });
        this.onmessage?.({ data: { bytes: new Uint8Array([1, 2, 3]) } });
      }
    }
    vi.stubGlobal("Worker", Worker);
    const output = await exportAnimatedPortrait(file, "gif", crop, null, status, false);
    expect(output.type).toBe("image/webp");
    expect(output.name).toBe("portrait.webp");
    expect(status).toHaveBeenCalledWith("Preparing the first frame…");
    expect(status).toHaveBeenLastCalledWith("");
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("terminates stalled decoding rather than leaving a worker and WASM heap running", async () => {
    vi.useFakeTimers();
    const terminate = vi.fn();
    class Worker {
      terminate = terminate;
      postMessage() {}
    }
    vi.stubGlobal("Worker", Worker);
    const job = exportAnimatedPortrait(new File(["source"], "portrait.gif"), "gif", { x: 0, y: 0, side: 256 }, null, vi.fn());
    const failure = expect(job).rejects.toThrow("exceeded 60 seconds");
    await vi.advanceTimersByTimeAsync(60000);
    await failure;
    expect(terminate).toHaveBeenCalledOnce();
  });
});
