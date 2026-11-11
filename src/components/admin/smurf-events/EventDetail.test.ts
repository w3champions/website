// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import type { SmurfEventDetail } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { manualEvent, testPlugins } from "./setup.testing";

vi.mock("@/store/admin/smurfEvents/service", () => ({ smurfEventsService: () => ({}) }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import EventDetail from "./EventDetail.vue";

let wrapper: VueWrapper;

afterEach(() => wrapper.unmount());

async function show(event: SmurfEventDetail): Promise<void> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/hardware", name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, component: { template: "<div />" } }],
  });
  await router.push("/hardware");
  const plugins = testPlugins();
  useSmurfEventsStore().detail = event;
  wrapper = mount(EventDetail, { props: { eventId: event.id, canAdminister: true }, global: { plugins: [...plugins, router] } });
  await flushPromises();
}

test("a cut list of ended links says so", async () => {
  await show(manualEvent({ endedLinksListTruncated: true }));

  expect(wrapper.text()).toContain("Showing part of the ended links.");
});

test("a cut list of ended links still counts every ended link", async () => {
  const event = manualEvent({ endedLinksListTruncated: true });

  await show({ ...event, endedLinks: event.endedLinksList.length + 7 });

  const title = wrapper.findAll(".v-card-title").find((c) => c.text().startsWith("Ended links"));
  expect(title?.find(".v-chip").text()).toBe(String(event.endedLinksList.length + 7));
});

test("a complete list of ended links carries no such note", async () => {
  await show(manualEvent());

  expect(wrapper.text()).not.toContain("Showing part of the ended links.");
});

test("an edited event that came back unreviewed shows no reviewer or confirmed state", async () => {
  await show(manualEvent({ review: "unreviewed" }));

  expect(wrapper.text()).toContain("Unreviewed");
  expect(wrapper.text()).not.toContain("Reviewed by");
  expect(wrapper.text()).not.toContain("Confirmed");
});

test("an event whose homes were never computed shows them as not computed", async () => {
  await show(manualEvent({ counts: { networks: 1, machines: 3, attendees: 3 } }));

  const tile = wrapper.findAll(".stat-tile").find((c) => c.text().includes("Homes"));
  expect(tile?.text()).toContain("Not computed");
  expect(tile?.text()).not.toMatch(/undefined|\b0\b/);
});
