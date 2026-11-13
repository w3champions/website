// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import { useAdminStore } from "@/store/admin/store";
import { testPlugins } from "./smurf-events/setup.testing";

// Modules that read the runtime config at import time need it before they load.
vi.hoisted(() => {
  Object.assign(window, { _env_: { BASE_URL: "/mock/", IDENTIFICATION_URL: "/mock/" } });
});

import AdminSmurfs from "./AdminSmurfs.vue";

let wrapper: VueWrapper;

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => wrapper.unmount());

test("the search for the player in the URL still runs when the identifier type list is refused", async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/admin-smurfs", name: EAdminRouteName.SMURF_CHECKER_QUERY, component: AdminSmurfs }],
  });
  await router.push("/admin-smurfs?player=Foo%231");
  await router.isReady();
  const plugins = testPlugins();
  const store = useAdminStore();
  const refused = new Error("403");
  vi.spyOn(store, "getSmurfIdentifierTypes").mockRejectedValue(refused);
  const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const search = vi.spyOn(store, "querySmurfsForIdentifier").mockResolvedValue({ connectedBattleTags: [] } as never);

  wrapper = mount(AdminSmurfs, { global: { plugins: [...plugins, router], stubs: { PlayerSearch: true } } });
  await flushPromises();

  expect(search).toHaveBeenCalledWith("battleTag", "Foo#1", 1, false);
  expect(logged).toHaveBeenCalledWith("Loading the identifier types failed:", refused);
});
