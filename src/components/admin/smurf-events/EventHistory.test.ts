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

test("a changed fact that was capped then or now reads at least N", () => {
  show({
    ...HISTORY,
    changedSinceReview: [
      { fact: "liveLinks", then: 12, thenCapped: true, now: 15 },
      { fact: "maxAccountsEver", then: 9, now: 31, nowCapped: true },
      { fact: "attendees", then: 3, now: 5 },
    ],
  });

  const block = wrapper.find(".history-changed").text();
  expect(block).toContain("Links among attendees still live: at least 12 \u2192 15");
  expect(block).toContain("Most accounts ever on one identifier: 9 \u2192 at least 31");
  expect(block).toContain("Attendees: 3 \u2192 5");
});

test("a review entry that recorded capped facts reads them as at least N", () => {
  show({ entries: [{ ...HISTORY.entries[0], outcome: { factsNetworks: 2, factsMaxAccountsEver: 31, factsMaxAccountsEverCapped: true } }] });

  expect(lines()[0]).toContain("Most accounts ever on one identifier at least 31");
});

test("a rename entry names the previous and the new name; without a previous name it shows the name", () => {
  show(HISTORY);
  expect(lines()[1]).toContain("Renamed from Auto name to Sofia LAN");
  wrapper.unmount();

  show({ entries: [{ ...HISTORY.entries[1], outcome: {} }] });
  expect(lines()[0]).toContain("Name: Sofia LAN");
  expect(lines()[0]).not.toContain("Renamed from");
});

test("a fact no longer known reads then, no longer known", () => {
  show({ ...HISTORY, changedSinceReview: [{ fact: "liveLinks", then: 12, thenCapped: true }, { fact: "attendees", then: 3 }] });

  const block = wrapper.find(".history-changed").text();
  expect(block).toContain("Links among attendees still live: at least 12 then, no longer known");
  expect(block).toContain("Attendees: 3 then, no longer known");
});

test("a cut record says that older entries are not shown", () => {
  show({ ...HISTORY, truncated: true });
  expect(wrapper.text()).toContain("Older entries are not shown.");
  wrapper.unmount();

  show(HISTORY);
  expect(wrapper.text()).not.toContain("Older entries");
});

test("a repaired entry carries a neutral note that it was recorded later, with its explanation", () => {
  show({ entries: [{ ...HISTORY.entries[0], outcome: { ...HISTORY.entries[0].outcome, repaired: true } }, HISTORY.entries[1]] });

  const notes = wrapper.findAll(".repaired");
  expect(notes).toHaveLength(1);
  expect(notes[0].text()).toBe("Recorded later");
  expect(notes[0].attributes("title")).toBe("It stands for an act whose own entry could not be written at the time.");
  expect(notes[0].classes().join(" ")).not.toMatch(/error|success|warning/);
});

test("without the flag an entry carries no such note", () => {
  show(HISTORY);

  expect(wrapper.find(".repaired").exists()).toBe(false);
});

test("a review entry reads the lower-bound flags and the timeout of the facts it recorded", () => {
  show({ entries: [{ ...HISTORY.entries[0], outcome: { factsIdentifiers: 14, factsMaxAccountsEver: 9, factsIdentifiersTruncated: true, factsLiveLinksTimedOut: true } }] });

  expect(lines()[0]).toContain("Identifiers at least 14");
  expect(lines()[0]).toContain("Most accounts ever on one identifier at least 9");
  expect(lines()[0]).toContain("Links among attendees still live could not be counted");
});

test("without the flags the recorded numbers read as exact", () => {
  show({ entries: [{ ...HISTORY.entries[0], outcome: { factsIdentifiers: 14, factsMaxAccountsEver: 9, factsLiveLinks: 3 } }] });

  expect(lines()[0]).toContain("Identifiers 14, Most accounts ever on one identifier 9, Links among attendees still live 3");
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

test("a failed load offers a retry that asks the page to load the record again", async () => {
  show(null, { error: "Server said no" });

  await wrapper.findAll("button").find((b) => b.text().trim() === "Try again")?.trigger("click");

  expect(wrapper.emitted("retry")).toHaveLength(1);
});
