// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter, type Router } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { manualEvent, testPlugins } from "./smurf-events/setup.testing";

const service = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn() }));
vi.mock("@/store/admin/smurfEvents/service", () => ({ smurfEventsService: () => service }));
const oauth = vi.hoisted(() => ({ token: "tok", permissions: [] as string[] }));
vi.mock("@/store/oauth/store", async () => {
  // Reactive, as the real store's state is: permissions can change under a mounted page.
  const { reactive } = await import("vue");
  const state = reactive(oauth);
  return { useOauthStore: () => state };
});

import AdminSmurfEvents from "./AdminSmurfEvents.vue";

const STUBS = { EventList: true, EventDetail: true, ManualEventDialog: true, ReviewDialog: true, DeleteEventDialog: true };

function dialogCount(): number {
  return ["ManualEventDialog", "ReviewDialog", "DeleteEventDialog"].filter((name) => wrapper.findComponent({ name }).exists()).length;
}

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
  oauth.permissions = ["SmurfCheckerQuery", "SmurfCheckerAdministration"];
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

  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", created, { applied: true, existing: false });
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

test("a save not yet applied to the links says the effect follows shortly", async () => {
  await open("/admin-smurf-events");
  const created = manualEvent({ id: "ev-new" });
  useSmurfEventsStore().detail = created;

  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", created, { applied: false, existing: false });
  await flushPromises();

  expect(wrapper.text()).toContain("Event saved. Its effect on links will follow shortly.");
});

test("a create that answered an existing event says nothing was changed", async () => {
  await open("/admin-smurf-events");
  const existing = manualEvent({ id: "ev-old" });
  useSmurfEventsStore().detail = existing;

  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", existing, { applied: true, existing: true });
  await flushPromises();

  expect(wrapper.text()).toContain("already exists, so nothing was changed");
  expect(wrapper.text()).not.toContain("Event saved.");
});

test("a review shows its notice, and the pending one when the links are not yet updated", async () => {
  await open("/admin-smurf-events?event=ev1");

  wrapper.findComponent({ name: "ReviewDialog" }).vm.$emit("reviewed", true);
  await flushPromises();
  expect(wrapper.text()).toContain("Review saved.");
  expect(wrapper.text()).not.toContain("follow shortly");

  wrapper.findComponent({ name: "ReviewDialog" }).vm.$emit("reviewed", false);
  await flushPromises();
  expect(wrapper.text()).toContain("Review saved. Its effect on links will follow shortly.");
});

test("a save that finishes after the moderator went to another event does not navigate back", async () => {
  await open("/admin-smurf-events?event=ev1");
  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("edit");
  await router.push("/admin-smurf-events?event=ev2");
  await flushPromises();

  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", manualEvent({ id: "ev1" }), { applied: true, existing: false });
  await flushPromises();

  expect(router.currentRoute.value.query.event).toBe("ev2");
  expect(wrapper.text()).not.toContain("Event saved.");
});

test("without the SmurfCheckerQuery permission the page says so and requests nothing", async () => {
  oauth.permissions = ["Moderation"];

  await open("/admin-smurf-events?event=ev1");

  expect(wrapper.text()).toContain("You don't have the SmurfCheckerQuery permission.");
  expect(service.list).not.toHaveBeenCalled();
  expect(service.get).not.toHaveBeenCalled();
  expect(wrapper.findComponent({ name: "EventList" }).exists()).toBe(false);
});

test("with Query only, the list is shown without write controls or dialogs", async () => {
  oauth.permissions = ["SmurfCheckerQuery"];

  await open("/admin-smurf-events");

  expect(service.list).toHaveBeenCalledTimes(1);
  expect(wrapper.findComponent({ name: "EventList" }).props("canAdminister")).toBe(false);
  expect(dialogCount()).toBe(0);
});

test("with Administration, the dialogs are there", async () => {
  await open("/admin-smurf-events");

  expect(wrapper.findComponent({ name: "EventList" }).props("canAdminister")).toBe(true);
  expect(dialogCount()).toBe(3);
});

test("permissions that arrive after the page mounted start the load", async () => {
  oauth.permissions = [];
  await open("/admin-smurf-events");
  expect(service.list).not.toHaveBeenCalled();

  // As the oauth store does when its permissions land: a new array.
  (await import("@/store/oauth/store")).useOauthStore().permissions = ["SmurfCheckerQuery"];
  await flushPromises();

  expect(service.list).toHaveBeenCalledTimes(1);
});
