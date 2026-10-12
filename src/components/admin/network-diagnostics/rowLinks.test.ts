// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import { flushPromises, mount, RouterLinkStub, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { EAdminRouteName } from "@/router/types";

const { service } = vi.hoisted(() => ({ service: { getMeasurements: vi.fn(), getRuns: vi.fn(), getRun: vi.fn(), getTargets: vi.fn() } }));
vi.mock("@/store/admin/networkDiagnostics/service", () => ({ networkDiagnosticsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));
vi.mock("@/components/admin/commercial-events/BattleTagPicker.vue", () => ({ default: { render: () => null } }));
vi.mock("vue-router", () => ({
  useRoute: () => ({ name: "NetDiagMeasurements", query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
}));

import AdminNetDiagMeasurements from "./AdminNetDiagMeasurements.vue";
import AdminNetDiagRunDetail from "./AdminNetDiagRunDetail.vue";
import AdminNetDiagRuns from "./AdminNetDiagRuns.vue";

const LONG_ASN_ORG = "Hetzner Online GmbH with a very long registered network name that stretches the table";

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function mountPage(component: object, props: Record<string, unknown> = {}): VueWrapper {
  return mount(component, {
    props,
    global: { plugins: [createVuetify({ components, directives })], stubs: { RouterLink: RouterLinkStub, NetDiagFleetView: true } },
  });
}

function linkTo(wrapper: VueWrapper, text: string): unknown {
  return wrapper.findAllComponents(RouterLinkStub).find((link) => link.text().includes(text))?.props("to");
}

it("measurements: the date cell opens the measurement and a long network name is cut with its full text in a title", async () => {
  service.getMeasurements.mockResolvedValue({
    truncated: false,
    data: {
      total: 1,
      items: [{
        measurementId: "m1",
        runId: "r1abcdefgh",
        battleTag: "Testuser#1234",
        submittedAt: "2026-10-12T19:30:46.736Z",
        clientIp: "8.8.8.8",
        clientGeo: { country: "DE", city: "Falkenstein", lat: null, lon: null, asn: 24940, asnOrg: LONG_ASN_ORG, geoDbBuild: null },
        os: "windows",
        primaryAdapterType: "ethernet",
        vpnSuspected: null,
        targetCount: 5,
        restarts: 0,
      }],
    },
  });
  const wrapper = mountPage(AdminNetDiagMeasurements);
  await flushPromises();

  expect(linkTo(wrapper, "2026-10-12 19:30 UTC")).toEqual({ name: EAdminRouteName.NETDIAG_MEASUREMENT_DETAIL, params: { measurementId: "m1" } });
  expect(wrapper.find(`[title="AS24940 ${LONG_ASN_ORG}"]`).exists()).toBe(true);
});

it("runs: the created cell opens the run", async () => {
  service.getRuns.mockResolvedValue({
    total: 1,
    items: [{
      id: "run-1",
      createdAt: "2026-10-12T19:30:35.335Z",
      createdBy: "Admin#1000",
      audience: { kind: "All" },
      targets: { floNodeIds: [], allFloNodes: false, coreServers: [], baselines: [], customTargets: [], includeDefaultGateway: true },
      methods: ["TcpPing"],
      allowDuringGame: false,
      windowSeconds: 60,
      windowStart: null,
      windowEnd: null,
      cancelledAt: null,
      counters: { assigned: 0, delivered: 0, submitted: 0, expired: 0 },
      expectedDurationSeconds: 75,
    }],
  });
  const wrapper = mountPage(AdminNetDiagRuns);
  await flushPromises();

  expect(linkTo(wrapper, "2026-10-12 19:30 UTC")).toEqual({ name: EAdminRouteName.NETDIAG_RUN_DETAIL, params: { runId: "run-1" } });
});

it("run detail: the slot cell of a submitted assignment opens its result, a pending one is plain text", async () => {
  const assignment = (measurementId: string, battleTag: string, status: string, deliverAfter: string): unknown => ({
    measurementId,
    battleTag,
    status,
    deliverAfter,
    deliverBy: "2026-10-26T19:30:35.335Z",
    deliveredAt: null,
    submittedAt: status === "Submitted" ? "2026-10-12T19:30:46.736Z" : null,
    clientGeo: { country: "DE", city: null, lat: null, lon: null, asn: 24940, asnOrg: LONG_ASN_ORG, geoDbBuild: null },
  });
  service.getTargets.mockResolvedValue({ floNodes: [], coreServers: [], baselines: [] });
  service.getRun.mockResolvedValue({
    run: {
      id: "run-1",
      createdAt: "2026-10-12T19:30:35.335Z",
      createdBy: "Admin#1000",
      audience: { kind: "All" },
      targets: { floNodeIds: [], allFloNodes: false, coreServers: [], baselines: [], customTargets: [], includeDefaultGateway: true },
      methods: ["TcpPing"],
      allowDuringGame: false,
      windowSeconds: 60,
      windowStart: null,
      windowEnd: null,
      cancelledAt: null,
      counters: { assigned: 2, delivered: 2, submitted: 1, expired: 0 },
      expectedDurationSeconds: 75,
    },
    assignments: [assignment("m1", "Alpha#1111", "Submitted", "2026-10-12T19:10:00Z"), assignment("m2", "Bravo#2222", "Pending", "2026-10-12T19:20:00Z")],
  });
  const wrapper = mountPage(AdminNetDiagRunDetail, { runId: "run-1" });
  await flushPromises();

  expect(linkTo(wrapper, "2026-10-12 19:10 UTC")).toEqual({ name: EAdminRouteName.NETDIAG_MEASUREMENT_DETAIL, params: { measurementId: "m1" } });
  expect(linkTo(wrapper, "2026-10-12 19:20 UTC")).toBeUndefined();
  expect(wrapper.text()).toContain("2026-10-12 19:20 UTC");
  expect(wrapper.find(`[title="AS24940 ${LONG_ASN_ORG}"]`).exists()).toBe(true);
});
