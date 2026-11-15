// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import type { SmurfEventIdentifierRow, SmurfEventIdentifiers, SmurfEventNetworkPresence, SmurfEventPresence } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { testPlugins } from "./setup.testing";
import VenueNetworksCard from "./VenueNetworksCard.vue";

let wrapper: VueWrapper;
afterEach(() => wrapper.unmount());

const DAY = Date.UTC(2026, 8, 30) / 86_400_000;
const WINDOW = { fromDay: DAY, toDay: DAY + 18, eventFromDay: DAY + 5, eventToDay: DAY + 7 };

function presence(networks: SmurfEventNetworkPresence[]): SmurfEventPresence {
  return { at: "2026-10-05T00:00:00.000Z", window: WINDOW, networks, attendees: [] };
}

const FULL: SmurfEventNetworkPresence = {
  hash8: "0a1b2c3d",
  firstUseAt: "2026-09-01T08:00:00.000Z",
  lastUseAt: "2026-10-04T20:00:00.000Z",
  before: { attendees: 1, others: 4, days: 2 },
  during: { attendees: 3, others: 0, days: 2 },
  after: { attendees: 0, others: 2, days: 1, capped: true },
  days: [[DAY + 5, 3], [DAY + 6, 3]],
  provider: "Example Telecom",
  country: "DE",
};

function show(p: SmurfEventPresence | null, identifiers: SmurfEventIdentifiers | null = null, state: { loading?: boolean; error?: string | null } = {}): void {
  wrapper = mount(VenueNetworksCard, { props: { presence: p, identifiers, loading: state.loading ?? false, error: state.error ?? null }, global: { plugins: testPlugins() } });
}

test("the venue card shows first and last use, the three sides and the day lane of an IP network", () => {
  show(presence([FULL]));

  const text = wrapper.text();
  expect(wrapper.find("h3, h2, .v-card-title").text()).toContain("Venue networks");
  expect(text).toContain("First use 2026-09-01 08:00 UTC · last use 2026-10-04 20:00 UTC");
  expect(text).toContain("Before: 1 attendees, 4 other accounts, on 2 days");
  expect(text).toContain("During: 3 attendees, 0 other accounts, on 2 days");
  expect(text).toContain("After: at least 0 attendees, at least 2 other accounts, on at least 1 days");
  expect(text).toContain("Example Telecom · DE");
  expect(wrapper.find("svg.day-lane").exists()).toBe(true);
});

test("a network without first use shows Not recorded and one not read shows Not read", () => {
  show(presence([{ hash8: "0a1b2c3d" }, { hash8: "0a1b2c3e", notRead: true }]));

  const items = wrapper.findAll(".venue-network");
  expect(items).toHaveLength(2);
  expect(items[0].findAll(".not-recorded").length).toBeGreaterThan(0);
  expect(items[0].text()).not.toContain("Not read");
  expect(items[1].text()).toContain("Not read");
  expect(items[1].text()).not.toContain("First use");
  expect(items[1].text()).not.toMatch(/\b0 attendees/);
});

test("a router venue network reads from its identifier row", () => {
  const row: SmurfEventIdentifierRow = {
    hash8: "cccc0003",
    kind: "router",
    roles: ["network"],
    keys: 1,
    accountsDuring: 3,
    accountsEver: { count: 5 },
    days: [[DAY + 5, 3]],
    holdersOutside: { attendees: 1, others: 6, capped: true },
    alsoIn: [],
  };
  show(presence([]), { window: WINDOW, rows: [row] });

  const item = wrapper.find(".venue-network");
  expect(item.text()).toContain("cccc0003");
  expect(item.text()).toContain("Outside the event: at least 1 attendees, at least 6 other accounts");
  expect(item.find("svg.day-lane").exists()).toBe(true);
});

test("a router venue network without holders outside shows Not recorded", () => {
  show(presence([]), { window: WINDOW, rows: [{ hash8: "cccc0003", kind: "router", roles: ["network"], keys: 1, alsoIn: [] }] });

  expect(wrapper.find(".venue-network .not-recorded").exists()).toBe(true);
});

test("loading and a failure with a retry button replace the networks", async () => {
  show(null, null, { loading: true });
  expect(wrapper.text()).toContain("Loading where the venue networks were used");
  wrapper.unmount();

  show(null, null, { error: "Boom" });
  expect(wrapper.text()).toContain("Where the venue networks were used couldn't be loaded: Boom");
  const retry = wrapper.find("button.retry");
  expect(retry.exists()).toBe(true);
  await retry.trigger("click");
  expect(wrapper.emitted("retry")).toHaveLength(1);
});

test("no count, provider or country carries a colour class", () => {
  show(presence([FULL, { hash8: "0a1b2c3e", notRead: true }]));

  expect(wrapper.html()).not.toMatch(/text-(warning|error|success)|bg-[a-z]/);
});
