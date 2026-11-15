import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { BanApiError } from "@/services/admin/banApiError";
import { accountView, banView } from "./fixtures.testing";
import { DEFAULT_PAGE_QUERY, withAccount } from "./listQuery";
import type { CreateBanRequest } from "./types";

const service = vi.hoisted(() => ({ list: vi.fn(), account: vi.fn(), authors: vi.fn(), create: vi.fn(), edit: vi.fn(), revoke: vi.fn() }));
vi.mock("@/services/admin/BanAdminService", () => ({ BanAdminService: service }));
const oauth = vi.hoisted(() => ({ token: "tok" }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => oauth }));

import { useBansStore } from "./store";

const REQUEST: CreateBanRequest = { accountKey: "1001", type: "regular", allGameModes: true, gameModes: [], permanent: true, endDate: null, banReason: "Test reason one" };

function deferred<T = unknown>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

let store: ReturnType<typeof useBansStore>;
beforeEach(() => {
  vi.resetAllMocks();
  setActivePinia(createPinia());
  store = useBansStore();
  // The visit counter lives at module level; a fresh visit keeps tests apart.
  store.clear();
});

test("setQuery loads the page of the log with the mapped request", async () => {
  service.list.mockResolvedValue({ total: 30, bans: [banView()] });
  await store.setQuery({ ...DEFAULT_PAGE_QUERY, status: "inEffect" });
  expect(service.list).toHaveBeenCalledWith({ status: "inEffect", sort: "lastChange", dir: "desc", page: 1, pageSize: 25 }, "tok");
  expect(store.total).toBe(30);
  expect(service.account).not.toHaveBeenCalled();
});
test("an account in the query also loads the account view, and leaving it clears it", async () => {
  service.list.mockResolvedValue({ total: 0, bans: [] });
  service.account.mockResolvedValue(accountView());
  await store.setQuery(withAccount(DEFAULT_PAGE_QUERY, "1001"));
  expect(service.account).toHaveBeenCalledWith("1001", "tok");
  expect(store.account?.accountKey).toBe("1001");
  await store.setQuery(DEFAULT_PAGE_QUERY);
  expect(store.account).toBeNull();
});
test("an older list answer never overwrites a newer one", async () => {
  const first = deferred();
  const second = deferred();
  service.list.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const a = store.setQuery({ ...DEFAULT_PAGE_QUERY, page: 1 });
  const b = store.setQuery({ ...DEFAULT_PAGE_QUERY, page: 2 });
  second.resolve({ total: 1, bans: [banView({ id: "new" })] });
  first.resolve({ total: 1, bans: [banView({ id: "old" })] });
  await Promise.all([a, b]);
  expect(store.bans.map((x) => x.id)).toEqual(["new"]);
});
test("a failed list load is kept as the list error", async () => {
  const failure = new BanApiError(503, "BANS_UNAVAILABLE", "");
  service.list.mockRejectedValue(failure);
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(await store.loadList()).toBe(false);
  expect(logged).toHaveBeenCalledExactlyOnceWith("Failed to load bans:", failure);
  logged.mockRestore();
  expect(store.listError).toBe(failure);
  expect(store.listLoading).toBe(false);
});
test("another account drops the rows before its list loads, so a failed list shows none of them", async () => {
  const failure = new BanApiError(503, "BANS_UNAVAILABLE", "");
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  service.list.mockResolvedValueOnce({ total: 1, bans: [banView({ id: "b2", accountKey: "1002" })] }).mockRejectedValueOnce(failure);
  await store.setQuery(DEFAULT_PAGE_QUERY);
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(await store.setQuery(withAccount(DEFAULT_PAGE_QUERY, "1001"))).toBe(false);
  expect(logged).toHaveBeenCalledExactlyOnceWith("Failed to load bans:", failure);
  logged.mockRestore();
  expect(store.bans).toEqual([]);
  expect(store.total).toBe(0);
  expect(store.listError).toBe(failure);
});
test("the machine filter is sent only while switched on", async () => {
  service.list.mockResolvedValue({ total: 0, bans: [] });
  await store.setMachineOnly(true);
  expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({ machineOnly: true }), "tok");
  await store.setMachineOnly(false);
  expect(service.list.mock.lastCall?.[0]).not.toHaveProperty("machineOnly");
});
test("a revoke replaces the row in place and reloads the account", async () => {
  store.query = withAccount(DEFAULT_PAGE_QUERY, "1001");
  service.account.mockResolvedValue(accountView());
  store.bans = [banView({ id: "a" }), banView({ id: "b" }), banView({ id: "c" })];
  service.revoke.mockResolvedValue(banView({ id: "b", status: "revoked" }));
  expect((await store.revoke("b", "Test note"))?.status).toBe("revoked");
  expect(store.bans.map((x) => [x.id, x.status])).toEqual([["a", "inEffect"], ["b", "revoked"], ["c", "inEffect"]]);
  expect(service.list).not.toHaveBeenCalled();
  expect(service.account).toHaveBeenCalledWith("1001", "tok");
});
test("a version conflict keeps the rows, keeps the error and reloads behind the dialog", async () => {
  service.list.mockResolvedValue({ total: 0, bans: [] });
  service.edit.mockRejectedValue(new BanApiError(409, "BAN_VERSION_CONFLICT", "stale"));
  expect(await store.edit("b", { version: 1, banReason: "x" })).toBeNull();
  expect(store.actionError).toBeInstanceOf(BanApiError);
  expect(store.maybeSaved).toBe(false);
  expect(service.list).toHaveBeenCalledTimes(1);
});
test("a ban that ended meanwhile is refused the same way", async () => {
  service.list.mockResolvedValue({ total: 0, bans: [] });
  service.revoke.mockRejectedValue(new BanApiError(409, "BAN_NOT_IN_EFFECT", "ended"));
  expect(await store.revoke("b", "Test note")).toBeNull();
  expect((store.actionError as BanApiError).code).toBe("BAN_NOT_IN_EFFECT");
  expect(service.list).toHaveBeenCalledTimes(1);
});
test("an edit refused as stale overwrites no row", async () => {
  service.list.mockResolvedValue({ total: 1, bans: [banView({ id: "b", version: 2, banReason: "Test reason two" })] });
  service.edit.mockRejectedValue(new BanApiError(409, "BAN_VERSION_CONFLICT", "stale"));
  store.bans = [banView({ id: "b", version: 1 })];
  await store.edit("b", { version: 1, banReason: "x" });
  expect(store.bans[0].version).toBe(2);
  expect(service.edit).toHaveBeenCalledTimes(1);
});
test("a create that may have been saved says so and reloads the list", async () => {
  service.list.mockResolvedValue({ total: 0, bans: [] });
  service.create.mockRejectedValue(new TypeError("Failed to fetch"));
  expect(await store.create(REQUEST)).toBeNull();
  expect(store.maybeSaved).toBe(true);
  expect(service.list).toHaveBeenCalledTimes(1);
});
test("a create succeeding reloads list and account and returns the view", async () => {
  store.query = withAccount(DEFAULT_PAGE_QUERY, "1001");
  service.list.mockResolvedValue({ total: 1, bans: [banView({ id: "n" })] });
  service.account.mockResolvedValue(accountView());
  service.create.mockResolvedValue(banView({ id: "n" }));
  expect((await store.create(REQUEST))?.id).toBe("n");
  expect(service.list).toHaveBeenCalledTimes(1);
  expect(service.account).toHaveBeenCalledTimes(1);
  expect(service.create).toHaveBeenCalledWith(REQUEST, "tok");
});
test("a refused create changes nothing", async () => {
  service.create.mockRejectedValue(new BanApiError(400, "VALIDATION", "endDate must be in the future"));
  store.bans = [banView()];
  expect(await store.create(REQUEST)).toBeNull();
  expect(store.maybeSaved).toBe(false);
  expect(service.list).not.toHaveBeenCalled();
  expect(store.bans).toHaveLength(1);
});
test("a second write while one is running sends nothing", async () => {
  const pending = deferred();
  service.edit.mockReturnValueOnce(pending.promise);
  service.account.mockResolvedValue(accountView());
  const first = store.edit("b", { version: 1, banReason: "x" });
  expect(await store.edit("b", { version: 1, banReason: "y" })).toBeNull();
  pending.resolve(banView({ id: "b" }));
  await first;
  expect(service.edit).toHaveBeenCalledTimes(1);
  expect(store.acting).toBe(false);
});
test("clearActionError resets the error and the may-have-saved flag", async () => {
  service.list.mockResolvedValue({ total: 0, bans: [] });
  service.create.mockRejectedValue(new TypeError("Failed to fetch"));
  await store.create(REQUEST);
  store.clearActionError();
  expect([store.actionError, store.maybeSaved]).toEqual([null, false]);
});
test("authors load into state", async () => {
  service.authors.mockResolvedValue(["Helper(bot)", "Mod One"]);
  await store.loadAuthors();
  expect(store.authors).toEqual(["Helper(bot)", "Mod One"]);
});
test("the opened row's account loads into its own state; the newest call wins", async () => {
  const first = deferred();
  service.account.mockReturnValueOnce(first.promise).mockResolvedValueOnce(accountView({ accountKey: "1002" }));
  const a = store.loadRowAccount("1001");
  await store.loadRowAccount("1002");
  first.resolve(accountView({ accountKey: "1001" }));
  await a;
  expect(store.rowAccount?.accountKey).toBe("1002");
  expect(store.account).toBeNull();
});
test("Edit that ban instead finds the ban among the account's bans in effect", async () => {
  service.list.mockResolvedValue({ total: 2, bans: [banView({ id: "a" }), banView({ id: "b" })] });
  expect((await store.banInEffect("1001", "b"))?.id).toBe("b");
  expect(service.list).toHaveBeenCalledWith({ account: "1001", status: "inEffect", sort: "accountDefault", page: 1, pageSize: 100 }, "tok");
  expect(await store.banInEffect("1001", "zz")).toBeNull();
  expect(store.bans).toEqual([]);
});
test("Edit that ban instead passes a failed request on", async () => {
  const failure = new BanApiError(503, "BANS_UNAVAILABLE", "");
  service.list.mockRejectedValue(failure);
  await expect(store.banInEffect("1001", "b")).rejects.toBe(failure);
});
test("clear drops an answer that arrives after it", async () => {
  const pending = deferred();
  service.list.mockReturnValueOnce(pending.promise);
  const load = store.loadList();
  store.clear();
  pending.resolve({ total: 1, bans: [banView({ id: "late" })] });
  await load;
  expect(store.bans).toEqual([]);
});
test("an edit supersedes a list load still in flight, so the old answer is not applied", async () => {
  const oldList = deferred();
  service.list.mockReturnValueOnce(oldList.promise).mockResolvedValueOnce({ total: 1, bans: [banView({ id: "b", version: 2 })] });
  service.edit.mockResolvedValue(banView({ id: "b", version: 2 }));
  service.account.mockResolvedValue(accountView());
  store.bans = [banView({ id: "b", version: 1 })];
  const loading = store.loadList();
  await store.edit("b", { version: 1, banReason: "x" });
  oldList.resolve({ total: 1, bans: [banView({ id: "b", version: 1, banReason: "stale" })] });
  await loading;
  expect(store.bans.map((x) => [x.id, x.version])).toEqual([["b", 2]]);
});
test("a write refreshes the opened row's account line, also while it is still loading", async () => {
  service.edit.mockResolvedValue(banView({ id: "b" }));
  service.account.mockResolvedValueOnce(accountView({ accountKey: "1001", currentBattleTag: "Tester#1001" }));
  await store.loadRowAccount("1001");
  service.account.mockResolvedValueOnce(accountView({ accountKey: "1001", currentBattleTag: "Tester#fresh" }));
  await store.edit("b", { version: 1, banReason: "x" });
  expect(store.rowAccount?.currentBattleTag).toBe("Tester#fresh");

  const stale = deferred();
  service.account.mockReturnValueOnce(stale.promise).mockResolvedValueOnce(accountView({ accountKey: "1001", currentBattleTag: "Tester#newest" }));
  store.clear();
  const loading = store.loadRowAccount("1001");
  await store.edit("b", { version: 1, banReason: "y" });
  stale.resolve(accountView({ accountKey: "1001", currentBattleTag: "Tester#old" }));
  await loading;
  expect(store.rowAccount?.currentBattleTag).toBe("Tester#newest");
});
test("a conflict also refreshes the opened row's account line", async () => {
  service.list.mockResolvedValue({ total: 0, bans: [] });
  service.account.mockResolvedValue(accountView());
  service.edit.mockRejectedValue(new BanApiError(409, "BAN_VERSION_CONFLICT", "stale"));
  await store.loadRowAccount("1001");
  service.account.mockClear();
  await store.edit("b", { version: 1, banReason: "x" });
  expect(service.account).toHaveBeenCalledWith("1001", "tok");
});
