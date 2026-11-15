// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import type { SmurfEventAttendeePresence, SmurfEventPresence } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { testPlugins } from "./setup.testing";
import AttendeePresenceTable from "./AttendeePresenceTable.vue";

let wrapper: VueWrapper;
afterEach(() => wrapper.unmount());

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: "/hardware", name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, component: { template: "<div />" } }],
});

async function show(attendees: SmurfEventAttendeePresence[], anchors: string[] = []): Promise<void> {
  const presence: SmurfEventPresence = { at: "2026-10-05T00:00:00.000Z", window: { fromDay: 1, toDay: 2, eventFromDay: 1, eventToDay: 2 }, networks: [], attendees };
  await router.push("/hardware");
  wrapper = mount(AttendeePresenceTable, { props: { presence, anchors: new Set(anchors) }, global: { plugins: [...testPlugins(), router] } });
}

const rows = () => wrapper.findAll("tbody tr");

test("the attendee table shows how each attendee got in and No PC recorded for an attendee whose logins name no PC", async () => {
  await show([
    {
      battleTag: "Anchor#1001",
      entry: "network",
      venueLogins: 4,
      elsewhere: { logins: 9, networks: 2, homeLogins: 7 },
      nearestSwitchMinutes: 12,
      samePcRecorded: true,
      countries: ["DE"],
      providers: ["Example Telecom"],
    },
    { battleTag: "Guest#1003", entry: "pc", venueLogins: 1, elsewhere: { logins: 0, networks: 0, homeLogins: 0 }, samePcRecorded: false, countries: [], providers: [] },
  ], ["Anchor#1001"]);

  expect(wrapper.findAll("thead th[scope='col']").map((h) => h.text())).toEqual([
    "Attendee",
    "How they got in (as the logins show)",
    "Logins: venue / elsewhere (at home)",
    "Nearest switch on one PC",
    "Countries · providers",
  ]);
  expect(rows()).toHaveLength(2);
  const first = rows()[0].text();
  expect(first).toContain("Anchor#1001");
  expect(first).toContain("Anchor");
  expect(first).toContain("On a venue network");
  expect(first).toContain("4 / 9 (7)");
  expect(first).toContain("12 min");
  expect(first).toContain("DE");
  expect(first).toContain("Example Telecom");
  const second = rows()[1].text();
  expect(second).toContain("On a venue PC only");
  expect(second).toContain("No PC recorded");
  expect(second).toContain("None");
});

test("an attendee not read shows Not read, never 0", async () => {
  await show([{ battleTag: "Guest#1003", notRead: true }]);

  const text = rows()[0].text();
  expect(text).toContain("Guest#1003");
  expect(text).toContain("Not read");
  expect(text).not.toMatch(/\b0\b/);
});

test("absent facts of an attendee show Not recorded, never an empty cell", async () => {
  await show([{ battleTag: "Guest#1003" }]);

  expect(rows()[0].findAll("td").slice(1).every((td) => td.find(".not-recorded").exists())).toBe(true);
});

test("the rows keep the server's order and no count carries a colour class", async () => {
  await show([{ battleTag: "Zed#2", entry: "other" }, { battleTag: "Abe#1", entry: "other" }]);

  expect(rows().map((r) => r.text().slice(0, 5))).toEqual(["Zed#2", "Abe#1"]);
  expect(wrapper.html()).not.toMatch(/text-(warning|error|success)|bg-[a-z]/);
});
