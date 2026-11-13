// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import type { SmurfEventDetail, SmurfEventFacts } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { manualEvent, testPlugins } from "./setup.testing";
import EventFacts from "./EventFacts.vue";

let wrapper: VueWrapper;

afterEach(() => wrapper.unmount());

const FACTS: SmurfEventFacts = {
  at: "2026-10-05T00:00:00.000Z",
  networks: 2,
  identifiers: 14,
  maxAccountsEver: 9,
  attendees: 3,
  notCounted: 2,
  endedLinks: 4,
  liveLinks: 1,
};

function show(overrides: Partial<SmurfEventDetail> = {}): void {
  wrapper = mount(EventFacts, { props: { event: manualEvent({ facts: FACTS, notCounted: ["Home#2001", "Home#2002"], ...overrides }) }, global: { plugins: testPlugins() } });
}

function rows(): Array<[string, string]> {
  return wrapper.findAll("tbody tr").map((r) => {
    const cells = r.findAll("td");
    return [cells[0].text(), cells[1].text()];
  });
}

test("the rows come in the order a moderator reads them", () => {
  show();

  expect(rows().map(([label]) => label)).toEqual([
    "Networks",
    "Most accounts ever on one identifier",
    "Accounts with a usual home",
    "Links ended",
    "Accounts not counted as attendee",
  ]);
  expect(rows()[0][1]).toBe("2");
  expect(rows()[1][1]).toBe("9");
  expect(rows()[2][1]).toBe("2");
  expect(rows()[3][1]).toBe("4 ended, 1 still live");
});

test("an event with no network says so rather than 0", () => {
  show({ facts: { ...FACTS, networks: 0 } });

  expect(rows()[0][1]).toBe("No network");
});

test("a capped count reads at least N from the data", () => {
  show({ facts: { ...FACTS, maxAccountsEver: 31, maxAccountsEverCapped: true, liveLinks: 12, liveLinksCapped: true } });

  expect(rows()[1][1]).toBe("at least 31");
  expect(rows()[3][1]).toBe("4 ended, at least 12 still live");
});

test("accounts not counted are listed by name", () => {
  show();

  expect(rows()[4][1]).toContain("2");
  expect(rows()[4][1]).toContain("Home#2001");
  expect(rows()[4][1]).toContain("Home#2002");
});

test("facts that were never computed show a dash", () => {
  show({ facts: undefined, notCounted: [], counts: { networks: 1, machines: 3, attendees: 3 } });

  expect(rows()[1][1]).toBe("–");
  expect(rows()[2][1]).toBe("–");
});

test("an event without recorded evidence says so and shows no zeros", () => {
  show({ evidenceRecorded: false, facts: { ...FACTS, networks: 0, maxAccountsEver: undefined, liveLinks: 3 } });

  const text = wrapper.text();
  expect(text).toContain("Not recorded");
  expect(rows()[0][1]).toBe("Not recorded");
  expect(rows()[1][1]).toBe("Not recorded");
  expect(text).not.toMatch(/\b0\b/);
});

test("the line on what is recorded shows the date, and is absent when nothing is recorded", () => {
  show({ recorded: { hardwareKeysSince: "2026-03-02T10:00:00.000Z" } });
  expect(wrapper.text()).toContain("Hardware keys have been recorded since 2026-03-02 10:00 UTC.");
  expect(wrapper.text()).not.toContain("Device memory");
  wrapper.unmount();

  show({ recorded: {} });
  expect(wrapper.text()).not.toContain("recorded since");
});

test("no text speaks of countries or pings", () => {
  show({ recorded: { hardwareKeysSince: "2026-03-02T10:00:00.000Z", deviceMemorySince: "2026-04-02T10:00:00.000Z" } });

  expect(wrapper.text().toLowerCase()).not.toContain("countr");
  expect(wrapper.text().toLowerCase()).not.toContain("ping");
});
