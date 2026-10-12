import { beforeEach, test, vi } from "vitest";
import { strict as assert } from "node:assert";
import { createPinia, setActivePinia } from "pinia";
import type { FleetSelection } from "./fleetSelection";
import type { ObservationDto } from "./types";

const { service } = vi.hoisted(() => ({ service: { getAggregate: vi.fn(), getObservationsUpTo: vi.fn() } }));
vi.mock("./service", () => ({ networkDiagnosticsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import { MAX_MAP_OBSERVATIONS, useNetDiagFleetStore } from "./fleetStore";

type ObservationsResult = { items: ObservationDto[]; truncated: boolean };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const selection = (targetKey: string): FleetSelection => ({ runId: "r1", targetKey, path: "direct", method: "TcpPing" });
const rows = (id: string): ObservationsResult => ({ items: [{ measurementId: id } as ObservationDto], truncated: false });

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

test("a slower response for the previous selection cannot replace the current map", async () => {
  const first = deferred<ObservationsResult>();
  const second = deferred<ObservationsResult>();
  service.getObservationsUpTo.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const store = useNetDiagFleetStore();

  const loadA = store.loadObservations(selection("flo:12"));
  const loadB = store.loadObservations(selection("flo:14"));
  second.resolve(rows("b"));
  await loadB;
  first.resolve(rows("a"));
  await loadA;

  assert.deepEqual(store.observations.map((o) => o.measurementId), ["b"]);
});

test("a new selection clears the previous dots at once; the cap is passed to the service", async () => {
  service.getObservationsUpTo.mockResolvedValueOnce(rows("a"));
  const store = useNetDiagFleetStore();
  await store.loadObservations(selection("flo:12"));
  const pending = deferred<ObservationsResult>();
  service.getObservationsUpTo.mockReturnValueOnce(pending.promise);

  const load = store.loadObservations(selection("flo:14"));

  assert.deepEqual(store.observations, []);
  assert.deepEqual(service.getObservationsUpTo.mock.calls.at(-1), ["tok", { runIds: ["r1"], targetKey: "flo:14", path: "direct", method: "TcpPing" }, MAX_MAP_OBSERVATIONS]);
  pending.resolve({ items: [], truncated: true });
  await load;
  assert.equal(store.observationsTruncated, true);
});

test("the aggregate is requested with the single group key", async () => {
  service.getAggregate.mockResolvedValueOnce({ groupBy: ["asn"], rows: [] });
  const store = useNetDiagFleetStore();

  await store.loadAggregate(selection("flo:12"), "asn");

  assert.deepEqual(service.getAggregate.mock.calls[0][1], ["asn"]);
  assert.deepEqual(store.aggregate, { groupBy: ["asn"], rows: [] });
});

const emptyAggregate = (tag: string) => ({ groupBy: ["country"], rows: [{ key: { country: tag }, count: 1 }] });

test("a slower aggregate for the previous selection cannot replace the current one", async () => {
  const first = deferred<unknown>();
  const second = deferred<unknown>();
  service.getAggregate.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const store = useNetDiagFleetStore();

  const loadA = store.loadAggregate(selection("flo:12"), "country");
  const loadB = store.loadAggregate(selection("flo:14"), "country");
  second.resolve(emptyAggregate("B"));
  await loadB;
  first.resolve(emptyAggregate("A"));
  await loadA;

  assert.deepEqual(store.aggregate, emptyAggregate("B"));
  assert.equal(store.aggregateLoading, false);
});

test("the held keys name the selection the data belongs to", async () => {
  service.getObservationsUpTo.mockResolvedValueOnce(rows("a"));
  service.getAggregate.mockResolvedValueOnce(emptyAggregate("A"));
  const store = useNetDiagFleetStore();

  await store.loadObservations(selection("flo:12"));
  await store.loadAggregate(selection("flo:12"), "asn");

  assert.equal(store.observationsKey, "r1|flo:12|direct|TcpPing");
  assert.equal(store.aggregateKey, "r1|flo:12|direct|TcpPing|asn");
});

test("another group key clears the aggregate before the fetch resolves", async () => {
  service.getAggregate.mockResolvedValueOnce(emptyAggregate("A"));
  const store = useNetDiagFleetStore();
  await store.loadAggregate(selection("flo:12"), "country");
  const pending = deferred<unknown>();
  service.getAggregate.mockReturnValueOnce(pending.promise);

  const load = store.loadAggregate(selection("flo:12"), "asn");

  assert.equal(store.aggregate, null);
  assert.equal(store.aggregateLoading, true);
  pending.resolve(emptyAggregate("B"));
  await load;
});

test("a refresh of the same selection keeps the held data while loading", async () => {
  service.getObservationsUpTo.mockResolvedValueOnce(rows("a"));
  service.getAggregate.mockResolvedValueOnce(emptyAggregate("A"));
  const store = useNetDiagFleetStore();
  await store.loadObservations(selection("flo:12"));
  await store.loadAggregate(selection("flo:12"), "country");
  const pendingObservations = deferred<ObservationsResult>();
  const pendingAggregate = deferred<unknown>();
  service.getObservationsUpTo.mockReturnValueOnce(pendingObservations.promise);
  service.getAggregate.mockReturnValueOnce(pendingAggregate.promise);

  const loads = [store.loadObservations(selection("flo:12")), store.loadAggregate(selection("flo:12"), "country")];

  assert.deepEqual(store.observations.map((o) => o.measurementId), ["a"]);
  assert.deepEqual(store.aggregate, emptyAggregate("A"));
  assert.equal(store.observationsLoading, true);
  pendingObservations.resolve(rows("a2"));
  pendingAggregate.resolve(emptyAggregate("A2"));
  await Promise.all(loads);
  assert.deepEqual(store.observations.map((o) => o.measurementId), ["a2"]);
});

test("a failed load sets the error and another selection clears it", async () => {
  service.getObservationsUpTo.mockRejectedValueOnce(new Error("boom"));
  service.getAggregate.mockRejectedValueOnce(new Error("boom"));
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const store = useNetDiagFleetStore();

  assert.equal(await store.loadObservations(selection("flo:12")), false);
  assert.equal(await store.loadAggregate(selection("flo:12"), "country"), false);
  assert.notEqual(store.observationsError, "");
  assert.notEqual(store.aggregateError, "");

  const pendingObservations = deferred<ObservationsResult>();
  const pendingAggregate = deferred<unknown>();
  service.getObservationsUpTo.mockReturnValueOnce(pendingObservations.promise);
  service.getAggregate.mockReturnValueOnce(pendingAggregate.promise);
  const loads = [store.loadObservations(selection("flo:14")), store.loadAggregate(selection("flo:14"), "country")];
  assert.equal(store.observationsError, "");
  assert.equal(store.aggregateError, "");
  pendingObservations.resolve(rows("b"));
  pendingAggregate.resolve(emptyAggregate("B"));
  await Promise.all(loads);
});

test("clear drops the held data and a load still in flight cannot bring it back", async () => {
  const pending = deferred<ObservationsResult>();
  service.getObservationsUpTo.mockReturnValueOnce(pending.promise);
  const store = useNetDiagFleetStore();
  const load = store.loadObservations(selection("flo:12"));

  store.clear();
  pending.resolve(rows("late"));
  await load;

  assert.deepEqual(store.observations, []);
  assert.equal(store.observationsKey, "");
  assert.equal(store.observationsLoading, false);
});
