// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import type { SmurfEventFacts, SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { testPlugins } from "./setup.testing";

vi.mock("@/store/admin/smurfEvents/service", () => ({ smurfEventsService: () => ({}) }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import EventList from "./EventList.vue";

let wrapper: VueWrapper;

afterEach(() => wrapper.unmount());

const FACTS: SmurfEventFacts = { at: "2026-10-05T00:00:00.000Z", networks: 2, identifiers: 5, attendees: 9, notCounted: 0, endedLinks: 4 };

function row(id: string, facts?: Partial<SmurfEventFacts>, review: SmurfEventSummary["review"] = "unreviewed"): SmurfEventSummary {
  const summary: SmurfEventSummary = {
    id,
    name: `Event ${id}`,
    named: false,
    origin: "detected",
    review,
    from: "2026-10-01T00:00:00.000Z",
    to: "2026-10-03T00:00:00.000Z",
    counts: { networks: 1, machines: 1, attendees: 1 },
    endedLinks: 0,
    createdAt: "2026-10-04T00:00:00.000Z",
  };
  return facts === undefined ? summary : { ...summary, facts: { ...FACTS, ...facts } };
}

async function show(events: SmurfEventSummary[], next: string | null = null): Promise<void> {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/", component: { template: "<div />" } }] });
  await router.push("/");
  const plugins = testPlugins();
  const store = useSmurfEventsStore();
  store.events = events;
  store.next = next;
  wrapper = mount(EventList, {
    props: { filters: { origin: null, review: null } },
    global: { plugins: [...plugins, router] },
  });
  await flushPromises();
}

const bodyRows = () => wrapper.findAll("tbody tr");
const cells = (index: number) => bodyRows()[index].findAll("td").map((c) => c.text());
const names = () => bodyRows().map((r) => r.find("td").text());

async function clickHeader(title: string): Promise<void> {
  const header = wrapper.findAll("th").find((h) => h.text() === title);
  expect(header, `header ${title}`).toBeDefined();
  await header!.trigger("click");
  await flushPromises();
}

test("columns come in the reading order of the queue", async () => {
  await show([row("a", {})]);

  expect(wrapper.findAll("th").map((h) => h.text())).toEqual([
    "Event",
    "Dates (UTC)",
    "Review",
    "Networks",
    "Identifiers",
    "Most accounts ever on one identifier",
    "Attendees",
    "Links ended",
    "Links among attendees still live",
  ]);
});

test("a row shows its facts; a row without facts shows a dash in every fact column", async () => {
  await show([row("a", { maxAccountsEver: 12, liveLinks: 3 }), row("b")]);

  expect(cells(0).slice(3)).toEqual(["2", "5", "12", "9", "4", "3"]);
  expect(cells(1).slice(3)).toEqual(["—", "—", "—", "—", "—", "—"]);
});

test("a capped value reads at least N with N from the row", async () => {
  await show([row("a", { maxAccountsEver: 31, maxAccountsEverCapped: true, liveLinks: 17, liveLinksCapped: true })]);

  expect(cells(0)[5]).toBe("at least 31");
  expect(cells(0)[8]).toBe("at least 17");
});

test("sorting by identifiers keeps rows without facts last in both directions", async () => {
  await show([row("none"), row("mid", { identifiers: 5 }), row("high", { identifiers: 40 }), row("low", { identifiers: 1 })]);

  await clickHeader("Identifiers");
  const first = names();
  await clickHeader("Identifiers");
  const second = names();

  expect([first, second].map((n) => n[n.length - 1])).toEqual(["Event none", "Event none"]);
  expect(first.slice(0, 3)).toEqual(["Event high", "Event mid", "Event low"]);
  expect(second.slice(0, 3)).toEqual(["Event low", "Event mid", "Event high"]);
});

test("the list is in the server's order until a header is clicked", async () => {
  await show([row("b", { identifiers: 9 }), row("a", { identifiers: 1 })]);

  expect(names()).toEqual(["Event b", "Event a"]);
});

test("the sort note shows only while more pages exist", async () => {
  await show([row("a", {})], "cursor");
  expect(wrapper.text()).toContain("Sorted within the events loaded so far.");
  wrapper.unmount();

  await show([row("a", {})], null);
  expect(wrapper.text()).not.toContain("Sorted within the events loaded so far.");
});

test("the review badge uses no success or error colour", async () => {
  await show([row("a", {}, "unreviewed"), row("b", {}, "confirmed"), row("c", {}, "denied")]);

  const classes = bodyRows().map((r) => r.findAll(".v-chip")[0].classes().join(" "));
  expect(classes).toHaveLength(3);
  for (const c of classes) expect(c).not.toMatch(/success|error/);
});
