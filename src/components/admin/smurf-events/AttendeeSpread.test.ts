// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import type { SmurfEventSpread } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { testPlugins } from "./setup.testing";
import AttendeeSpread from "./AttendeeSpread.vue";

let wrapper: VueWrapper;
afterEach(() => wrapper.unmount());

function show(spread: SmurfEventSpread): void {
  wrapper = mount(AttendeeSpread, { props: { spread }, global: { plugins: testPlugins() } });
}

test("the spread lists shared networks under their neutral headings", () => {
  show({
    countries: ["DE", "PL"],
    providers: ["Example Telecom"],
    sharedInSpan: [{ hash8: "0a1b2c3d", accounts: ["Anchor#1001", "Guest#1003"] }],
    sharedUsual: [],
  });

  const text = wrapper.text();
  expect(text).toContain("Where the attendees were");
  expect(text).toContain("Countries");
  expect(text).toContain("DE, PL");
  expect(text).toContain("Providers");
  expect(text).toContain("Example Telecom");
  expect(text).toContain("Same address during the event");
  expect(text).toContain("0a1b2c3d");
  expect(text).toContain("Anchor#1001, Guest#1003");
  expect(text).toContain("Same usual network");
  expect(text).toContain("None");
});

test("countries and providers that are not recorded show Not recorded, an empty list shows None", () => {
  show({ providers: [], sharedInSpan: [], sharedUsual: [] });

  const groups = wrapper.findAll(".spread-group");
  expect(groups[0].find(".not-recorded").exists()).toBe(true);
  expect(groups[1].text()).toContain("None");
  expect(groups[1].find(".not-recorded").exists()).toBe(false);
});

test("no count, provider or country carries a colour class", () => {
  show({ countries: ["DE"], providers: ["Example Telecom"], sharedInSpan: [{ hash8: "0a1b2c3d", accounts: ["A#1", "B#2"] }], sharedUsual: [] });

  expect(wrapper.html()).not.toMatch(/text-(warning|error|success)|bg-[a-z]/);
});
