// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import type { SmurfEventSpread } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { testPlugins } from "./setup.testing";
import AttendeeSpread from "./AttendeeSpread.vue";

let wrapper: VueWrapper;
afterEach(() => wrapper.unmount());

function show(spread: SmurfEventSpread | null, state: { loading?: boolean; error?: string | null } = {}): void {
  wrapper = mount(AttendeeSpread, { props: { spread, loading: state.loading ?? false, error: state.error ?? null }, global: { plugins: testPlugins() } });
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

test("loading and failure talk about the attendees, under the spread heading, and the retry is a button", async () => {
  show(null, { loading: true });
  expect(wrapper.find(".v-card-title").text()).toBe("Where the attendees were");
  expect(wrapper.text()).toContain("Loading where the attendees were");
  expect(wrapper.text()).not.toContain("venue");
  wrapper.unmount();

  show(null, { error: "Boom" });
  expect(wrapper.text()).toContain("Where the attendees were couldn't be loaded: Boom");
  expect(wrapper.text()).not.toContain("venue");
  await wrapper.find("button.retry").trigger("click");
  expect(wrapper.emitted("retry")).toHaveLength(1);
});
