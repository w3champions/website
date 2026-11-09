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

  it("returnsNullWhenTheRequestFails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect(await LauncherDownloadSourceService.fetchDetected()).toBeNull();
  });
});
