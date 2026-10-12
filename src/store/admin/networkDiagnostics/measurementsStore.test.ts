import { beforeEach, test, vi } from "vitest";
import { strict as assert } from "node:assert";
import { createPinia, setActivePinia } from "pinia";
import type { MeasurementDetailDto } from "./types";

const { service } = vi.hoisted(() => ({ service: { getMeasurement: vi.fn(), getMeasurements: vi.fn() } }));
vi.mock("./service", () => ({ networkDiagnosticsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import { useNetDiagMeasurementsStore } from "./measurementsStore";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function measurement(measurementId: string): MeasurementDetailDto {
  return { measurementId } as MeasurementDetailDto;
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

test("a slower load of the previous measurement cannot replace the one navigated to", async () => {
  const first = deferred<MeasurementDetailDto>();
  const second = deferred<MeasurementDetailDto>();
  service.getMeasurement.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const store = useNetDiagMeasurementsStore();

  const loadA = store.loadMeasurement("a", false);
  const loadB = store.loadMeasurement("b", false);
  second.resolve(measurement("b"));
  await loadB;
  first.resolve(measurement("a"));
  await loadA;

  assert.equal(store.detail?.measurementId, "b");
  assert.equal(store.detailLoading, false);
});

test("opening another measurement hides the previous one while it loads", async () => {
  service.getMeasurement.mockResolvedValueOnce(measurement("a"));
  const store = useNetDiagMeasurementsStore();
  await store.loadMeasurement("a", false);
  service.getMeasurement.mockReturnValueOnce(deferred<MeasurementDetailDto>().promise);

  void store.loadMeasurement("b", false);

  assert.equal(store.detail, null);
});

test("loading raw samples keeps the current detail visible and records the raw flag", async () => {
  service.getMeasurement.mockResolvedValueOnce(measurement("a"));
  const store = useNetDiagMeasurementsStore();
  await store.loadMeasurement("a", false);
  const raw = deferred<MeasurementDetailDto>();
  service.getMeasurement.mockReturnValueOnce(raw.promise);

  const loading = store.loadMeasurement("a", true);

  assert.equal(store.detail?.measurementId, "a", "same id: nothing to hide while loading");
  assert.equal(store.detailRaw, false);
  raw.resolve(measurement("a"));
  await loading;
  assert.equal(store.detailRaw, true);
  assert.deepEqual(service.getMeasurement.mock.calls.at(-1), ["tok", "a", true]);
});

test("a slower list response for old filters cannot replace the newer list", async () => {
  const first = deferred<{ items: never[]; total: number }>();
  const second = deferred<{ items: never[]; total: number }>();
  service.getMeasurements.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const store = useNetDiagMeasurementsStore();

  const loadOld = store.loadMeasurements({ battleTag: "Old#1234" }, 0, 25);
  const loadNew = store.loadMeasurements({ battleTag: "New#1234" }, 0, 25);
  second.resolve({ items: [], total: 7 });
  await loadNew;
  first.resolve({ items: [], total: 99 });
  await loadOld;

  assert.equal(store.total, 7);
});
