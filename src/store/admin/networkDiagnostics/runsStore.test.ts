import { beforeEach, test, vi } from "vitest";
import { strict as assert } from "node:assert";
import { createPinia, setActivePinia } from "pinia";
import { HttpError } from "@/services/http/AuthorizedClient";
import type { RunDetailDto, RunDto } from "./types";

const { service } = vi.hoisted(() => ({
  service: { getRun: vi.fn(), getRuns: vi.fn(), getTargets: vi.fn(), createRun: vi.fn(), cancelRun: vi.fn() },
}));
vi.mock("./service", () => ({ networkDiagnosticsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import { useNetDiagRunsStore } from "./runsStore";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function detail(id: string): RunDetailDto {
  return { run: { id } as RunDto, assignments: [] };
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

test("a slower load of the previous run cannot replace the run navigated to", async () => {
  const first = deferred<RunDetailDto>();
  const second = deferred<RunDetailDto>();
  service.getRun.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const store = useNetDiagRunsStore();

  const loadA = store.loadRun("a");
  const loadB = store.loadRun("b");
  second.resolve(detail("b"));
  await loadB;
  first.resolve(detail("a"));
  await loadA;

  assert.equal(store.runDetail?.run.id, "b");
  assert.equal(store.runLoading, false);
});

test("switching to another run hides the previous one at once", async () => {
  service.getRun.mockResolvedValueOnce(detail("a"));
  const store = useNetDiagRunsStore();
  await store.loadRun("a");
  const pending = deferred<RunDetailDto>();
  service.getRun.mockReturnValueOnce(pending.promise);

  const loadB = store.loadRun("b");

  assert.equal(store.runDetail, null);
  assert.equal(store.runLoading, true);
  pending.resolve(detail("b"));
  await loadB;
});

test("a failed load shows a readable error", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  service.getRun.mockRejectedValueOnce(new HttpError(404, "GET", "u", ""));
  const store = useNetDiagRunsStore();

  const ok = await store.loadRun("missing");

  assert.equal(ok, false);
  assert.equal(store.runError, "Not found.");
  assert.equal(store.runDetail, null);
});

test("the target catalogue is fetched once", async () => {
  service.getTargets.mockResolvedValue({ floNodes: [], coreServers: [], baselines: [] });
  const store = useNetDiagRunsStore();

  await store.loadTargets();
  await store.loadTargets();

  assert.equal(service.getTargets.mock.calls.length, 1);
});

test("cancelling run A and moving to run B before the cancel settles leaves B on screen", async () => {
  const cancel = deferred<RunDto>();
  service.cancelRun.mockReturnValueOnce(cancel.promise);
  service.getRun.mockResolvedValueOnce(detail("b"));
  const store = useNetDiagRunsStore();

  const cancelling = store.cancelRun("a");
  await store.loadRun("b");
  cancel.resolve({ id: "a" } as RunDto);
  const cancelled = await cancelling;

  assert.equal(cancelled.id, "a");
  assert.equal(store.runDetail?.run.id, "b");
  assert.equal(store.runLoading, false);
  assert.equal(store.runError, "");
  assert.deepEqual(service.getRun.mock.calls.map((call) => call[1]), ["b"], "the store must not reload the cancelled run itself");
});

test("a failed cancel throws and leaves the displayed run untouched", async () => {
  service.getRun.mockResolvedValueOnce(detail("a"));
  const store = useNetDiagRunsStore();
  await store.loadRun("a");
  service.cancelRun.mockRejectedValueOnce(new HttpError(409, "POST", "u", ""));

  await assert.rejects(store.cancelRun("a"), HttpError);

  assert.equal(store.runDetail?.run.id, "a");
  assert.equal(service.getRun.mock.calls.length, 1);
});

test("a slower runs page cannot replace the newer one", async () => {
  const first = deferred<{ items: RunDto[]; total: number }>();
  const second = deferred<{ items: RunDto[]; total: number }>();
  service.getRuns.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const store = useNetDiagRunsStore();

  const loadOld = store.loadRuns({ page: 0, pageSize: 25 });
  const loadNew = store.loadRuns({ page: 1, pageSize: 25 });
  second.resolve({ items: [{ id: "new" } as RunDto], total: 30 });
  await loadNew;
  first.resolve({ items: [{ id: "old" } as RunDto], total: 99 });
  await loadOld;

  assert.deepEqual(store.runs.map((run) => run.id), ["new"]);
  assert.equal(store.total, 30);
  assert.equal(store.runsLoading, false);
});
