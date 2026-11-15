// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import type { SmurfEventSpread } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { createMemoryHistory, createRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import { testPlugins } from "./setup.testing";
import AttendeeSpread from "./AttendeeSpread.vue";

let wrapper: VueWrapper;
afterEach(() => wrapper.unmount());

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: "/hardware", name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, component: { template: "<div />" } }],
});

function show(spread: SmurfEventSpread | null, state: { loading?: boolean; error?: string | null; truncated?: boolean } = {}): void {
  wrapper = mount(AttendeeSpread, {
    props: { spread, truncated: state.truncated ?? false, loading: state.loading ?? false, error: state.error ?? null },
    global: { plugins: [...testPlugins(), router] },
  });
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

test("the accounts of a shared network link to their hardware page", () => {
  show({ sharedInSpan: [{ hash8: "0a1b2c3d", accounts: ["Anchor#1001", "Guest#1003"] }], sharedUsual: [] });

  const links = wrapper.findAll("a.account-link");
  expect(links.map((l) => l.text())).toEqual(["Anchor#1001", "Guest#1003"]);
  expect(links[0].attributes("href")).toContain("player=Anchor%231001");
});

test("the partial notice follows the presence answer and sits right under the title", () => {
  show({ countries: ["DE"], providers: ["Example Telecom"], sharedInSpan: [], sharedUsual: [] }, { truncated: true });

  const notice = wrapper.findAll("[role='status']");
  expect(notice).toHaveLength(1);
  expect(notice[0].text()).toBe("Part of this was not read: rows marked Not read and numbers marked at least are incomplete.");
  expect(wrapper.find(".v-card-title").element.nextElementSibling).toBe(notice[0].element);
});

test("a capped spread says what an empty list covers: None among the attendees read", () => {
  show({ capped: true, countries: [], providers: ["Example Telecom"], sharedInSpan: [], sharedUsual: [] });

  const groups = wrapper.findAll(".spread-group");
  expect(groups[0].text()).toContain("None among the attendees read");
  expect(groups[0].text()).not.toMatch(/Not read|None$/);
  expect(groups[1].text()).toContain("Example Telecom");
  expect(groups[2].text()).toContain("None among the attendees read");
  expect(groups[3].text()).toContain("None among the attendees read");
});

test("a capped spread with absent countries says the same, not the Not recorded hatch", () => {
  show({ capped: true, providers: [], sharedInSpan: [], sharedUsual: [] });

  const groups = wrapper.findAll(".spread-group");
  expect(groups[0].text()).toContain("None among the attendees read");
  expect(groups[0].find(".not-recorded").exists()).toBe(false);
  expect(groups[1].text()).toContain("None among the attendees read");
});

test("a spread that is not capped keeps None and Not recorded even when the answer is partial", () => {
  show({ providers: [], sharedInSpan: [], sharedUsual: [] }, { truncated: true });

  const groups = wrapper.findAll(".spread-group");
  expect(groups[0].find(".not-recorded").exists()).toBe(true);
  expect(groups[1].text()).toContain("None");
  expect(wrapper.text()).not.toContain("among the attendees read");
});

test("a complete answer has no partial notice", () => {
  show({ countries: [], sharedInSpan: [], sharedUsual: [] });

  expect(wrapper.text()).not.toContain("Part of this was not read");
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
