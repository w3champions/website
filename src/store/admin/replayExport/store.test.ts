import { afterEach, beforeEach, test, vi } from "vitest";
import { strict as assert } from "node:assert";
import { createPinia, setActivePinia } from "pinia";

// The services read window._env_ when they load; the suite runs in the node environment.
const { assign } = vi.hoisted(() => {
  const assign = vi.fn();
  vi.stubGlobal("window", {
    _env_: { BASE_URL: "https://api.example.com/", IDENTIFICATION_URL: "https://id.example.com/" },
    location: Object.assign(new URL("https://w3champions.example/replays"), { assign }),
  });
  return { assign };
});

import { adminReplayExportApi } from "@/services/admin/ReplayExportService";
import { HttpError } from "@/services/http/AuthorizedClient";
import ReplayStoreService, { replayStoreApi } from "@/services/ReplayStoreService";
import { useOauthStore } from "@/store/oauth/store";
import { useReplayExportStore } from "./store";
import { SIGN_IN_EXPIRED } from "./errors";
import { EReplayOrderStatus, ReplayCheckout, ReplayExportSummary, ReplayOrder } from "./types";

/** A request that answers when the test says so. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const summary = (id: string) => ({ id }) as ReplayExportSummary;

beforeEach(() => {
  setActivePinia(createPinia());
  useOauthStore().SET_BEARER("token");
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("a history answer of the other mode does not fill this page", async () => {
  const purchases = deferred<ReplayExportSummary[]>();
  vi.spyOn(replayStoreApi, "getHistory").mockReturnValue(purchases.promise);
  vi.spyOn(adminReplayExportApi, "getHistory").mockResolvedValue([summary("admin-download")]);
  const store = useReplayExportStore();

  store.setMode("store");
  const slow = store.loadExports();
  store.setMode("admin");
  await store.loadExports();
  purchases.resolve([summary("purchase")]);
  await slow;

  assert.deepEqual(store.exports.map((e) => e.id), ["admin-download"]);
  assert.equal(store.exportsLoading, false);
});

test("leave drops the answers on the way and resets the loading state", async () => {
  const page = deferred<never[]>();
  vi.spyOn(replayStoreApi, "matches").mockReturnValue(page.promise);
  const store = useReplayExportStore();
  store.setMode("store");

  const loading = store.loadMatches(["a"]);
  assert.equal(store.pagesLoading, 1);
  store.leave();
  page.resolve([]);
  await loading;

  assert.equal(store.pagesLoading, 0, "never below 0");
  assert.equal(store.exports.length, 0);
});

test("a confirm answer after the buyer closed the order does not bring it back", async () => {
  const answer = deferred<ReplayOrder>();
  vi.spyOn(ReplayStoreService, "confirmOrder").mockReturnValue(answer.promise);
  const store = useReplayExportStore();
  store.setMode("store");

  const confirm = store.confirmOrder("o1");
  store.closeOrder();
  answer.resolve({ id: "o1", status: EReplayOrderStatus.Paid } as ReplayOrder);

  assert.deepEqual(await confirm, { error: "", final: false });
  assert.equal(store.order, null);
});

test("confirm gives the error text and keeps the order", async () => {
  vi.spyOn(ReplayStoreService, "confirmOrder").mockRejectedValue(new TypeError("Failed to fetch"));
  const store = useReplayExportStore();
  store.setMode("store");

  assert.deepEqual(await store.confirmOrder("o1"), { error: "Failed to fetch", final: false });
  assert.equal(store.order, null);
  assert.equal(store.error, "", "the page shows it, not the error alert");
});

test("confirm: an error that asking again cannot change is final", async () => {
  const store = useReplayExportStore();
  store.setMode("store");
  const fail = (status: number, body: object) => new HttpError(status, "POST", "confirm", JSON.stringify(body));
  const answers = vi.spyOn(ReplayStoreService, "confirmOrder");

  answers.mockRejectedValueOnce(fail(404, { error: "This order does not exist." }));
  assert.deepEqual(await store.confirmOrder("o1"), { error: "This order does not exist.", final: true });
  answers.mockRejectedValueOnce(fail(401, { error: "AUTH_TOKEN_EXPIRED" }));
  assert.deepEqual(await store.confirmOrder("o1"), { error: SIGN_IN_EXPIRED, final: true });
  answers.mockRejectedValueOnce(fail(502, {}));
  assert.equal((await store.confirmOrder("o1")).final, false, "the server can answer later");
  answers.mockRejectedValueOnce(fail(429, {}));
  assert.equal((await store.confirmOrder("o1")).final, false);
});

test("checkout: no payment page when the user left the page in the meantime", async () => {
  const answer = deferred<ReplayCheckout>();
  vi.spyOn(ReplayStoreService, "checkout").mockReturnValue(answer.promise);
  assign.mockClear();
  const store = useReplayExportStore();
  store.setMode("store");

  const checkout = store.checkout(["a"], "");
  store.leave();
  answer.resolve({ url: "https://checkout.stripe.com/c/pay/cs_test" } as ReplayCheckout);

  assert.equal(await checkout, false);
  assert.equal(assign.mock.calls.length, 0);

  // On the page: the browser goes to Stripe.
  vi.spyOn(ReplayStoreService, "checkout").mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test" } as ReplayCheckout);
  assert.equal(await store.checkout(["a"], ""), true);
  assert.deepEqual(assign.mock.calls, [["https://checkout.stripe.com/c/pay/cs_test"]]);
});
