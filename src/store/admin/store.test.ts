import assert from "node:assert/strict";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, test, vi } from "vitest";
import type { ProxySettings } from "./types";

const adminService = vi.hoisted(() => ({ putProxies: vi.fn(), getGlobalMutesByBattleTags: vi.fn() }));
const moderationService = vi.hoisted(() => ({ getLoungeMutesByBattleTags: vi.fn() }));
// The real services read window._env_ at load time.
vi.mock("@/services/admin/AdminService", () => ({ default: adminService }));
vi.mock("@/services/admin/ModerationService", () => ({ default: moderationService }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import { useAdminStore } from "./store";

beforeEach(() => {
  vi.resetAllMocks();
  setActivePinia(createPinia());
});

const proxies = { nodeOverrides: [], automaticNodeOverrides: [] } as unknown as ProxySettings;

test("proxies are not saved for a player whose settings have no id", async () => {
  const store = useAdminStore();
  store.proxiesSetForSearchedPlayer = { ...proxies, _id: null } as unknown as ProxySettings;
  await store.putNewProxies(proxies);
  store.proxiesSetForSearchedPlayer = { ...proxies, _id: undefined };
  await store.putNewProxies(proxies);
  assert.equal(adminService.putProxies.mock.calls.length, 0);
});

test("mutes are matched to the asked tags ignoring case, and keep the asked tag as key", async () => {
  adminService.getGlobalMutesByBattleTags.mockResolvedValue([{ battleTag: "тестер#1002" }]);
  moderationService.getLoungeMutesByBattleTags.mockResolvedValue([{ battleTag: "tester#1001" }]);
  const store = useAdminStore();
  await store.loadModerationStatusForBattleTags(["Tester#1001", "Тестер#1002"]);
  assert.deepEqual(store.battleTagModerationStatus, {
    "Tester#1001": { globalMute: undefined, loungeMute: { battleTag: "tester#1001" } },
    "Тестер#1002": { globalMute: { battleTag: "тестер#1002" }, loungeMute: undefined },
  });
});
