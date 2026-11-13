// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import type { HardwareLink } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { useHardwareSmurfsStore } from "@/store/admin/hardwareSmurfs/store";
import { testPlugins } from "../smurf-events/setup.testing";
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));
vi.mock("@/store/admin/hardwareSmurfs/service", () => ({ hardwareSmurfService: () => ({}) }));

import HardwareLinksCard from "./HardwareLinksCard.vue";

let wrapper: VueWrapper;

afterEach(() => wrapper.unmount());

function tombstone(overrides: Partial<HardwareLink>): HardwareLink {
  return {
    _id: "Anchor#1001|Guest#1003",
    a: "Anchor#1001",
    b: "Guest#1003",
    source: "hardware",
    createdAt: "2026-10-01T00:00:00.000Z",
    lastConfirmedAt: "2026-10-02T00:00:00.000Z",
    invalidatedAt: "2026-10-03T00:00:00.000Z",
    invalidReason: "event",
    evidence: { matched: [] },
    ...overrides,
  };
}

async function show(link: HardwareLink): Promise<void> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/admin-smurf-events", name: EAdminRouteName.SMURF_EVENTS, component: { template: "<div />" } }],
  });
  await router.push("/admin-smurf-events");
  const plugins = testPlugins();
  const store = useHardwareSmurfsStore();
  store.battleTag = "Anchor#1001";
  store.links = [link];
  wrapper = mount(HardwareLinksCard, { global: { plugins: [...plugins, router] } });
  await flushPromises();
}

test("a link ended by events names them with links to the smurf events page", async () => {
  await show(tombstone({ endedBy: [{ id: "ev1", name: "LAN party" }, { id: "ev2", name: "Cup" }] }));

  const links = wrapper.findAll("a").filter((a) => a.attributes("href")?.includes("event="));
  expect(links.map((a) => a.text())).toEqual(["LAN party", "Cup"]);
  expect(links.map((a) => a.attributes("href"))).toEqual(["/admin-smurf-events?event=ev1", "/admin-smurf-events?event=ev2"]);
});

test("a link ended for another reason, or by a venue window, shows no event links", async () => {
  await show(tombstone({ invalidReason: "venue" }));

  expect(wrapper.findAll("a").filter((a) => a.attributes("href")?.includes("event="))).toHaveLength(0);
});

test("the shared items of a link render as identifier chips", async () => {
  await show(tombstone({ invalidatedAt: undefined, invalidReason: undefined, evidence: { matched: [{ kind: "V:disk", tier: "strong", hash8: "9f8e7d6c" }] } as HardwareLink["evidence"] }));

  const chip = wrapper.findComponent({ name: "IdentifierChip" });
  expect(chip.exists()).toBe(true);
  expect(chip.props()).toMatchObject({ kind: "V:disk", hash8: "9f8e7d6c" });
});
