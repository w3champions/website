// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import { testPlugins } from "./smurf-events/setup.testing";

vi.mock("@/config/env", () => ({ API_URL: "/mock/", IDENTIFICATION_URL: "/mock/" }));

const service = vi.hoisted(() => ({ getLinks: vi.fn(), getItems: vi.fn(), getAudit: vi.fn(), getItem: vi.fn() }));
vi.mock("@/store/admin/hardwareSmurfs/service", () => ({ hardwareSmurfService: () => service }));
const oauth = vi.hoisted(() => ({ token: "tok", permissions: [] as string[] }));
vi.mock("@/store/oauth/store", async () => {
  const { reactive } = await import("vue");
  const state = reactive(oauth);
  return { useOauthStore: () => state };
});

import AdminHardwareSmurfs from "./AdminHardwareSmurfs.vue";

// A stand-in with the one field the page prefills.
const PlayerSearchStub = { name: "PlayerSearch", data: () => ({ selected: "" }), template: "<div />" };
const STUBS = { PlayerSearch: PlayerSearchStub, HardwareLinksCard: true, HardwareItemsCard: true, HardwareAuditCard: true, OverrideDialog: true };

let wrapper: VueWrapper;

async function open(path: string): Promise<void> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/admin-hardware-smurfs", name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, component: AdminHardwareSmurfs }],
  });
  await router.push(path);
  await router.isReady();
  wrapper = mount(AdminHardwareSmurfs, { global: { plugins: [...testPlugins(), router], stubs: STUBS } });
  await flushPromises();
}

function serviceCalls(): number {
  return Object.values(service).reduce((sum, fn) => sum + fn.mock.calls.length, 0);
}

beforeEach(() => {
  vi.resetAllMocks();
  service.getLinks.mockResolvedValue([]);
  service.getItems.mockResolvedValue([]);
  service.getAudit.mockResolvedValue({ entries: [] });
});

afterEach(() => wrapper.unmount());

test("a moderator with SmurfCheckerQuery only sees the no_permission alert and no service call is made", async () => {
  oauth.permissions = ["SmurfCheckerQuery"];
  await open("/admin-hardware-smurfs?player=Foo%231");

  expect(wrapper.text()).toContain("SmurfCheckerAdministration");
  expect(wrapper.findComponent({ name: "PlayerSearch" }).exists()).toBe(false);
  expect(serviceCalls()).toBe(0);
});

test("a holder of SmurfCheckerAdministration alone loads the page and the player in the URL", async () => {
  oauth.permissions = ["SmurfCheckerAdministration"];
  await open("/admin-hardware-smurfs?player=Foo%231");

  expect(wrapper.text()).not.toContain("You don't have");
  expect(service.getLinks).toHaveBeenCalled();
});

test("permissions that arrive after the page mounted open the player and prefill the search box", async () => {
  oauth.permissions = [];
  await open("/admin-hardware-smurfs?player=Foo%231");
  expect(serviceCalls()).toBe(0);

  // Through the reactive store, as when the oauth store's permissions land.
  (await import("@/store/oauth/store")).useOauthStore().permissions = ["SmurfCheckerAdministration"];
  await flushPromises();

  expect(service.getLinks).toHaveBeenCalled();
  expect(wrapper.findComponent({ name: "PlayerSearch" }).vm.$data.selected).toBe("Foo#1");
});
