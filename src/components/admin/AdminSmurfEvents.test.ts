// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter, type Router } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { manualEvent, testPlugins } from "./smurf-events/setup.testing";

const service = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn() }));
vi.mock("@/store/admin/smurfEvents/service", () => ({ smurfEventsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok", permissions: ["SmurfCheckerQuery", "SmurfCheckerAdministration"] }) }));

import AdminSmurfEvents from "./AdminSmurfEvents.vue";

const STUBS = { EventList: true, EventDetail: true, ManualEventDialog: true, ReviewDialog: true, DeleteEventDialog: true };

let wrapper: VueWrapper;
let router: Router;

async function open(path: string): Promise<void> {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/admin-smurf-events", name: EAdminRouteName.SMURF_EVENTS, component: AdminSmurfEvents },
      { path: "/admin-hardware-smurfs", name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, component: { template: "<div />" } },
    ],
  });
  await router.push(path);
  await router.isReady();
  wrapper = mount(AdminSmurfEvents, { global: { plugins: [...testPlugins(), router], stubs: STUBS } });
  await flushPromises();
}

beforeEach(() => {
  vi.resetAllMocks();
  service.list.mockResolvedValue({ events: [] });
  service.get.mockResolvedValue(manualEvent());
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => wrapper.unmount());

test("a create shows the new event with its notice and loads it only once", async () => {
  await open("/admin-smurf-events");
  const created = manualEvent({ id: "ev-new", name: "New LAN" });
  // As saveManual does: the saved event is already in the store when the dialog reports it.
  useSmurfEventsStore().detail = created;

  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", created);
  await flushPromises();

  expect(router.currentRoute.value.query.event).toBe("ev-new");
  expect(wrapper.text()).toContain("Event saved.");
  expect(service.get).not.toHaveBeenCalled();
  expect(useSmurfEventsStore().detail?.id).toBe("ev-new");
});

test("a delete returns to the list and shows its notice", async () => {
  await open("/admin-smurf-events?event=ev1");
  expect(service.get).toHaveBeenCalledWith("tok", "ev1");

  wrapper.findComponent({ name: "DeleteEventDialog" }).vm.$emit("deleted");
  await flushPromises();

  expect(router.currentRoute.value.query.event).toBeUndefined();
  expect(wrapper.text()).toContain("Event deleted.");
});

test("a notice ends once the moderator opens another view", async () => {
  await open("/admin-smurf-events?event=ev1");
  wrapper.findComponent({ name: "DeleteEventDialog" }).vm.$emit("deleted");
  await flushPromises();

  await router.push("/admin-smurf-events?event=ev2");
  await flushPromises();

  expect(wrapper.text()).not.toContain("Event deleted.");
});

test("filters follow the URL, including browser back and forward", async () => {
  await open("/admin-smurf-events?origin=manual");
  expect(service.list).toHaveBeenLastCalledWith("tok", { origin: "manual", limit: 50 });

  wrapper.findComponent({ name: "EventList" }).vm.$emit("update:filters", { origin: "manual", review: "unreviewed" });
  await flushPromises();
  expect(router.currentRoute.value.query).toMatchObject({ origin: "manual", review: "unreviewed" });
  expect(service.list).toHaveBeenLastCalledWith("tok", { origin: "manual", review: "unreviewed", limit: 50 });

  router.back();
  await flushPromises();
  expect(service.list).toHaveBeenLastCalledWith("tok", { origin: "manual", limit: 50 });
  expect(useSmurfEventsStore().filters).toEqual({ origin: "manual", review: null });

  router.forward();
  await flushPromises();
  expect(useSmurfEventsStore().filters).toEqual({ origin: "manual", review: "unreviewed" });
  // Mount, the filter change, back and forward: one load each.
  expect(service.list).toHaveBeenCalledTimes(4);
});
