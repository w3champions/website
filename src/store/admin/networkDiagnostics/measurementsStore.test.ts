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

test("a slower raw load of the previous measurement cannot replace the one navigated to", async () => {
  const rawA = deferred<MeasurementDetailDto>();
  service.getMeasurement.mockReturnValueOnce(rawA.promise).mockResolvedValueOnce(measurement("b"));
  const store = useNetDiagMeasurementsStore();

  const loadA = store.loadMeasurement("a", true);
  await store.loadMeasurement("b", false);
  rawA.resolve(measurement("a"));
  await loadA;

  assert.equal(store.detail?.measurementId, "b");
  assert.equal(store.detailRaw, false);
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
  const first = deferred<unknown>();
  const second = deferred<unknown>();
  service.getMeasurements.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const store = useNetDiagMeasurementsStore();

  const loadOld = store.loadMeasurements({ battleTag: "Old#1234" }, 0, 25);
  const loadNew = store.loadMeasurements({ battleTag: "New#1234" }, 0, 25);
  second.resolve({ data: { items: [], total: 7 }, truncated: false });
  await loadNew;
  first.resolve({ data: { items: [], total: 99 }, truncated: false });
  await loadOld;

  assert.equal(store.total, 7);
});

test("a truncated list is flagged; the next complete list and a failure clear the flag", async () => {
  service.getMeasurements.mockResolvedValueOnce({ data: { items: [], total: 3 }, truncated: true });
  const store = useNetDiagMeasurementsStore();

  await store.loadMeasurements({ targetKey: "flo:1" }, 0, 25);
  assert.equal(store.listTruncated, true);
  assert.equal(store.total, 3);

  service.getMeasurements.mockResolvedValueOnce({ data: { items: [], total: 3 }, truncated: false });
  await store.loadMeasurements({ targetKey: "flo:1" }, 0, 25);
  assert.equal(store.listTruncated, false);

  service.getMeasurements.mockResolvedValueOnce({ data: { items: [], total: 3 }, truncated: true });
  await store.loadMeasurements({}, 0, 25);
  service.getMeasurements.mockRejectedValueOnce(new Error("boom"));
  const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
  await store.loadMeasurements({}, 0, 25);
  logged.mockRestore();
  assert.equal(store.listTruncated, false);
});
