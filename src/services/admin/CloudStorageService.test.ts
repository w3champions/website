import { afterEach, describe, expect, it, vi } from "vitest";
import { CloudStorageProvider } from "@/store/admin/cloudStorage/types";
import CloudStorageService from "./CloudStorageService";

vi.mock("@/config/env", () => ({ API_URL: "https://api.example.com/" }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("storage file listing", () => {
  it.each([CloudStorageProvider.S3, CloudStorageProvider.ALIBABA])("does not turn a %s API outage into an empty catalogue", async (provider) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 })));
    await expect(CloudStorageService.fetchFiles("token", provider)).rejects.toThrow("HTTP 503");
  });

  it("propagates a connection failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(CloudStorageService.fetchFiles("token", CloudStorageProvider.ALIBABA)).rejects.toThrow("Could not reach the ALIBABA storage API");
  });

  it("preserves a genuinely empty successful catalogue", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", { status: 200 })));
    await expect(CloudStorageService.fetchFiles("token", CloudStorageProvider.S3)).resolves.toEqual([]);
  });
});
