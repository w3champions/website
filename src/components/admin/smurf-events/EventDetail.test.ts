// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import type { SmurfEventDetail, SmurfEventFacts } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { manualEvent, testPlugins } from "./setup.testing";

vi.mock("@/store/admin/smurfEvents/service", () => ({ smurfEventsService: () => ({}) }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import EventDetail from "./EventDetail.vue";

let wrapper: VueWrapper;

const FACTS: SmurfEventFacts = { at: "2026-10-05T00:00:00.000Z", networks: 1, identifiers: 4, attendees: 3, notCounted: 0, endedLinks: 1 };

afterEach(() => wrapper.unmount());

async function show(event: SmurfEventDetail): Promise<void> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/hardware", name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, component: { template: "<div />" } }],
  });
  await router.push("/hardware");
  const plugins = testPlugins();
  useSmurfEventsStore().detail = event;
  wrapper = mount(EventDetail, { props: { eventId: event.id }, global: { plugins: [...plugins, router] } });
  await flushPromises();
}

test("a cut list of ended links says so", async () => {
  await show(manualEvent({ endedLinksListTruncated: true }));

  expect(wrapper.text()).toContain("Showing part of the ended links.");
});

test("a cut list of ended links still counts every ended link", async () => {
  const event = manualEvent({ endedLinksListTruncated: true });

  await show({ ...event, endedLinks: event.endedLinksList.length + 7 });

  const title = wrapper.findAll(".v-card-title").find((c) => c.text().startsWith("Ended links"));
  expect(title?.find(".v-chip").text()).toBe(String(event.endedLinksList.length + 7));
});

test("a complete list of ended links carries no such note", async () => {
  await show(manualEvent());

  expect(wrapper.text()).not.toContain("Showing part of the ended links.");
});

test("an edited event that came back unreviewed shows no reviewer or confirmed state", async () => {
  await show(manualEvent({ review: "unreviewed" }));

  expect(wrapper.text()).toContain("Unreviewed");
  expect(wrapper.text()).not.toContain("Reviewed by");
  expect(wrapper.text()).not.toContain("Confirmed");
});

test("the consequence line names the live links among the attendees", async () => {
  await show(manualEvent({ liveLinks: { links: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }] } }));

  const line = wrapper.find(".consequence").text();
  expect(line).toContain("1 link among the attendees is still live");
  expect(line).toContain("Anchor#1001");
  expect(line).toContain("Guest#1003");
});

test("a cut list of live links reads at least N from the list", async () => {
  const links = [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" as const }, { a: "Anchor#1002", b: "Guest#1003", source: "account" as const }];
  await show(manualEvent({ liveLinks: { links, truncated: true } }));

  expect(wrapper.find(".consequence").text()).toContain("At least 2 links among the attendees are still live");
});

test("a complete live list wins over the stored count: after a review that ended the links the line follows the live data", async () => {
  await show(manualEvent({ liveLinks: { links: [] }, facts: { ...FACTS, liveLinks: 4 } }));

  expect(wrapper.find(".consequence").text()).toBe("No link among the attendees is live.");
});

test("a cut live list reads at least the larger of the stored count and the links shown", async () => {
  const links = [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" as const }, { a: "Anchor#1002", b: "Guest#1003", source: "account" as const }];
  await show(manualEvent({ liveLinks: { links, truncated: true }, facts: { ...FACTS, liveLinks: 11 } }));
  expect(wrapper.find(".consequence").text()).toContain("At least 11 links among the attendees are still live");
  wrapper.unmount();

  await show(manualEvent({ liveLinks: { links, truncated: true }, facts: { ...FACTS, liveLinks: 1 } }));
  expect(wrapper.find(".consequence").text()).toContain("At least 2 links among the attendees are still live");
});

test("without a live list the stored count stands alone, as a count", async () => {
  await show(manualEvent({ facts: { ...FACTS, liveLinks: 11, liveLinksCapped: true } }));

  expect(wrapper.find(".consequence").text()).toBe("Links among the attendees that are still live: at least 11.");
});

test("facts that timed out with no live list say so even when the facts hold no count", async () => {
  await show(manualEvent({ liveLinksTimedOut: true }));

  expect(wrapper.find(".consequence").text()).toBe("The live links among the attendees could not be counted this time.");
});

test("live links that ran out of time say they could not be counted this time", async () => {
  await show(manualEvent({ liveLinksTimedOut: true, facts: { ...FACTS, liveLinksTimedOut: true } }));

  expect(wrapper.find(".consequence").text()).toBe("The live links among the attendees could not be counted this time.");
});

test("the ended-links chip follows the live count, not the stored fact", async () => {
  await show(manualEvent({ endedLinks: 3, facts: { ...FACTS, endedLinks: 8 } }));

  const title = wrapper.findAll(".v-card-title").find((c) => c.text().startsWith("Ended links"));
  expect(title?.find(".v-chip").text()).toBe("3");
});

test("no live links says so, and an event that did not count them has no consequence line", async () => {
  await show(manualEvent({ liveLinks: { links: [] } }));
  expect(wrapper.find(".consequence").text()).toContain("No link among the attendees is live.");
  wrapper.unmount();

  await show(manualEvent());
  expect(wrapper.find(".consequence").exists()).toBe(false);
});

test("the header carries no state colour and the stat tiles and evidence card are gone", async () => {
  await show(manualEvent({ review: "confirmed" }));

  expect(wrapper.find(".event-header").classes().join(" ")).not.toMatch(/success|confirmed/);
  expect(wrapper.find(".stat-tile").exists()).toBe(false);
  expect(wrapper.text()).not.toContain("Review evidence");
});

/** A list row; `day` is the day of October the event started, as the server's queue orders them (newest first). */
function listed(id: string, review: "unreviewed" | "confirmed", day: number) {
  return { ...manualEvent({ id, review, from: `2026-10-${String(day).padStart(2, "0")}T06:00:00.000Z` }) };
}

function navButton(label: string) {
  const found = wrapper.findAll("button").find((b) => b.text().trim() === label);
  if (!found) throw new Error(`No button "${label}"`);
  return found;
}

async function showAmong(open: ReturnType<typeof listed>, list: Array<ReturnType<typeof listed>>): Promise<void> {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/hardware", name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, component: { template: "<div />" } }] });
  await router.push("/hardware");
  const plugins = testPlugins();
  const store = useSmurfEventsStore();
  store.events = list;
  store.detail = open;
  wrapper = mount(EventDetail, { props: { eventId: open.id }, global: { plugins: [...plugins, router] } });
  await flushPromises();
}

test("previous and next unreviewed follow the queue order of the unreviewed events", async () => {
  const [a, b, c, d, e] = [listed("a", "unreviewed", 1), listed("b", "confirmed", 2), listed("c", "confirmed", 3), listed("d", "confirmed", 4), listed("e", "unreviewed", 5)];
  // As the server lists them: the unreviewed events first, then the reviewed ones, each group newest first. The open event (c) is reviewed.
  await showAmong(c, [e, a, d, c, b]);

  await navButton("Previous unreviewed").trigger("click");
  await navButton("Next unreviewed").trigger("click");

  expect(wrapper.emitted("open-event")).toEqual([["e"], ["a"]]);
});

test("right after a review the next unreviewed event is still offered", async () => {
  // The reloaded list as the server sends it: the unreviewed events first, the event just reviewed (b) after all of them.
  const [a, b, c] = [listed("a", "unreviewed", 1), listed("b", "confirmed", 2), listed("c", "unreviewed", 3)];
  await showAmong(b, [c, a, b]);

  await navButton("Next unreviewed").trigger("click");
  await navButton("Previous unreviewed").trigger("click");

  expect(wrapper.emitted("open-event")).toEqual([["a"], ["c"]]);
});

test("under the unreviewed filter the open event is not in the list and both neighbours are still offered", async () => {
  const [a, c] = [listed("a", "unreviewed", 1), listed("c", "unreviewed", 3)];
  await showAmong(listed("b", "confirmed", 2), [c, a]);

  await navButton("Next unreviewed").trigger("click");
  await navButton("Previous unreviewed").trigger("click");

  expect(wrapper.emitted("open-event")).toEqual([["a"], ["c"]]);
});

test("previous and next unreviewed are disabled when no unreviewed event lies on that side", async () => {
  const [a, b] = [listed("a", "unreviewed", 1), listed("b", "confirmed", 2)];
  await showAmong(a, [b, a]);

  expect(navButton("Previous unreviewed").element.disabled).toBe(true);
  expect(navButton("Next unreviewed").element.disabled).toBe(true);
});

test("the pencil next to the name asks to rename", async () => {
  await show(manualEvent({ origin: "detected" }));

  await wrapper.find("button[aria-label='Rename event']").trigger("click");

  expect(wrapper.emitted("rename")).toHaveLength(1);
});

test("the origin badge explains the origin and the review badge shows the state", async () => {
  await show(manualEvent({ origin: "detected", review: "unreviewed" }));

  expect(wrapper.find(".event-header").text()).toContain("Detected");
  expect(wrapper.find(".event-header").text()).toContain("Unreviewed");
});

test("the facts and the decision record sit on the page", async () => {
  await show(manualEvent());

  expect(wrapper.findComponent({ name: "EventFacts" }).exists()).toBe(true);
  expect(wrapper.findComponent({ name: "EventHistory" }).exists()).toBe(true);
});

test("a failed event load can be retried through open-event", async () => {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/hardware", name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, component: { template: "<div />" } }] });
  await router.push("/hardware");
  const plugins = testPlugins();
  useSmurfEventsStore().detailError = new Error("down");
  wrapper = mount(EventDetail, { props: { eventId: "ev1" }, global: { plugins: [...plugins, router] } });

  await wrapper.findAll("button").find((b) => b.text().trim() === "Try again")?.trigger("click");

  expect(wrapper.emitted("open-event")).toEqual([["ev1"]]);
});

test("an event with an empty list around it has no neighbours", async () => {
  await showAmong(listed("z", "unreviewed", 9), []);

  expect(navButton("Previous unreviewed").element.disabled).toBe(true);
  expect(navButton("Next unreviewed").element.disabled).toBe(true);
});

test("an unreviewed event skips itself when it looks for its neighbours", async () => {
  const [a, b, c] = [listed("a", "unreviewed", 1), listed("b", "unreviewed", 2), listed("c", "unreviewed", 3)];
  await showAmong(b, [c, b, a]);

  await navButton("Previous unreviewed").trigger("click");
  await navButton("Next unreviewed").trigger("click");

  expect(wrapper.emitted("open-event")).toEqual([["c"], ["a"]]);
});

test("a failed record can be loaded again through retry-history", async () => {
  await show(manualEvent());
  useSmurfEventsStore().historyError = new Error("down");
  await flushPromises();

  await wrapper.findComponent({ name: "EventHistory" }).vm.$emit("retry");

  expect(wrapper.emitted("retry-history")).toHaveLength(1);
});

test("a failed identifiers load can be retried and shows the table in the page", async () => {
  await show(manualEvent());
  useSmurfEventsStore().identifiersError = new Error("down");
  await flushPromises();

  await wrapper.findComponent({ name: "IdentifierTable" }).vm.$emit("retry");

  expect(wrapper.emitted("retry-identifiers")).toHaveLength(1);
});
