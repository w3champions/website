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

function show(p: SmurfEventPresence | null, identifiers: SmurfEventIdentifiers | null = null, state: { loading?: boolean; error?: string | null; networkCount?: number } = {}): void {
  wrapper = mount(VenueNetworksCard, {
    props: { presence: p, identifiers, networkCount: state.networkCount ?? p?.networks.length ?? 0, loading: state.loading ?? false, error: state.error ?? null },
    global: { plugins: testPlugins() },
  });
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

test("a network nobody measured shows its chip and exactly one Not recorded", () => {
  show(presence([{ hash8: "0a1b2c3d" }]));

  const item = wrapper.find(".venue-network");
  expect(item.text()).toContain("0a1b2c3d");
  expect(item.findAll(".not-recorded")).toHaveLength(1);
});

test("a network not read shows Not read and no figures", () => {
  show(presence([{ hash8: "0a1b2c3e", notRead: true }]));

  const text = wrapper.find(".venue-network").text();
  expect(text).toContain("Not read");
  expect(text).not.toContain("First use");
  expect(text).not.toMatch(/\b0 attendees/);
  expect(wrapper.find(".not-recorded").exists()).toBe(false);
});

test("a network with only a provider is measured: it shows the provider, not a blanket Not recorded", () => {
  show(presence([{ hash8: "0a1b2c3d", provider: "Example Telecom" }]));

  const item = wrapper.find(".venue-network");
  expect(item.text()).toContain("Example Telecom");
  expect(item.find(".venue-context .not-recorded").exists()).toBe(true);
  expect(item.find(".venue-first-last").text()).toBe("First use Not read · last use Not read");
});

test("a measured network without first and last use says Not read in that line, not Not recorded", () => {
  const { firstUseAt: _f, lastUseAt: _l, ...noUse } = FULL;
  show(presence([noUse]));

  const line = wrapper.find(".venue-network .venue-first-last");
  expect(line.text()).toBe("First use Not read · last use Not read");
  expect(line.find(".not-recorded").exists()).toBe(false);
});

test("a side that was not read says so under its own label, and the lane reads as a lower bound", () => {
  const { after: _after, ...partial } = FULL;
  show(presence([partial]));

  const text = wrapper.find(".venue-network").text();
  expect(text).toContain("Before: 1 attendees");
  expect(text).toContain("After: Not read");
  expect(text).not.toContain("During: Not read");
  expect(wrapper.findComponent({ name: "DayLane" }).props("lowerBound")).toBe(true);
});

test("the lane is a lower bound when a side is capped, and exact when every side was read in full", () => {
  show(presence([FULL]));
  expect(wrapper.findComponent({ name: "DayLane" }).props("lowerBound")).toBe(true);
  wrapper.unmount();

  show(presence([{ ...FULL, after: { attendees: 0, others: 2, days: 1 } }]));
  expect(wrapper.findComponent({ name: "DayLane" }).props("lowerBound")).toBe(false);
});

test("a measured network without provider and country shows Not recorded in that spot", () => {
  const { provider: _p, country: _c, ...bare } = FULL;
  show(presence([bare]));

  expect(wrapper.find(".venue-context .not-recorded").exists()).toBe(true);
});

test("with a provider and no country the country shows Not recorded", () => {
  const { country: _c, ...noCountry } = FULL;
  show(presence([noCountry]));

  const context = wrapper.find(".venue-context");
  expect(context.text()).toContain("Example Telecom");
  expect(context.find(".not-recorded").exists()).toBe(true);
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
  expect(item.text()).toContain("Outside the event: 1 attendees, at least 6 other accounts");
  expect(item.find("svg.day-lane").exists()).toBe(true);
});

test("a router row shows its first and last use from its days, partial on a capped row, Not recorded without them", () => {
  const base: SmurfEventIdentifierRow = { hash8: "cccc0003", kind: "router", roles: ["network"], keys: 1, alsoIn: [] };
  const first = Date.UTC(2026, 8, 1) / 86_400_000;
  const last = Date.UTC(2026, 9, 4) / 86_400_000;

  show(presence([]), { window: WINDOW, rows: [{ ...base, firstDay: first, lastDay: last, accountsEver: { count: 4 } }] });
  expect(wrapper.find(".venue-network").text()).toContain("First use 2026-09-01 · last use 2026-10-04");
  expect(wrapper.find(".venue-network").text()).not.toContain("among the holders read");
  wrapper.unmount();

  show(presence([]), { window: WINDOW, rows: [{ ...base, firstDay: first, lastDay: last, accountsEver: { count: 4, capped: true } }] });
  expect(wrapper.find(".venue-network").text()).toContain("First use 2026-09-01 · last use 2026-10-04 (among the holders read)");
  wrapper.unmount();

  show(presence([]), { window: WINDOW, rows: [base] });
  expect(wrapper.find(".venue-first-last .not-recorded").exists()).toBe(true);
});

test("a router venue network without holders outside shows Not recorded", () => {
  show(presence([]), { window: WINDOW, rows: [{ hash8: "cccc0003", kind: "router", roles: ["network"], keys: 1, alsoIn: [] }] });

  expect(wrapper.find(".venue-network .not-recorded").exists()).toBe(true);
});

test("the card without rows shows its title and one Not recorded", () => {
  show(presence([]), { window: WINDOW, rows: [] });

  expect(wrapper.find(".v-card-title").text()).toBe("Venue networks");
  expect(wrapper.findAll(".not-recorded")).toHaveLength(1);
});

test("with no rows and router networks pending only the pending line shows", () => {
  show(presence([]), null, { networkCount: 1 });

  expect(wrapper.text()).toContain("Router networks appear once the identifier table has loaded.");
  expect(wrapper.find(".not-recorded").exists()).toBe(false);
});

test("a capped holdersOutside also gives the partial first and last wording", () => {
  const day = Date.UTC(2026, 8, 1) / 86_400_000;
  show(presence([]), { window: WINDOW, rows: [{ hash8: "cccc0003", kind: "router", roles: ["network"], keys: 1, alsoIn: [], firstDay: day, lastDay: day + 1, holdersOutside: { attendees: 1, others: 2, capped: true } }] });

  expect(wrapper.find(".venue-network").text()).toContain("(among the holders read)");
});

test("router networks of the event that are not in yet are announced under the IP rows", () => {
  show(presence([FULL]), null, { networkCount: 2 });
  expect(wrapper.text()).toContain("Router networks appear once the identifier table has loaded.");
  wrapper.unmount();

  show(presence([FULL]), { window: WINDOW, rows: [] }, { networkCount: 2 });
  expect(wrapper.text()).not.toContain("Router networks appear");
  wrapper.unmount();

  show(presence([FULL]), null, { networkCount: 1 });
  expect(wrapper.text()).not.toContain("Router networks appear");
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
