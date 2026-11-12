// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import type { AuditEntry } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { useHardwareSmurfsStore } from "@/store/admin/hardwareSmurfs/store";
import { testPlugins } from "../smurf-events/setup.testing";
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));
vi.mock("@/store/admin/hardwareSmurfs/service", () => ({ hardwareSmurfService: () => ({}) }));

import HardwareAuditCard from "./HardwareAuditCard.vue";

let wrapper: VueWrapper;

afterEach(() => wrapper.unmount());

function entry(overrides: Partial<AuditEntry>): AuditEntry {
  return {
    id: "1",
    at: "2026-10-01T10:00:00.000Z",
    author: "Mod#1",
    action: "event-confirm",
    target: { kind: "event", id: "ev1", name: "LAN party" },
    accounts: ["Anchor#1001"],
    outcome: { review: "confirmed", previous: "unreviewed", version: 2 },
    ...overrides,
  };
}

async function show(entries: AuditEntry[]): Promise<void> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/admin-smurf-events", name: EAdminRouteName.SMURF_EVENTS, component: { template: "<div />" } }],
  });
  await router.push("/admin-smurf-events");
  const plugins = testPlugins();
  useHardwareSmurfsStore().audit = entries;
  wrapper = mount(HardwareAuditCard, { global: { plugins: [...plugins, router] } });
  await flushPromises();
}

test("an event entry shows its action, a link to the event and its outcome", async () => {
  await show([entry({})]);

  const link = wrapper.findAll("a").find((a) => a.attributes("href")?.includes("event="));
  expect(link?.text()).toBe("LAN party");
  expect(link?.attributes("href")).toBe("/admin-smurf-events?event=ev1");
  expect(wrapper.text()).toContain("Confirmed event");
  expect(wrapper.text()).toContain("Review: Confirmed · Previous review: Unreviewed");
  expect(wrapper.text()).not.toContain("version");
});

test("a pair entry has no event link and an unknown target kind shows as sent", async () => {
  await show([
    entry({ id: "2", action: "verdict-smurf", target: { kind: "pair", a: "A#1", b: "B#2" }, outcome: {} }),
    entry({ id: "3", action: "mystery", target: { kind: "brand-new" } as unknown as AuditEntry["target"], outcome: {} }),
  ]);

  expect(wrapper.findAll("a").filter((a) => a.attributes("href")?.includes("event="))).toHaveLength(0);
  expect(wrapper.text()).toContain("A#1 ↔ B#2");
  expect(wrapper.text()).toContain("brand-new");
  expect(wrapper.text()).not.toContain("undefined");
});
