// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import type { MeasurementDetailDto } from "@/store/admin/networkDiagnostics/types";
import { useNetDiagMeasurementsStore } from "@/store/admin/networkDiagnostics/measurementsStore";
import { realMeasurement } from "./fixtures/realMeasurement";

const { service } = vi.hoisted(() => ({ service: { getMeasurement: vi.fn() } }));
vi.mock("@/store/admin/networkDiagnostics/service", () => ({ networkDiagnosticsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import AdminNetDiagMeasurement from "./AdminNetDiagMeasurement.vue";
import { adapterLine, endpointsLine, hopEnrichment, hopRows, measurementFacts, orderedPaths, probeStatsLine, rawSamplesNotice, rttSeries, snapshotRows } from "./measurementView";

type Path = ReadonlyArray<string | number>;
type Mode = "null" | "delete";

/** Identifiers, enums and counters the backend always sends; every other member may arrive null or absent. */
const ALWAYS_SENT = new Set(["measurementId", "runId", "battleTag", "submittedAt", "targetCount", "restarts", "targetKey", "path", "method", "outcome", "ttl", "sent", "received", "nodeId"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Every member path, recursing into objects and into the objects inside arrays (not into sample tuples). */
function memberPaths(node: unknown, prefix: Path = []): Path[] {
  if (Array.isArray(node)) return node.flatMap((item, index) => (isObject(item) ? memberPaths(item, [...prefix, index]) : []));
  if (!isObject(node)) return [];
  return Object.entries(node).flatMap(([key, value]) => (ALWAYS_SENT.has(key) ? [] : [[...prefix, key], ...memberPaths(value, [...prefix, key])]));
}

function mutate(root: MeasurementDetailDto, path: Path, mode: Mode): MeasurementDetailDto {
  const copy = structuredClone(root) as unknown as Record<string | number, unknown>;
  let parent = copy;
  for (const step of path.slice(0, -1)) parent = parent[step] as Record<string | number, unknown>;
  const last = path[path.length - 1];
  if (mode === "null") parent[last] = null;
  else delete parent[last];
  return copy as unknown as MeasurementDetailDto;
}

function stringsOf(value: unknown, into: string[] = []): string[] {
  if (typeof value === "string") into.push(value);
  else if (typeof value === "number" && Number.isNaN(value)) into.push("NaN");
  else if (Array.isArray(value)) value.forEach((item) => stringsOf(item, into));
  else if (isObject(value)) Object.values(value).forEach((item) => stringsOf(item, into));
  return into;
}

const BAD_TEXT = /\b(undefined|NaN|null)\b/;

/** Runs every exported view function the page uses on the (possibly broken) payload. */
function viewTexts(detail: MeasurementDetailDto): string[] {
  const out: unknown[] = [];
  out.push(measurementFacts(detail));
  out.push((detail.system?.adapters ?? []).map(adapterLine));
  out.push(snapshotRows(detail.floSnapshot ?? []));
  out.push(rawSamplesNotice(detail, true));
  for (const target of detail.targets ?? []) {
    out.push(rttSeries(target, ["#111111", "#222222"]));
    for (const path of orderedPaths(target)) {
      out.push(endpointsLine(path.endpoints));
      for (const probe of path.probes ?? []) {
        out.push(probeStatsLine(probe));
        out.push(hopRows(probe.hops ?? []));
        out.push(hopEnrichment(probe.hops ?? [], detail.ipInfo ?? {}));
      }
    }
  }
  return stringsOf(out);
}

beforeEach(() => {
  setActivePinia(createPinia());
  renderErrors.length = 0;
  vi.clearAllMocks();
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const renderErrors: unknown[] = [];

/** One mounted page; each payload is swapped into the store, as a navigation between measurements would. */
async function mountPage(first: MeasurementDetailDto): Promise<{ show: (detail: MeasurementDetailDto) => Promise<string> }> {
  service.getMeasurement.mockResolvedValue(first);
  const wrapper = mount(AdminNetDiagMeasurement, {
    props: { measurementId: first.measurementId },
    global: {
      plugins: [createVuetify({ components, directives })],
      stubs: { RouterLink: true, NetDiagRttChart: true },
      config: { errorHandler: (error) => void renderErrors.push(error) },
    },
  });
  await flushPromises();
  const store = useNetDiagMeasurementsStore();
  return {
    show: async (detail) => {
      store.detail = detail;
      store.detailRaw = true;
      await nextTick();
      return wrapper.text();
    },
  };
}

it("the unmodified real payload renders clean text everywhere", async () => {
  const detail = realMeasurement();
  expect(viewTexts(detail).filter((text) => BAD_TEXT.test(text))).toEqual([]);
  const page = await mountPage(detail);
  const text = await page.show(detail);
  expect(renderErrors).toEqual([]);
  expect(text).toContain("Testuser#1234");
  expect(text).not.toMatch(BAD_TEXT);
});

it("every member of the real payload may be null or absent: no view function throws, no undefined/NaN/null text", async () => {
  const base = realMeasurement();
  const paths = memberPaths(base);
  expect(paths.length).toBeGreaterThan(150);
  const failures: string[] = [];
  const page = await mountPage(base);
  for (const path of paths) {
    for (const mode of ["null", "delete"] as const) {
      const label = `${mode} ${path.join(".")}`;
      const broken = mutate(base, path, mode);
      try {
        const bad = viewTexts(broken).filter((text) => BAD_TEXT.test(text));
        if (bad.length > 0) failures.push(`${label}: view text ${JSON.stringify(bad[0])}`);
        renderErrors.length = 0;
        const text = await page.show(broken);
        if (renderErrors.length > 0) failures.push(`${label}: render error ${String(renderErrors[0])}`);
        if (BAD_TEXT.test(text)) failures.push(`${label}: page text ${BAD_TEXT.exec(text)?.[0]}`);
        if (!text.includes("Testuser#1234")) failures.push(`${label}: page lost its header`);
      } catch (e) {
        failures.push(`${label}: threw ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  expect(failures).toEqual([]);
}, 60_000);
