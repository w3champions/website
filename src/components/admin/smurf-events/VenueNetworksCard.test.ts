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
  expect(text).toContain("Before: 1 attendee, 4 other accounts, on 2 days");
  expect(text).toContain("During: 3 attendees, 0 other accounts, on 2 days");
  expect(text).toContain("After: no attendee among those read, at least 2 other accounts, on at least 1 day");
  expect(text).toContain("Example Telecom · DE");
  expect(wrapper.find("svg.day-lane").exists()).toBe(true);
});

test("a network nobody measured shows its chip and a labelled Not recorded", () => {
  show(presence([{ hash8: "0a1b2c3d" }]));

  const item = wrapper.find(".venue-network");
  expect(item.text()).toContain("0a1b2c3d");
  expect(item.text()).toContain("Use around the event: Not recorded");
  expect(item.findAll(".not-recorded")).toHaveLength(1);
});

test("the venue networks are a list", () => {
  show(presence([FULL, { hash8: "0a1b2c3e", notRead: true }]));

  expect(wrapper.findAll("ul > li.venue-network")).toHaveLength(2);
});

test("with no presence, not loading and no error nothing shows under the title", () => {
  show(null);

  expect(wrapper.find(".v-card-title").text()).toBe("Venue networks");
  expect(wrapper.find(".v-card").text()).toBe("Venue networks");
});

test("a partial answer is announced once, right under the title, and a complete one says nothing", () => {
  show({ ...presence([FULL, { hash8: "0a1b2c3e", notRead: true }]), truncated: true });

  const notice = wrapper.findAll("[role='status']");
  expect(notice).toHaveLength(1);
  expect(notice[0].text()).toBe("Part of this was not read: rows marked Not read and numbers marked at least are incomplete.");
  expect(notice[0].classes()).toContain("text-medium-emphasis");
  expect(wrapper.find(".v-card-title").element.nextElementSibling).toBe(notice[0].element);
  wrapper.unmount();

  show(presence([FULL]));
  expect(wrapper.text()).not.toContain("Part of this was not read");
});

test("a partial answer is not announced while loading or after a failure", () => {
  show(null, null, { loading: true });
  expect(wrapper.text()).not.toContain("Part of this was not read");
  wrapper.unmount();

  show(null, null, { error: "Boom" });
  expect(wrapper.text()).not.toContain("Part of this was not read");
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
  expect(item.find(".venue-context").text()).toBe("Example Telecom · Not recorded");
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
  expect(text).toContain("Before: 1 attendee");
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

  expect(wrapper.find(".venue-context").text()).toBe("Provider · country: Not recorded");
});

test("with a provider and no country the country shows Not recorded", () => {
  const { country: _c, ...noCountry } = FULL;
  show(presence([noCountry]));

  const context = wrapper.find(".venue-context");
  expect(context.text()).toBe("Example Telecom · Not recorded");
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
  expect(item.text()).toContain("On days outside the event: 1 attendee, at least 6 other accounts");
  expect(item.find("svg.day-lane").exists()).toBe(true);
});

test("a router row shows its first and last use from its days, partial on a capped row, Not recorded without them", () => {
  const base: SmurfEventIdentifierRow = { hash8: "cccc0003", kind: "router", roles: ["network"], keys: 1, alsoIn: [] };
  const first = Date.UTC(2026, 8, 1) / 86_400_000;
  const last = Date.UTC(2026, 9, 4) / 86_400_000;

  show(presence([]), { window: WINDOW, rows: [{ ...base, firstDay: first, lastDay: last, accountsEver: { count: 4 } }] });
  expect(wrapper.find(".venue-network").text()).toContain("First use 2026-09-01 · last use 2026-10-04");
  expect(wrapper.find(".venue-network").text()).not.toContain("among the accounts read");
  wrapper.unmount();

  show(presence([]), { window: WINDOW, rows: [{ ...base, firstDay: first, lastDay: last, accountsEver: { count: 4, capped: true } }] });
  expect(wrapper.find(".venue-network").text()).toContain("First use 2026-09-01 · last use 2026-10-04 (among the accounts read)");
  wrapper.unmount();

  show(presence([]), { window: WINDOW, rows: [base] });
  expect(wrapper.find(".venue-first-last").text()).toBe("First use Not recorded · last use Not recorded");
});

test("a router row with only one end of its use read says Not recorded for the other, in the partial wording on a capped row", () => {
  const day = Date.UTC(2026, 8, 1) / 86_400_000;
  show(presence([]), { window: WINDOW, rows: [{ hash8: "cccc0003", kind: "router", roles: ["network"], keys: 1, alsoIn: [], firstDay: day, accountsEver: { count: 4, capped: true } }] });

  expect(wrapper.find(".venue-first-last").text()).toBe("First use 2026-09-01 · last use Not recorded (among the accounts read)");
});

test("a router venue network without holders outside says so under its label", () => {
  show(presence([]), { window: WINDOW, rows: [{ hash8: "cccc0003", kind: "router", roles: ["network"], keys: 1, alsoIn: [] }] });

  expect(wrapper.find(".venue-network").text()).toContain("On days outside the event: Not recorded");
});

test("the card without rows shows its title and one Not recorded when the identifier table is complete", () => {
  show(presence([]), { window: WINDOW, rows: [] });

  expect(wrapper.find(".v-card-title").text()).toBe("Venue networks");
  expect(wrapper.findAll(".not-recorded")).toHaveLength(1);
});

test("a partial identifier table that leaves router networks out says so under the rows", () => {
  show(presence([FULL]), { window: WINDOW, rows: [], truncated: true }, { networkCount: 2 });
  expect(wrapper.text()).toContain("The identifier table is partial: some router networks may not be listed here.");
  wrapper.unmount();

  show(presence([FULL]), { window: WINDOW, rows: [] }, { networkCount: 2 });
  expect(wrapper.text()).not.toContain("The identifier table is partial");
  wrapper.unmount();

  show(presence([FULL]), { window: WINDOW, rows: [], truncated: true }, { networkCount: 1 });
  expect(wrapper.text()).not.toContain("The identifier table is partial");
});

test("a card without rows and a partial identifier table says it is partial, not a bare Not recorded", () => {
  show(presence([]), { window: WINDOW, rows: [], truncated: true }, { networkCount: 1 });

  expect(wrapper.text()).toContain("The identifier table is partial: some router networks may not be listed here.");
  expect(wrapper.find(".not-recorded").exists()).toBe(false);
});

test("router rows count as listed when comparing with the event's networks", () => {
  const row: SmurfEventIdentifierRow = { hash8: "cccc0003", kind: "router", roles: ["network"], keys: 1, alsoIn: [] };
  show(presence([FULL]), { window: WINDOW, rows: [row], truncated: true }, { networkCount: 2 });

  expect(wrapper.text()).not.toContain("The identifier table is partial");
});

test("with no rows and router networks pending only the pending line shows", () => {
  show(presence([]), null, { networkCount: 1 });

  expect(wrapper.text()).toContain("Router networks are listed from the identifier table below.");
  expect(wrapper.find(".not-recorded").exists()).toBe(false);
});

test("a capped holdersOutside also gives the partial first and last wording", () => {
  const day = Date.UTC(2026, 8, 1) / 86_400_000;
  show(presence([]), { window: WINDOW, rows: [{ hash8: "cccc0003", kind: "router", roles: ["network"], keys: 1, alsoIn: [], firstDay: day, lastDay: day + 1, holdersOutside: { attendees: 1, others: 2, capped: true } }] });

  expect(wrapper.find(".venue-network").text()).toContain("(among the accounts read)");
});

test("router networks of the event that are not in yet are announced under the IP rows", () => {
  show(presence([FULL]), null, { networkCount: 2 });
  expect(wrapper.text()).toContain("Router networks are listed from the identifier table below.");
  wrapper.unmount();

  show(presence([FULL]), { window: WINDOW, rows: [] }, { networkCount: 2 });
  expect(wrapper.text()).not.toContain("Router networks are listed");
  wrapper.unmount();

  show(presence([FULL]), null, { networkCount: 1 });
  expect(wrapper.text()).not.toContain("Router networks are listed");
});

test("loading and a failure with a retry button replace the networks", async () => {
  show(null, null, { loading: true });
  expect(wrapper.text()).toContain("Loading where the venue networks and the attendees were");
  wrapper.unmount();

  show(null, null, { error: "Boom" });
  expect(wrapper.text()).toContain("Where the venue networks and the attendees were couldn't be loaded: Boom");
  const retry = wrapper.find("button.retry");
  expect(retry.exists()).toBe(true);
  await retry.trigger("click");
  expect(wrapper.emitted("retry")).toHaveLength(1);
});

test("no count, provider or country carries a colour class", () => {
  show(presence([FULL, { hash8: "0a1b2c3e", notRead: true }]));

  expect(wrapper.html()).not.toMatch(/text-(warning|error|success)|bg-[a-z]/);
});
