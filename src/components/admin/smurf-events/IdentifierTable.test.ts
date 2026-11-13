// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import type { SmurfEventIdentifierRow, SmurfEventIdentifiers } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { testPlugins } from "./setup.testing";
import IdentifierTable from "./IdentifierTable.vue";

let wrapper: VueWrapper;

afterEach(() => wrapper.unmount());

const FROM_DAY = Date.UTC(2026, 8, 30) / 86_400_000;
const WINDOW = { fromDay: FROM_DAY, toDay: FROM_DAY + 20, eventFromDay: FROM_DAY + 5, eventToDay: FROM_DAY + 7 };

function row(overrides: Partial<SmurfEventIdentifierRow>): SmurfEventIdentifierRow {
  return {
    hash8: "aaaa0001",
    kind: "V:disk",
    roles: ["machine"],
    keys: 1,
    accountsDuring: 3,
    accountsEver: { count: 3 },
    daysOutside: { before: 0, after: 0 },
    days: [[FROM_DAY + 5, 3]],
    observed: [],
    alsoIn: [],
    ...overrides,
  };
}

function show(rows: SmurfEventIdentifierRow[], extra: Partial<SmurfEventIdentifiers> = {}, state: { loading?: boolean; error?: string | null } = {}): void {
  const identifiers: SmurfEventIdentifiers = { window: WINDOW, rows, ...extra };
  wrapper = mount(IdentifierTable, {
    props: { identifiers, loading: state.loading ?? false, error: state.error ?? null },
    global: { plugins: testPlugins() },
  });
}

function dataRows(): string[] {
  return wrapper.findAll("tbody tr.identifier-row").map((r) => r.text());
}

test("a row used during the event only is folded into one line with a count per number of accounts", () => {
  show([
    row({ hash8: "e0000001", accountsDuring: 3, accountsEver: { count: 3 } }),
    row({ hash8: "e0000002", accountsDuring: 3, accountsEver: { count: 3 } }),
    row({ hash8: "e0000003", accountsDuring: 5, accountsEver: { count: 5 } }),
    row({ hash8: "b0000001", accountsDuring: 4, accountsEver: { count: 9 }, observed: ["before"], daysOutside: { before: 6, after: 0 } }),
  ]);

  expect(wrapper.find(".fold-line").text()).toContain("3 identifiers used during the event only");
  expect(wrapper.find(".fold-line").text()).toContain("2 with 3 accounts");
  expect(wrapper.find(".fold-line").text()).toContain("1 with 5 accounts");
  expect(dataRows()).toHaveLength(1);
  expect(wrapper.text()).not.toContain("e0000001");
});

test("the folded line expands to its rows and collapses again", async () => {
  show([row({ hash8: "e0000001" }), row({ hash8: "e0000002" })]);

  const toggle = wrapper.find(".fold-line button");
  expect(toggle.attributes("aria-expanded")).toBe("false");
  await toggle.trigger("click");

  expect(toggle.attributes("aria-expanded")).toBe("true");
  expect(dataRows()).toHaveLength(2);
  expect(wrapper.text()).toContain("e0000001");

  await toggle.trigger("click");
  expect(dataRows()).toHaveLength(0);
});

test("a single folded identifier reads in the singular", () => {
  show([row({})]);

  expect(wrapper.find(".fold-line").text()).toContain("1 identifier used during the event only");
});

test("rows keep the order the server sent", () => {
  show([
    row({ hash8: "b0000003", observed: ["after"], accountsEver: { count: 4 } }),
    row({ hash8: "b0000001", observed: ["before"], accountsEver: { count: 90 } }),
    row({ hash8: "b0000002", observed: ["before", "after"], accountsEver: { count: 7 } }),
  ]);

  expect(dataRows().map((r) => r.match(/b000000\d/)?.[0])).toEqual(["b0000003", "b0000001", "b0000002"]);
});

test("tags show also before and also after with a diamond, in words", () => {
  show([row({ observed: ["before", "after"], accountsEver: { count: 9 }, daysOutside: { before: 4, after: 2 } })]);

  const text = dataRows()[0];
  expect(text).toContain("◆ also before");
  expect(text).toContain("◆ also after");
  expect(text).toContain("3 → 9");
  expect(text).toContain("4 / 2");
});

test("a capped ever count and its during count read at least N", () => {
  show([
    row({
      accountsDuring: 40,
      accountsEver: { count: 120, capped: true },
      daysOutside: { before: 8, after: 3, capped: true },
      observed: ["before"],
    }),
  ]);

  expect(dataRows()[0]).toContain("at least 40 → at least 120");
  expect(dataRows()[0]).toContain("at least 8 / at least 3");
});

test("the day chart of a capped row says in its text that its days are lower bounds", () => {
  show([row({ accountsEver: { count: 120, capped: true }, observed: ["before"], days: [[FROM_DAY + 4, 30], [FROM_DAY + 5, 40]] })]);
  const capped = wrapper.find(".identifier-row svg.day-lane").attributes("aria-label");
  wrapper.unmount();
  show([row({ accountsEver: { count: 12 }, observed: ["before"], days: [[FROM_DAY + 4, 3], [FROM_DAY + 5, 4]] })]);
  const exact = wrapper.find(".identifier-row svg.day-lane").attributes("aria-label");

  expect(capped).toContain("lower bounds");
  expect(exact).not.toContain("lower bounds");
});

test("a capped row without a recorded observed tag is not folded and does not claim days outside", () => {
  show([row({ hash8: "c0000001", accountsEver: { count: 120, capped: true }, observed: undefined, daysOutside: undefined })]);

  expect(wrapper.find(".fold-line").exists()).toBe(false);
  const text = dataRows()[0];
  expect(text).toContain("c0000001");
  expect(text).toContain("not fully known");
  expect(text).not.toContain("also before");
  expect(text).not.toContain("also after");
  expect(text).not.toContain("event only");
});

test("a row without an ever count shows its span dates and says no day history is recorded", () => {
  show([
    row({
      hash8: "1b000001",
      kind: "ip",
      roles: ["network"],
      accountsEver: undefined,
      daysOutside: undefined,
      days: undefined,
      observed: undefined,
      span: { firstAt: "2026-10-01T08:00:00.000Z", lastAt: "2026-10-02T20:00:00.000Z" },
    }),
  ]);

  const text = dataRows()[0];
  expect(text).toContain("no day history is recorded for this kind");
  expect(text).toContain("2026-10-01 08:00 UTC");
  expect(text).toContain("2026-10-02 20:00 UTC");
  expect(text).not.toContain("→");
  expect(wrapper.find(".fold-line").exists()).toBe(false);
});

test("a row without an ever count and without a span shows no dates", () => {
  show([row({ kind: "ip", accountsEver: undefined, daysOutside: undefined, days: undefined, observed: undefined, span: undefined })]);

  const text = dataRows()[0];
  expect(text).toContain("no day history is recorded for this kind");
  expect(text).not.toContain("UTC");
  expect(text).not.toContain("—");
});

test("a row with several keys says how many", () => {
  show([row({ keys: 3, observed: ["after"] }), row({ hash8: "a0000009", keys: 1, observed: ["after"] })]);

  expect(dataRows()[0]).toContain("(3 keys)");
  expect(dataRows()[1]).not.toContain("keys)");
});

test("values, machine names and usernames render as text when present", () => {
  show([row({ observed: ["after"], values: ["RAW-VALUE-1"], machineNames: ["DESK-01"], usernames: ["player<b>x</b>"] })]);

  const cell = dataRows()[0];
  expect(cell).toContain("RAW-VALUE-1");
  expect(cell).toContain("DESK-01");
  expect(cell).toContain("player<b>x</b>");
  expect(wrapper.find(".identifier-row b").exists()).toBe(false);
});

test("nothing is rendered for values, machine names and usernames when they are absent", () => {
  show([row({ observed: ["after"] })]);

  const text = dataRows()[0];
  expect(text).not.toContain("Machine names");
  expect(text).not.toContain("Usernames");
});

test("a cut list of identifiers says so", () => {
  show([row({ observed: ["after"] })], { truncated: true });

  expect(wrapper.text()).toContain("Showing part of the identifiers.");
});

test("a complete list says nothing about being cut", () => {
  show([row({ observed: ["after"] })]);

  expect(wrapper.text()).not.toContain("Showing part");
});

test("the other events of a row open through open-event", async () => {
  show([row({ observed: ["after"], alsoIn: [{ id: "ev7", name: "Cup" }, { id: "ev8", name: "Other LAN" }] })]);

  const buttons = wrapper.findAll(".identifier-row .also-in button");
  expect(buttons.map((b) => b.text())).toEqual(["Cup", "Other LAN"]);
  await buttons[1].trigger("click");

  expect(wrapper.emitted("open-event")).toEqual([["ev8"]]);
});

test("every chart has a text alternative with its numbers", () => {
  show([row({ observed: ["before"], accountsDuring: 3, accountsEver: { count: 82 }, days: [[FROM_DAY, 2], [FROM_DAY + 1, 3]] })]);

  const dumbbell = wrapper.find(".identifier-row svg.dumbbell");
  expect(dumbbell.attributes("role")).toBe("img");
  expect(dumbbell.attributes("aria-label")).toContain("3");
  expect(dumbbell.attributes("aria-label")).toContain("82");
  expect(dumbbell.find("title").text()).toBe(dumbbell.attributes("aria-label"));

  const lane = wrapper.find(".identifier-row svg.day-lane");
  expect(lane.attributes("role")).toBe("img");
  expect(lane.attributes("aria-label")).toContain("2026-09-30 to 2026-10-20");
  expect(lane.attributes("aria-label")).toContain("2026-09-30: 2");
  expect(lane.attributes("aria-label")).toContain("2026-10-01: 3");
  expect(lane.find("title").text()).toBe(lane.attributes("aria-label"));
});

test("loading, a failed load with a retry, and an empty list each say so", async () => {
  show([], {}, { loading: true });
  expect(wrapper.text()).toContain("Loading the identifiers");
  wrapper.unmount();

  show([], {}, { error: "down" });
  expect(wrapper.text()).toContain("The identifiers couldn't be loaded:");
  expect(wrapper.text()).toContain("down");
  await wrapper.find("button.retry").trigger("click");
  expect(wrapper.emitted("retry")).toHaveLength(1);
  wrapper.unmount();

  show([]);
  expect(wrapper.text()).toContain("No identifiers.");
});
