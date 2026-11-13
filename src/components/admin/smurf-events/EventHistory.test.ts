// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import type { SmurfEventHistory } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { testPlugins } from "./setup.testing";
import EventHistory from "./EventHistory.vue";

let wrapper: VueWrapper;

afterEach(() => wrapper.unmount());

function show(history: SmurfEventHistory | null, extra: { loading?: boolean; error?: string | null } = {}): void {
  wrapper = mount(EventHistory, { props: { history, loading: extra.loading ?? false, error: extra.error ?? null }, global: { plugins: testPlugins() } });
}

const HISTORY: SmurfEventHistory = {
  entries: [
    {
      id: "a2",
      at: "2026-10-06T09:30:00.000Z",
      author: "Mod#1",
      action: "event-confirm",
      reason: "known LAN",
      name: "Sofia LAN",
      outcome: { factsNetworks: 2, factsIdentifiers: 14, factsAttendees: 3, factsEndedLinks: 4 },
    },
    { id: "a1", at: "2026-10-05T08:00:00.000Z", author: "Mod#2", action: "event-rename", name: "Sofia LAN", outcome: { previousName: "Auto name" } },
  ],
};

function lines(): string[] {
  return wrapper.findAll("li.history-entry").map((l) => l.text());
}

test("each entry is one line with date, author, action, reason and name", () => {
  show(HISTORY);

  expect(lines()).toHaveLength(2);
  expect(lines()[0]).toContain("2026-10-06 09:30 UTC");
  expect(lines()[0]).toContain("Mod#1");
  expect(lines()[0]).toContain("Confirmed");
  expect(lines()[0]).toContain("known LAN");
  expect(lines()[0]).toContain("Sofia LAN");
  expect(lines()[1]).toContain("Mod#2");
  expect(lines()[1]).toContain("Renamed");
  expect(lines()[1]).not.toContain("Reason");
});

test("a review entry lists the facts it was made on, a rename does not", () => {
  show(HISTORY);

  expect(lines()[0]).toContain("Networks 2");
  expect(lines()[0]).toContain("Identifiers 14");
  expect(lines()[0]).toContain("Attendees 3");
  expect(lines()[0]).toContain("Links ended 4");
  expect(lines()[1]).not.toContain("Networks");
});

test("changes since the review show fact, then and now, marked in the warning colour", () => {
  show({ ...HISTORY, changedSinceReview: [{ fact: "attendees", then: 3, now: 5 }] });

  const block = wrapper.find(".history-changed");
  expect(block.text()).toContain("Changed since the review");
  expect(block.text()).toContain("◆");
  expect(block.text()).toContain("Attendees: 3 → 5");
  expect(block.find(".text-warning").exists()).toBe(true);
});

test("without changes since the review no such line is shown", () => {
  show(HISTORY);

  expect(wrapper.text()).not.toContain("Changed since the review");
});

test("an unknown action shows as sent", () => {
  show({ entries: [{ id: "x", at: "2026-10-05T08:00:00.000Z", author: "Mod#2", action: "event-future", name: "N", outcome: {} }] });

  expect(lines()[0]).toContain("event-future");
});

test("loading, failure and an empty record each say so", () => {
  show(null, { loading: true });
  expect(wrapper.text()).toContain("Loading the record");
  wrapper.unmount();

  show(null, { error: "Server said no" });
  expect(wrapper.text()).toContain("Server said no");
  wrapper.unmount();

  show({ entries: [] });
  expect(wrapper.text()).toContain("Nothing is recorded for this event yet.");
});
