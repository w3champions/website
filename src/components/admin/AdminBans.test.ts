// @vitest-environment jsdom
import { afterEach, beforeEach, expect, type MockInstance, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import type { Plugin } from "vue";
import { createMemoryHistory, createRouter, type Router } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import { BanApiError } from "@/services/admin/banApiError";
import { againDraft } from "@/store/admin/bans/banForm";
import { useOauthStore } from "@/store/oauth/store";
import { accountView, banView, FIXTURE_NOW } from "@/store/admin/bans/fixtures.testing";
import { banTestPlugins, txt } from "./bans/setup.testing";

const service = vi.hoisted(() => ({
  list: vi.fn(),
  account: vi.fn(),
  lookup: vi.fn(),
  create: vi.fn(),
  edit: vi.fn(),
  revoke: vi.fn(),
  authors: vi.fn(),
  machineIds: vi.fn(),
  machineIdAccounts: vi.fn(),
  machineImpact: vi.fn(),
}));
vi.mock("@/services/admin/BanAdminService", () => ({ BanAdminService: service }));
const oauth = vi.hoisted(() => ({ token: "tok", permissions: [] as string[] }));
vi.mock("@/store/oauth/store", async () => {
  // Reactive, as the real store's state is: permissions can change under a mounted page.
  const { reactive } = await import("vue");
  const state = reactive(oauth);
  return { useOauthStore: () => state };
});
const adminStore = vi.hoisted(() => ({ banReasonTranslations: [], loadBanReasonTranslations: vi.fn() }));
vi.mock("@/store/admin/store", () => ({ useAdminStore: () => adminStore }));
// The account header's profile link goes through url-functions, which reads window._env_ at import.
vi.mock("@/config/env", () => ({ INGAME_STATIC_RESOURCES_URL: "/mock/" }));
const loadActiveGameModes = vi.hoisted(() => vi.fn());
// The real module reaches the ranking store and window._env_.
vi.mock("@/composables/GameModesMixin", () => ({ loadActiveGameModes, activeGameModes: () => [] }));
const resolvePlayerEntry = vi.hoisted(() => vi.fn());
vi.mock("@/store/admin/bans/lookup", async (orig) => ({ ...(await orig()), resolvePlayerEntry }));

import AdminBans from "./AdminBans.vue";

const STUBS = { BanToolbar: true, BanTable: true, BanAccountView: true, BanDialog: true, RevokeDialog: true };

let wrapper: VueWrapper;
let router: Router;
let replace: MockInstance;
let push: MockInstance;

const stub = (name: string) => wrapper.findComponent({ name });

/** The bans test plugins with this test's router in place of theirs. */
function plugins(): Plugin[] {
  return [...banTestPlugins().filter((plugin) => !("currentRoute" in plugin)), router];
}

async function open(path: string): Promise<void> {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/admin-banned-players", name: EAdminRouteName.BANNED_PLAYERS, component: AdminBans },
      { path: "/player/:id", component: { template: "<div />" } },
    ],
  });
  await router.push(path);
  await router.isReady();
  replace = vi.spyOn(router, "replace");
  push = vi.spyOn(router, "push");
  wrapper = mount(AdminBans, { global: { plugins: plugins(), stubs: STUBS } });
  await flushPromises();
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ now: FIXTURE_NOW, toFake: ["Date"] });
  oauth.permissions = ["Moderation"];
  service.list.mockResolvedValue({ total: 0, bans: [] });
  service.account.mockResolvedValue(accountView());
  service.authors.mockResolvedValue([]);
  adminStore.loadBanReasonTranslations.mockResolvedValue(undefined);
  loadActiveGameModes.mockResolvedValue(undefined);
});

afterEach(() => {
  wrapper.unmount();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("the URL's filters, sort and page reach the list request", async () => {
  await open("/admin-banned-players?status=revoked&author=Helper(bot)&page=2");
  expect(service.list).toHaveBeenCalledWith({ status: "revoked", author: "Helper(bot)", sort: "lastChange", dir: "desc", page: 2, pageSize: 25 }, "tok");
});

test("opening an account pushes it and Back returns to the same page of the log", async () => {
  await open("/admin-banned-players?page=3");
  stub("BanTable").vm.$emit("openAccount", "1001");
  await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ account: "1001" });
  expect(service.account).toHaveBeenCalledWith("1001", "tok");
  router.back();
  await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ page: "3" });
});

test("the machine filter is never in the URL", async () => {
  oauth.permissions = ["Moderation", "AdminModeration"];
  await open("/admin-banned-players");
  stub("BanToolbar").vm.$emit("update:machineOnly", true);
  await flushPromises();
  expect(service.list).toHaveBeenLastCalledWith({ sort: "lastChange", dir: "desc", page: 1, pageSize: 25, machineOnly: true }, "tok");
  expect(router.currentRoute.value.query).toEqual({});
});

test("the machine filter starts the log at page 1", async () => {
  oauth.permissions = ["Moderation", "AdminModeration"];
  await open("/admin-banned-players?page=3");
  stub("BanToolbar").vm.$emit("update:machineOnly", true);
  await flushPromises();
  expect(service.list).toHaveBeenLastCalledWith({ sort: "lastChange", dir: "desc", page: 1, pageSize: 25, machineOnly: true }, "tok");
  expect(router.currentRoute.value.query).toEqual({});
});

test("the machine filter goes when machine access goes", async () => {
  oauth.permissions = ["Moderation", "AdminModeration"];
  await open("/admin-banned-players");
  stub("BanToolbar").vm.$emit("update:machineOnly", true);
  await flushPromises();
  useOauthStore().permissions = ["Moderation"]; // through the reactive state the page watches
  await flushPromises();
  expect(service.list).toHaveBeenLastCalledWith({ sort: "lastChange", dir: "desc", page: 1, pageSize: 25 }, "tok");
});

test("sort and page changes replace the URL", async () => {
  await open("/admin-banned-players?page=2");
  stub("BanTable").vm.$emit("update:sort", { sort: "ends", dir: "asc" });
  await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ sort: "ends", dir: "asc" });
  stub("BanTable").vm.$emit("update:page", 4);
  await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ sort: "ends", dir: "asc", page: "4" });
  expect(push).not.toHaveBeenCalled();
  expect(service.list).toHaveBeenLastCalledWith({ sort: "ends", dir: "asc", page: 4, pageSize: 25 }, "tok");
});

test("without Moderation the page says so and loads nothing", async () => {
  oauth.permissions = ["Proxies"];
  await open("/admin-banned-players");
  expect(wrapper.text()).toContain(txt("no_permission"));
  expect(service.list).not.toHaveBeenCalled();
  expect(service.authors).not.toHaveBeenCalled();
});

test("after a revoke the notice says how many other bans stay in effect", async () => {
  await open("/admin-banned-players");
  stub("RevokeDialog").vm.$emit("revoked", banView({ id: "ban1", status: "revoked", otherBansInEffect: 2 }));
  await flushPromises();
  expect(wrapper.text()).toContain("Revoked. 2 other bans on this account stay in effect.");
});

test("a create and an edit each have their notice", async () => {
  await open("/admin-banned-players");
  stub("BanToolbar").vm.$emit("add");
  await flushPromises();
  expect([stub("BanDialog").props("mode"), stub("BanDialog").props("accountKey"), stub("BanDialog").props("modelValue")]).toEqual(["add", null, true]);
  stub("BanDialog").vm.$emit("saved", banView({ id: "b1" }));
  await flushPromises();
  expect(wrapper.find(".bans-notice").text()).toBe(txt("notice_created"));
  const ban = banView({ id: "b2" });
  stub("BanTable").vm.$emit("edit", ban);
  await flushPromises();
  expect([stub("BanDialog").props("mode"), stub("BanDialog").props("ban")]).toEqual(["edit", ban]);
  stub("BanDialog").vm.$emit("saved", ban);
  await flushPromises();
  expect(wrapper.find(".bans-notice").text()).toBe(txt("notice_edited"));
});

test("Edit that ban instead closes Add and opens Edit on that ban", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  await open("/admin-banned-players?account=1001");
  stub("BanAccountView").vm.$emit("add");
  await flushPromises();
  expect(stub("BanDialog").props("accountKey")).toBe("1001");
  service.list.mockResolvedValueOnce({ total: 1, bans: [banView({ id: "b1", accountKey: "1001" })] });
  stub("BanDialog").vm.$emit("editInstead", "b1", "1001");
  await flushPromises();
  expect(service.list).toHaveBeenLastCalledWith({ account: "1001", status: "inEffect", sort: "accountDefault", page: 1, pageSize: 100 }, "tok");
  expect(stub("BanDialog").props("mode")).toBe("edit");
  expect(stub("BanDialog").props("ban").id).toBe("b1");
});

test("Edit that ban instead: a ban gone meanwhile and a failed request get different texts", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  await open("/admin-banned-players?account=1001");
  stub("BanAccountView").vm.$emit("add");
  await flushPromises();
  service.list.mockResolvedValueOnce({ total: 0, bans: [] });
  stub("BanDialog").vm.$emit("editInstead", "b1", "1001");
  await flushPromises();
  expect(wrapper.text()).toContain("This ban no longer exists.");
  expect(stub("BanDialog").props("modelValue")).toBe(false);
  service.list.mockRejectedValueOnce(new BanApiError(503, "BANS_UNAVAILABLE", ""));
  stub("BanDialog").vm.$emit("editInstead", "b1", "1001");
  await flushPromises();
  expect(wrapper.find(".bans-notice").text()).toBe("Bans are not available right now. Please tell an administrator.");
  expect(stub("BanDialog").props("modelValue")).toBe(false);
});

test("Edit that ban instead after Add from the toolbar uses the player picked in the dialog", async () => {
  await open("/admin-banned-players");
  stub("BanToolbar").vm.$emit("add");
  await flushPromises();
  expect(stub("BanDialog").props("accountKey")).toBeNull();
  service.list.mockResolvedValueOnce({ total: 1, bans: [banView({ id: "b2", accountKey: "1002" })] });
  stub("BanDialog").vm.$emit("editInstead", "b2", "1002");
  await flushPromises();
  expect(service.list).toHaveBeenLastCalledWith({ account: "1002", status: "inEffect", sort: "accountDefault", page: 1, pageSize: 100 }, "tok");
  expect([stub("BanDialog").props("mode"), stub("BanDialog").props("ban").id, stub("BanDialog").props("modelValue")]).toEqual(["edit", "b2", true]);
});

test("the machine filter stays with the log: an account shows all its bans, and Back brings the filter back", async () => {
  oauth.permissions = ["Moderation", "AdminModeration"];
  service.list.mockResolvedValue({ total: 1, bans: [banView({ id: "ban1", accountKey: "1001" })] }); // the table, not "no bans match"
  await open("/admin-banned-players");
  stub("BanToolbar").vm.$emit("update:machineOnly", true);
  await flushPromises();
  stub("BanTable").vm.$emit("openAccount", "1001");
  await flushPromises();
  expect(service.list).toHaveBeenLastCalledWith({ account: "1001", sort: "accountDefault", dir: "desc", page: 1, pageSize: 25 }, "tok");
  router.back();
  await flushPromises();
  expect(service.list).toHaveBeenLastCalledWith({ sort: "lastChange", dir: "desc", page: 1, pageSize: 25, machineOnly: true }, "tok");
});

test("an account reached by Back or Forward has no matched name", async () => {
  service.account.mockImplementation((accountKey: string) => Promise.resolve(accountView({ accountKey })));
  await open("/admin-banned-players");
  stub("BanToolbar").vm.$emit("openAccount", "1002", "тестер#1002");
  await flushPromises();
  expect(stub("BanAccountView").props("matchedTag")).toBe("тестер#1002");
  router.back();
  await flushPromises();
  router.forward();
  await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ account: "1002" });
  expect(stub("BanAccountView").props("matchedTag")).toBeNull();
});

test("Ban again opens Add with the player locked and the old ban's scope and reasons", async () => {
  await open("/admin-banned-players");
  const old = banView({ id: "ban1", accountKey: "1001", gameModes: [2], status: "expired", banReason: "Leaving games" });
  stub("BanTable").vm.$emit("banAgain", old);
  await flushPromises();
  expect([stub("BanDialog").props("mode"), stub("BanDialog").props("accountKey")]).toEqual(["add", "1001"]);
  expect(stub("BanDialog").props("initialDraft")).toEqual(againDraft(old));
});

test("a pick in the lookup opens the account with the matched name", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1002" }));
  await open("/admin-banned-players?status=revoked");
  stub("BanToolbar").vm.$emit("openAccount", "1002", "тестер#1002");
  await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ account: "1002" });
  expect(stub("BanAccountView").props("matchedTag")).toBe("тестер#1002");
  stub("BanAccountView").vm.$emit("back");
  await flushPromises();
  expect(router.currentRoute.value.query).toEqual({});
});

test("a failed account view says why and retries", async () => {
  const failure = new BanApiError(503, "BANS_UNAVAILABLE", "");
  service.account.mockRejectedValueOnce(failure);
  const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
  await open("/admin-banned-players?account=1001");
  expect(logged).toHaveBeenCalledExactlyOnceWith("Failed to load account bans:", failure);
  expect(wrapper.text()).toContain("Bans are not available right now. Please tell an administrator.");
  expect(stub("BanAccountView").exists()).toBe(false);
  await wrapper.findAll("button").find((b) => b.text() === txt("retry"))!.trigger("click");
  await flushPromises();
  expect(stub("BanAccountView").exists()).toBe(true);
});

test("a filtered log without bans says so", async () => {
  await open("/admin-banned-players?status=revoked");
  expect(wrapper.text()).toContain(txt("no_bans_match"));
});

test("?player= with a single match opens that account and the parameter goes", async () => {
  resolvePlayerEntry.mockResolvedValue({ kind: "account", accountKey: "1001", matchedBattleTag: "Tester#1001" });
  await open("/admin-banned-players?player=%20tester%231001%20");
  expect(resolvePlayerEntry).toHaveBeenCalledWith("tester#1001");
  expect(router.currentRoute.value.query).toEqual({ account: "1001" });
  expect(replace).toHaveBeenCalledWith({ query: { account: "1001" } });
  expect(push).not.toHaveBeenCalled(); // replaced, not pushed
  expect(service.list).toHaveBeenCalledTimes(1);
  expect(stub("BanAccountView").props("matchedTag")).toBe("Tester#1001");
});

test("?player= without a single match puts the name into the lookup with its suggestions", async () => {
  resolvePlayerEntry.mockResolvedValue({ kind: "noSingleMatch", lookupText: "tester" });
  await open("/admin-banned-players?player=tester&status=revoked");
  expect(router.currentRoute.value.query).toEqual({ status: "revoked" });
  expect(stub("BanToolbar").props("lookupText")).toBe("tester");
});

test("?player= whose lookup fails says so and still puts the name into the lookup", async () => {
  resolvePlayerEntry.mockRejectedValue(new BanApiError(503, "BANS_UNAVAILABLE", ""));
  await open("/admin-banned-players?player=tester");
  expect(wrapper.find(".bans-notice").text()).toBe("Bans are not available right now. Please tell an administrator.");
  expect(router.currentRoute.value.query).toEqual({});
  expect(stub("BanToolbar").props("lookupText")).toBe("tester");
});
