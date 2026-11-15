import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { BanApiError } from "@/services/admin/banApiError";
import { tagStatus } from "./fixtures.testing";

const service = vi.hoisted(() => ({ status: vi.fn() }));
vi.mock("@/services/admin/BanAdminService", () => ({ BanAdminService: service }));
const oauth = vi.hoisted(() => ({ token: "tok" }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => oauth }));

import { useBanStatusStore } from "./statusStore";

let store: ReturnType<typeof useBanStatusStore>;
beforeEach(() => {
  vi.resetAllMocks();
  setActivePinia(createPinia());
  store = useBanStatusStore();
});

test("statuses are keyed by the tag as sent", async () => {
  service.status.mockResolvedValue([tagStatus({ battleTag: "тестер#1002", accountKey: "1002" })]);
  expect(await store.load(["тестер#1002"])).toBe(true);
  expect(store.statuses["тестер#1002"]?.accountKey).toBe("1002");
});
test("a status answered under another casing is found under the tag as sent", async () => {
  service.status.mockResolvedValue([tagStatus({ battleTag: "Тестер#1002", accountKey: "1002" })]);
  await store.load(["тестер#1002"]);
  expect(store.statuses["тестер#1002"]?.accountKey).toBe("1002");
});
test("two tags that differ only in case each get their own status", async () => {
  service.status.mockResolvedValue([tagStatus({ battleTag: "Tester#1001", accountKey: "1001" }), tagStatus({ battleTag: "tester#1001", accountKey: "1002" })]);
  await store.load(["Tester#1001", "tester#1001"]);
  expect(store.statuses["Tester#1001"]?.accountKey).toBe("1001");
  expect(store.statuses["tester#1001"]?.accountKey).toBe("1002");
});
test("more than 100 tags go out in batches of 100, duplicates once", async () => {
  service.status.mockImplementation((tags: string[]) => Promise.resolve(tags.map((battleTag) => tagStatus({ battleTag }))));
  const tags = Array.from({ length: 150 }, (_, i) => `Tester#${2000 + i}`);
  await store.load([...tags, "Tester#2000"]);
  expect(service.status.mock.calls.map((c) => c[0].length)).toEqual([100, 50]);
  expect(service.status).toHaveBeenCalledWith(expect.any(Array), "tok");
  expect(Object.keys(store.statuses)).toHaveLength(150);
});
test("a failed load keeps no stale statuses and reports false", async () => {
  service.status.mockResolvedValueOnce([tagStatus()]);
  await store.load(["Tester#1001"]);
  const failure = new BanApiError(502, undefined, "");
  service.status.mockRejectedValueOnce(failure);
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(await store.load(["Tester#1001"])).toBe(false);
  expect(logged).toHaveBeenCalledExactlyOnceWith("Loading the ban status failed:", failure);
  logged.mockRestore();
  expect(store.statuses).toEqual({});
  expect(store.error).toBeInstanceOf(BanApiError);
});
test("no tags, no request", async () => {
  expect(await store.load([])).toBe(true);
  expect(service.status).not.toHaveBeenCalled();
});
