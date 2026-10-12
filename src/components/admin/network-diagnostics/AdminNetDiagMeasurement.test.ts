// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import type { MeasurementDetailDto } from "@/store/admin/networkDiagnostics/types";

const { service } = vi.hoisted(() => ({ service: { getMeasurement: vi.fn() } }));
vi.mock("@/store/admin/networkDiagnostics/service", () => ({ networkDiagnosticsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import { RAW_EXPIRED_NOTICE } from "./measurementView";
import AdminNetDiagMeasurement from "./AdminNetDiagMeasurement.vue";
import NetDiagRttChart from "./NetDiagRttChart.vue";

// Every optional member of the wire shape is absent (C6 does not pin whether WB omits nulls).
const nullHeavy = {
  measurementId: "m1",
  runId: "r1",
  battleTag: "Alice#1234",
  submittedAt: "2026-10-09T14:05:00Z",
  windowStartedAt: "2026-10-09T14:00:00Z",
  windowEndedAt: "2026-10-09T14:05:00Z",
  attemptStartedAt: "2026-10-09T14:00:00Z",
  restarts: 0,
  targetCount: 1,
  floSnapshot: [],
  ipInfo: {},
  rawExpired: true,
  targets: [
    {
      targetKey: "gateway",
      label: "Gateway",
      paths: [{ path: "direct", endpoints: {}, probes: [{ method: "IcmpTraceroute", outcome: "unsupported", reason: "<img src=x onerror=alert(1)>" }] }],
    },
  ],
} as unknown as MeasurementDetailDto;

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function mountPage(): VueWrapper {
  return mount(AdminNetDiagMeasurement, {
    props: { measurementId: "m1" },
    global: { plugins: [createVuetify({ components, directives })], stubs: { RouterLink: true } },
  });
}

it("renders a measurement with every optional member absent, reasons as text", async () => {
  service.getMeasurement.mockResolvedValueOnce(nullHeavy);
  const wrapper = mountPage();
  await flushPromises();

  expect(wrapper.text()).toContain("Alice#1234");
  expect(wrapper.text()).toContain("No flo ping snapshot");
  expect(wrapper.text()).toContain("<img src=x onerror=alert(1)>");
  expect(wrapper.find("img").exists()).toBe(false);
});

it("raw expired: loading the time-series shows the expiry notice and no chart", async () => {
  service.getMeasurement.mockResolvedValue(nullHeavy);
  const wrapper = mountPage();
  await flushPromises();
  expect(wrapper.text()).not.toContain(RAW_EXPIRED_NOTICE);

  const loadRaw = wrapper.findAll("button").find((button) => button.text().includes("Load RTT time-series"));
  expect(loadRaw).toBeDefined();
  await loadRaw!.trigger("click");
  await flushPromises();

  expect(service.getMeasurement).toHaveBeenLastCalledWith("tok", "m1", true);
  expect(wrapper.text()).toContain(RAW_EXPIRED_NOTICE);
  expect(wrapper.findComponent(NetDiagRttChart).exists()).toBe(false);
  expect(wrapper.text()).not.toContain("No time-series for this target");
});

it("a payload without targets, snapshot or ipInfo renders before and after the raw load", async () => {
  const { measurementId, runId, battleTag, submittedAt, windowStartedAt, windowEndedAt, attemptStartedAt, restarts, targetCount } = nullHeavy;
  const bare = { measurementId, runId, battleTag, submittedAt, windowStartedAt, windowEndedAt, attemptStartedAt, restarts, targetCount };
  service.getMeasurement.mockResolvedValue({ ...bare, rawExpired: false });
  const wrapper = mountPage();
  await flushPromises();
  const loadRaw = wrapper.findAll("button").find((button) => button.text().includes("Load RTT time-series"));
  await loadRaw!.trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("Alice#1234");
});
