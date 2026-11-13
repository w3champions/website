// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";
import { createMemoryHistory, createRouter, type Router } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { inlineDialog, manualEvent, testPlugins } from "./smurf-events/setup.testing";

const service = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn(), review: vi.fn(), remove: vi.fn(), denyPreview: vi.fn(), history: vi.fn(), identifiers: vi.fn() }));
vi.mock("@/store/admin/smurfEvents/service", () => ({ smurfEventsService: () => service }));
const oauth = vi.hoisted(() => ({ token: "tok", permissions: [] as string[] }));
vi.mock("@/store/oauth/store", async () => {
  // Reactive, as the real store's state is: permissions can change under a mounted page.
  const { reactive } = await import("vue");
  const state = reactive(oauth);
  return { useOauthStore: () => state };
});

import AdminSmurfEvents from "./AdminSmurfEvents.vue";

const STUBS = { EventList: true, EventDetail: true, ManualEventDialog: true, ReviewDialog: true, RenameDialog: true, DeleteEventDialog: true };

const DIALOGS = ["ManualEventDialog", "ReviewDialog", "RenameDialog", "DeleteEventDialog"];

function dialogCount(): number {
  return DIALOGS.filter((name) => wrapper.findComponent({ name }).exists()).length;
}

let wrapper: VueWrapper;
let router: Router;

async function open(path: string, stubs: Record<string, Component | boolean> = STUBS): Promise<void> {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/admin-smurf-events", name: EAdminRouteName.SMURF_EVENTS, component: AdminSmurfEvents },
      { path: "/admin-hardware-smurfs", name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, component: { template: "<div />" } },
    ],
  });
  await router.push(path);
  await router.isReady();
  wrapper = mount(AdminSmurfEvents, { global: { plugins: [...testPlugins(), router], stubs } });
  await flushPromises();
}

beforeEach(() => {
  vi.resetAllMocks();
  oauth.permissions = ["SmurfCheckerQuery", "SmurfCheckerAdministration"];
  service.list.mockResolvedValue({ events: [] });
  service.get.mockResolvedValue(manualEvent());
  service.history.mockResolvedValue({ entries: [] });
  service.identifiers.mockResolvedValue({ window: { fromDay: 1, toDay: 2, eventFromDay: 1, eventToDay: 2 }, rows: [] });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => wrapper.unmount());

test("a create shows the new event with its notice and loads it only once", async () => {
  await open("/admin-smurf-events");
  const created = manualEvent({ id: "ev-new", name: "New LAN" });
  // As saveManual does: the saved event is already in the store when the dialog reports it.
  useSmurfEventsStore().detail = created;

  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", created, { applied: true, existing: false, needsReview: false });
  await flushPromises();

  expect(router.currentRoute.value.query.event).toBe("ev-new");
  expect(wrapper.text()).toContain("Event saved.");
  expect(service.get).not.toHaveBeenCalled();
  expect(useSmurfEventsStore().detail?.id).toBe("ev-new");
  expect(service.identifiers).toHaveBeenCalledTimes(1);
  expect(service.identifiers).toHaveBeenLastCalledWith("tok", "ev-new");
});

test("a create that answered an existing event reads its identifiers once", async () => {
  await open("/admin-smurf-events");
  const existing = manualEvent({ id: "ev-old" });
  useSmurfEventsStore().detail = existing;

  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", existing, { applied: true, existing: true, needsReview: false });
  await flushPromises();

  expect(service.identifiers).toHaveBeenCalledTimes(1);
  expect(service.identifiers).toHaveBeenLastCalledWith("tok", "ev-old");
});

test("an edit in place reads the record and the identifiers again", async () => {
  await open("/admin-smurf-events?event=ev1");
  expect(service.identifiers).toHaveBeenCalledTimes(1);
  expect(service.history).toHaveBeenCalledTimes(1);
  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("edit");
  await flushPromises();

  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", manualEvent({ id: "ev1" }), { applied: true, existing: false, needsReview: false });
  await flushPromises();

  expect(service.identifiers).toHaveBeenCalledTimes(2);
  expect(service.history).toHaveBeenCalledTimes(2);
  expect(service.get).toHaveBeenCalledTimes(1);
});

test("the record is read after every load of an event, the same event again included", async () => {
  await open("/admin-smurf-events?event=ev1");
  expect(service.history).toHaveBeenCalledTimes(1);
  expect(service.history).toHaveBeenLastCalledWith("tok", "ev1");

  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("open-event", "ev1");
  await flushPromises();
  expect(service.history).toHaveBeenCalledTimes(2);
  expect(service.get).toHaveBeenCalledTimes(2);

  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("open-event", "ev2");
  await flushPromises();
  expect(router.currentRoute.value.query.event).toBe("ev2");
  expect(service.history).toHaveBeenLastCalledWith("tok", "ev2");
});

test("a retry of a failed record reads only the record again", async () => {
  await open("/admin-smurf-events?event=ev1");

  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("retry-history");
  await flushPromises();

  expect(service.history).toHaveBeenCalledTimes(2);
  expect(service.get).toHaveBeenCalledTimes(1);
});

test("the identifiers are read after every load of an event, and a retry reads only them", async () => {
  await open("/admin-smurf-events?event=ev1");
  expect(service.identifiers).toHaveBeenCalledTimes(1);
  expect(service.identifiers).toHaveBeenLastCalledWith("tok", "ev1");

  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("open-event", "ev1");
  await flushPromises();
  expect(service.identifiers).toHaveBeenCalledTimes(2);

  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("retry-identifiers");
  await flushPromises();
  expect(service.identifiers).toHaveBeenCalledTimes(3);
  expect(service.get).toHaveBeenCalledTimes(2);
  expect(service.history).toHaveBeenCalledTimes(2);
});

test("a rename reads the record again and says so", async () => {
  await open("/admin-smurf-events?event=ev1");
  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("rename");
  await flushPromises();
  expect(wrapper.findComponent({ name: "RenameDialog" }).props("modelValue")).toBe(true);

  wrapper.findComponent({ name: "RenameDialog" }).vm.$emit("renamed");
  await flushPromises();

  expect(service.history).toHaveBeenCalledTimes(2);
  expect(wrapper.text()).toContain("Name saved.");
});

test("a delete returns to the list and shows its notice", async () => {
  await open("/admin-smurf-events?event=ev1");
  expect(service.get).toHaveBeenCalledWith("tok", "ev1");

  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("delete");
  wrapper.findComponent({ name: "DeleteEventDialog" }).vm.$emit("deleted");
  await flushPromises();

  expect(router.currentRoute.value.query.event).toBeUndefined();
  expect(wrapper.text()).toContain("Event deleted.");
});

test("a notice ends once the moderator opens another view", async () => {
  await open("/admin-smurf-events?event=ev1");
  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("delete");
  wrapper.findComponent({ name: "DeleteEventDialog" }).vm.$emit("deleted");
  await flushPromises();
  expect(wrapper.text()).toContain("Event deleted.");
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

  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", created, { applied: false, existing: false, needsReview: false });
  await flushPromises();

  expect(wrapper.text()).toContain("Event saved. Its effect on links will follow shortly.");
});

test("a create that answered an existing event says nothing was changed", async () => {
  await open("/admin-smurf-events");
  const existing = manualEvent({ id: "ev-old" });
  useSmurfEventsStore().detail = existing;

  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", existing, { applied: true, existing: true, needsReview: false });
  await flushPromises();

  expect(wrapper.text()).toContain("already exists, so nothing was changed");
  expect(wrapper.text()).not.toContain("Event saved.");
});

test("a review shows its notice, and the pending one when the links are not yet updated", async () => {
  await open("/admin-smurf-events?event=ev1");
  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("review");

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

  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", manualEvent({ id: "ev1" }), { applied: true, existing: false, needsReview: false });
  await flushPromises();

  expect(router.currentRoute.value.query.event).toBe("ev2");
  expect(wrapper.text()).not.toContain("Event saved.");
});

test("without the SmurfCheckerAdministration permission the page says so and requests nothing", async () => {
  oauth.permissions = ["Moderation"];

  await open("/admin-smurf-events?event=ev1");

  expect(wrapper.text()).toContain("You don't have the SmurfCheckerAdministration permission.");
  expect(service.list).not.toHaveBeenCalled();
  expect(service.get).not.toHaveBeenCalled();
  expect(service.history).not.toHaveBeenCalled();
  expect(service.identifiers).not.toHaveBeenCalled();
  expect(wrapper.findComponent({ name: "EventList" }).exists()).toBe(false);

  await router.push("/admin-smurf-events?event=ev2");
  await flushPromises();
  expect(service.get).not.toHaveBeenCalled();
  expect(service.identifiers).not.toHaveBeenCalled();
});

test("with Administration, the dialogs are there", async () => {
  await open("/admin-smurf-events");

  expect(wrapper.findComponent({ name: "EventList" }).exists()).toBe(true);
  expect(dialogCount()).toBe(DIALOGS.length);
});

test("permissions that arrive after the page mounted start the load", async () => {
  oauth.permissions = [];
  await open("/admin-smurf-events");
  expect(service.list).not.toHaveBeenCalled();

  // As the oauth store does when its permissions land: a new array.
  (await import("@/store/oauth/store")).useOauthStore().permissions = ["SmurfCheckerAdministration"];
  await flushPromises();

  expect(service.list).toHaveBeenCalledTimes(1);
});

// The real review and delete dialogs, driven through their buttons.
const REAL_DIALOGS = { EventList: true, EventDetail: true, ManualEventDialog: true, VDialog: inlineDialog };

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => (resolve = res));
  return { promise, resolve };
}

function button(label: string): HTMLButtonElement {
  const found = wrapper.findAll("button").find((b) => b.text().trim() === label);
  if (!found) throw new Error(`No button "${label}"`);
  return found.element;
}

async function startReview(): Promise<ReturnType<typeof deferred<ReturnType<typeof manualEvent>>>> {
  const answer = deferred<ReturnType<typeof manualEvent>>();
  service.review.mockReturnValue(answer.promise);
  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("review");
  await flushPromises();
  button("Confirm").click();
  await flushPromises();
  button("Save review").click();
  await flushPromises();
  return answer;
}

async function startDelete(): Promise<ReturnType<typeof deferred<void>>> {
  const answer = deferred<void>();
  service.remove.mockReturnValue(answer.promise);
  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("delete");
  await flushPromises();
  await wrapper.find("textarea").setValue("duplicate");
  button("Delete event").click();
  await flushPromises();
  return answer;
}

test("a review that finishes after the moderator opened another event shows no notice there", async () => {
  await open("/admin-smurf-events?event=ev1", REAL_DIALOGS);
  const review = await startReview();
  // Another event is being loaded: the store has no detail meanwhile.
  const slow = deferred<ReturnType<typeof manualEvent>>();
  service.get.mockReturnValueOnce(slow.promise);
  await router.push("/admin-smurf-events?event=ev2");
  await flushPromises();
  // The dialog keeps its own event, so no empty overlay stays.
  expect(wrapper.text()).toContain("Review LAN party");

  review.resolve(manualEvent({ review: "confirmed" }));
  await flushPromises();

  expect(wrapper.text()).not.toContain("Review saved");
  expect(wrapper.findComponent({ name: "ReviewDialog" }).props("modelValue")).toBe(false);
  expect(router.currentRoute.value.query.event).toBe("ev2");
  slow.resolve(manualEvent({ id: "ev2" }));
});

test("a delete that finishes after the moderator opened another event neither navigates nor reports there", async () => {
  await open("/admin-smurf-events?event=ev1", REAL_DIALOGS);
  const removal = await startDelete();
  await router.push("/admin-smurf-events?event=ev2");
  await flushPromises();

  removal.resolve();
  await flushPromises();

  expect(router.currentRoute.value.query.event).toBe("ev2");
  expect(wrapper.text()).not.toContain("Event deleted.");
  expect(wrapper.findComponent({ name: "DeleteEventDialog" }).props("modelValue")).toBe(false);
});

test("a review and a delete that finish after the moderator left the page change nothing", async () => {
  await open("/admin-smurf-events?event=ev1", REAL_DIALOGS);
  const review = await startReview();
  // Unmounting the app resets the router's route, so watch for navigation instead.
  const push = vi.spyOn(router, "push");
  wrapper.unmount();
  review.resolve(manualEvent({ review: "confirmed" }));
  await flushPromises();
  expect(useSmurfEventsStore().detail).toBeNull();
  expect(useSmurfEventsStore().acting).toBe(false);

  await open("/admin-smurf-events?event=ev1", REAL_DIALOGS);
  const removal = await startDelete();
  const pushAgain = vi.spyOn(router, "push");
  wrapper.unmount();
  removal.resolve();
  await flushPromises();
  expect(useSmurfEventsStore().acting).toBe(false);
  expect(push).not.toHaveBeenCalled();
  expect(pushAgain).not.toHaveBeenCalled();
});

test("a review or delete that finishes on the event it was started on reports as before", async () => {
  await open("/admin-smurf-events?event=ev1", REAL_DIALOGS);
  const review = await startReview();
  review.resolve(manualEvent({ review: "confirmed" }));
  await flushPromises();
  expect(wrapper.text()).toContain("Review saved.");

  const removal = await startDelete();
  removal.resolve();
  await flushPromises();
  expect(router.currentRoute.value.query.event).toBeUndefined();
  expect(wrapper.text()).toContain("Event deleted.");
});

test("a save that took a confirmed event back to unreviewed says it needs review again", async () => {
  await open("/admin-smurf-events?event=ev1");
  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("edit");
  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", manualEvent(), { applied: true, existing: false, needsReview: true });
  await flushPromises();

  expect(wrapper.text()).toContain("Event saved.");
  expect(wrapper.text()).toContain("needs review again");
});

test("a plain save carries no review line", async () => {
  await open("/admin-smurf-events?event=ev1");
  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("edit");
  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", manualEvent(), { applied: true, existing: false, needsReview: false });
  await flushPromises();

  expect(wrapper.text()).not.toContain("needs review again");
});

const WRITE_NOTICE = "Smurf events do not change links at the moment, so this change did not change any link.";

async function saveWith(applied: boolean, applies: boolean | undefined): Promise<void> {
  await open("/admin-smurf-events");
  const created = manualEvent({ id: "ev-new" });
  useSmurfEventsStore().detail = created;
  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", created, { applied, applies, existing: false, needsReview: false });
  await flushPromises();
}

test("a save that changed no link says so", async () => {
  await saveWith(true, false);

  expect(wrapper.text()).toContain("Event saved.");
  expect(wrapper.text()).toContain(WRITE_NOTICE);
});

test("a save that changed no link and was not applied shows only the not-applying notice", async () => {
  await saveWith(false, false);

  expect(wrapper.text()).toContain("Event saved.");
  expect(wrapper.text()).toContain(WRITE_NOTICE);
  expect(wrapper.text()).not.toContain("follow shortly");
});

test("a save not applied while events apply shows the follow-shortly notice only", async () => {
  await saveWith(false, true);

  expect(wrapper.text()).toContain("follow shortly");
  expect(wrapper.text()).not.toContain(WRITE_NOTICE);
});

test("a save from an older server, without the applies flag, shows no not-applying notice", async () => {
  await saveWith(true, undefined);

  expect(wrapper.text()).not.toContain(WRITE_NOTICE);
});

test("a review that changed no link says so, and that notice wins over the not-applied one", async () => {
  await open("/admin-smurf-events?event=ev1");
  wrapper.findComponent({ name: "EventDetail" }).vm.$emit("review");

  wrapper.findComponent({ name: "ReviewDialog" }).vm.$emit("reviewed", false, false);
  await flushPromises();
  expect(wrapper.text()).toContain("Review saved.");
  expect(wrapper.text()).toContain(WRITE_NOTICE);
  expect(wrapper.text()).not.toContain("follow shortly");

  wrapper.findComponent({ name: "ReviewDialog" }).vm.$emit("reviewed", true, true);
  await flushPromises();
  expect(wrapper.text()).not.toContain(WRITE_NOTICE);
});

test("a create that answered an existing event keeps its text and adds the notice when links do not change", async () => {
  await open("/admin-smurf-events");
  const existing = manualEvent({ id: "ev-old" });
  useSmurfEventsStore().detail = existing;

  wrapper.findComponent({ name: "ManualEventDialog" }).vm.$emit("saved", existing, { applied: true, applies: false, existing: true, needsReview: false });
  await flushPromises();

  expect(wrapper.text()).toContain("already exists, so nothing was changed");
  expect(wrapper.text()).toContain(WRITE_NOTICE);
});

test("a moderator with SmurfCheckerQuery only sees the no_permission alert and no service call is made", async () => {
  oauth.permissions = ["SmurfCheckerQuery"];
  await open("/admin-smurf-events?event=ev1");

  expect(wrapper.text()).toContain("SmurfCheckerAdministration");
  expect(wrapper.findComponent({ name: "EventList" }).exists()).toBe(false);
  expect(service.list).not.toHaveBeenCalled();
  expect(service.get).not.toHaveBeenCalled();
  expect(service.history).not.toHaveBeenCalled();
  expect(service.identifiers).not.toHaveBeenCalled();

  // Back and forward between event URLs asks for nothing either.
  await router.push("/admin-smurf-events?event=ev2");
  await flushPromises();
  expect(service.get).not.toHaveBeenCalled();
  expect(service.history).not.toHaveBeenCalled();
  expect(service.identifiers).not.toHaveBeenCalled();
});

test("a holder of SmurfCheckerAdministration alone loads the page", async () => {
  oauth.permissions = ["SmurfCheckerAdministration"];
  await open("/admin-smurf-events");

  expect(wrapper.findComponent({ name: "EventList" }).exists()).toBe(true);
  expect(service.list).toHaveBeenCalled();
});
