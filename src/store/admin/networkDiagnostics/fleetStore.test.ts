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
