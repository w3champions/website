import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ LAUNCHER_UPDATE_URL: "https://x/api/" }));

import LauncherDownloadSourceService from "./LauncherDownloadSourceService";

const answer = (body: unknown, ok = true) => vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) });

describe("LauncherDownloadSourceService.fetchDetected", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returnsTheDetectedSource", async () => {
    const fetchMock = answer({ detected: "cn" });
    vi.stubGlobal("fetch", fetchMock);

    expect(await LauncherDownloadSourceService.fetchDetected()).toBe("cn");
    expect(fetchMock.mock.calls[0][0]).toBe("https://x/api/launcher-e/source");
  });

  it("returnsNullForAnUnexpectedAnswerOrStatus", async () => {
    vi.stubGlobal("fetch", answer({ detected: "hk" }));
    expect(await LauncherDownloadSourceService.fetchDetected()).toBeNull();

    vi.stubGlobal("fetch", answer({ detected: "cn" }, false));
    expect(await LauncherDownloadSourceService.fetchDetected()).toBeNull();
  });

  it("returnsNullWhenAnOkAnswerHasAnUnreadableBody", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.reject(new SyntaxError("bad json")) }));
    expect(await LauncherDownloadSourceService.fetchDetected()).toBeNull();
  });

  it("returnsNullWhenTheRequestFails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect(await LauncherDownloadSourceService.fetchDetected()).toBeNull();
  });

  it("returnsNullWhenNoAnswerArrivesWithinThreeSeconds", async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal(
        "fetch",
        vi.fn((_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal!.addEventListener("abort", () => reject(new Error("aborted")));
          })
        ),
      );

      const pending = LauncherDownloadSourceService.fetchDetected();
      await vi.advanceTimersByTimeAsync(2999);
      let settled = false;
      void pending.then(() => (settled = true));
      await vi.advanceTimersByTimeAsync(0);
      expect(settled).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(await pending).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
