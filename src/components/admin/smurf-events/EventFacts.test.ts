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
  wrapper = mount(EventFacts, { props: { event: manualEvent({ facts: FACTS, notCounted: ["Home#2001", "Home#2002"], evidence: { networkDaysBefore: 1, networkDaysAfter: 2, returningAttendees: 1 }, ...overrides }) }, global: { plugins: testPlugins() } });
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
    "Identifiers",
    "Accounts with a usual home",
    "Links ended",
    "Accounts not counted as attendee",
    "Days on these networks before the event",
    "Days on these networks after the event",
    "Attendees seen together again later",
  ]);
  expect(rows()[0][1]).toBe("2");
  expect(rows()[1][1]).toBe("14, most accounts ever on one: 9");
  expect(rows()[2][1]).toBe("2");
  expect(rows()[3][1]).toBe("4 ended, 1 still live");
  expect(rows()[5][1]).toBe("1");
  expect(rows()[6][1]).toBe("2");
  expect(rows()[7][1]).toBe("1");
});

test("an event with no network says so rather than 0", () => {
  show({ facts: { ...FACTS, networks: 0 } });

  expect(rows()[0][1]).toBe("No network");
});

test("a capped count reads at least N from the data", () => {
  show({ facts: { ...FACTS, maxAccountsEver: 31, maxAccountsEverCapped: true, liveLinks: 12, liveLinksCapped: true } });

  expect(rows()[1][1]).toBe("14, most accounts ever on one: at least 31");
  expect(rows()[3][1]).toBe("4 ended, at least 12 still live");
});

test("no identifier with a day history shows a dash for the most accounts ever", () => {
  show({ facts: { ...FACTS, maxAccountsEver: undefined } });

  expect(rows()[1][1]).toBe("14, most accounts ever on one: \u2013");
});

test("accounts not counted are listed by name", () => {
  show();

  expect(rows()[4][1]).toContain("2");
  expect(rows()[4][1]).toContain("Home#2001");
  expect(rows()[4][1]).toContain("Home#2002");
});

test("facts that were never computed show a dash in every row they feed, never 0", () => {
  show({ facts: undefined, notCounted: [], counts: { networks: 1, machines: 3, attendees: 3 }, endedLinks: 5 });

  expect(rows().slice(0, 5).map(([, value]) => value)).toEqual(["\u2013", "\u2013", "\u2013", "\u2013", "\u2013"]);
});

test("real zeros in the facts show as zeros", () => {
  const zero: SmurfEventFacts = { ...FACTS, identifiers: 0, maxAccountsEver: 0, attendees: 0, notCounted: 0, endedLinks: 0, liveLinks: 0 };
  show({ facts: zero, notCounted: [], counts: { networks: 1, machines: 3, attendees: 3, homes: 0 } });

  expect(rows()[1][1]).toBe("0, most accounts ever on one: 0");
  expect(rows()[2][1]).toBe("0");
  expect(rows()[3][1]).toBe("0 ended, 0 still live");
  expect(rows()[4][1]).toBe("0");
});

test("an event without recorded evidence shows Not recorded in the evidence rows, never a number", () => {
  show({ evidenceRecorded: false, evidence: { networkDaysBefore: 0, networkDaysAfter: 0, returningAttendees: 0 } });

  expect(rows().slice(5).map(([, value]) => value)).toEqual(["Not recorded", "Not recorded", "Not recorded"]);
  expect(rows().slice(0, 5).map(([, value]) => value)).not.toContain("Not recorded");
});

test("an event with recorded evidence shows real zeros in the evidence rows", () => {
  show({ evidence: { networkDaysBefore: 0, networkDaysAfter: 0, returningAttendees: 0 } });

  expect(rows().slice(5).map(([, value]) => value)).toEqual(["0", "0", "0"]);
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
