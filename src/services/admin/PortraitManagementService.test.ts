import { afterEach, describe, expect, it, vi } from "vitest";
import AdminService from "./AdminService";

vi.mock("@/config/env", () => ({ API_URL: "https://api.example.com/" }));
afterEach(() => vi.unstubAllGlobals());

describe("portrait management requests", () => {
  it.each([true, false])("explicitly sends the old-grant cleanup choice (%s) during replacement", async (removeOldAssignments) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ updatedPlayers: 2, updatedRewards: 1 })));
    vi.stubGlobal("fetch", fetch);
    await AdminService.replacePortrait("token", 120, 121, removeOldAssignments);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/rewards/portrait-replacements/120",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ newPortraitId: 121, removeOldAssignments }),
      }),
    );
  });

  it("sends only the administrator’s selected cleanup options and preserves storage warnings", async () => {
    const result = { updatedPlayers: 2, updatedRewards: 0, warnings: ["Alibaba unavailable"] };
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(result)));
    vi.stubGlobal("fetch", fetch);
    const request = { removeAssignments: true, removeDefinition: false, deleteS3: false, deleteAlibaba: true };
    expect(await AdminService.cleanupPortrait("token", 120, request)).toEqual(result);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/rewards/portraits/120/cleanup",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(request),
      }),
    );
  });
});
