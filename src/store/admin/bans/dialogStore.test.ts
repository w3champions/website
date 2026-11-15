import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { BanApiError } from "@/services/admin/banApiError";
import { accountSuggestion, accountView, machineIdRow } from "./fixtures.testing";

const service = vi.hoisted(() => ({
  list: vi.fn(),
  account: vi.fn(),
  machineIds: vi.fn(),
  machineImpact: vi.fn(),
  machineIdAccounts: vi.fn(),
  lookup: vi.fn(),
}));
vi.mock("@/services/admin/BanAdminService", () => ({ BanAdminService: service }));
const oauth = vi.hoisted(() => ({ token: "tok" }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => oauth }));

import { useBanDialogStore } from "./dialogStore";
import { lookupAccounts, playerEntryOf, resolvePlayerEntry } from "./lookup";

function deferred<T = unknown>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

let dialog: ReturnType<typeof useBanDialogStore>;
beforeEach(() => {
  vi.resetAllMocks();
  setActivePinia(createPinia());
  dialog = useBanDialogStore();
});

test("open loads the account view only; machine IDs only with machine access", async () => {
  service.account.mockResolvedValue(accountView());
  service.machineIds.mockResolvedValue([machineIdRow()]);
  await dialog.open("1001", { machineAccess: false });
  expect(service.account).toHaveBeenCalledWith("1001", "tok");
  expect(service.list).not.toHaveBeenCalled();
  expect(service.machineIds).not.toHaveBeenCalled();
  await dialog.open("1001", { machineAccess: true });
  expect(service.machineIds).toHaveBeenCalledWith("1001", "tok");
  expect(dialog.machineRows).toHaveLength(1);
});
test("machine data being unavailable leaves the account view usable", async () => {
  service.account.mockResolvedValue(accountView());
  const failure = new BanApiError(503, "MACHINE_DATA_UNAVAILABLE", "");
  service.machineIds.mockRejectedValue(failure);
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(await dialog.open("1001", { machineAccess: true })).toBe(true);
  expect(logged).toHaveBeenCalledExactlyOnceWith("Failed to load machine IDs:", failure);
  logged.mockRestore();
  expect(dialog.account?.accountKey).toBe("1001");
  expect(dialog.machineRowsError).toBeInstanceOf(BanApiError);
  expect(dialog.contextError).toBeNull();
});
test("a failed account view is the open result and the context error", async () => {
  const failure = new BanApiError(503, "BANS_UNAVAILABLE", "");
  service.account.mockRejectedValue(failure);
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(await dialog.open("1001", { machineAccess: false })).toBe(false);
  expect(logged).toHaveBeenCalledExactlyOnceWith("Failed to load account bans in effect:", failure);
  logged.mockRestore();
  expect(dialog.contextError).toBe(failure);
});
test("an empty selection has no collateral and sends nothing", async () => {
  await dialog.loadImpact([]);
  expect(dialog.impact).toEqual({ otherAccounts: 0, capped: false, counted: 0 });
  expect(service.machineImpact).not.toHaveBeenCalled();
});
test("the newest impact answer wins", async () => {
  service.account.mockResolvedValue(accountView());
  await dialog.open("1001", { machineAccess: false });
  const first = deferred();
  service.machineImpact.mockReturnValueOnce(first.promise).mockResolvedValueOnce({ otherAccounts: 2, capped: false, counted: 1 });
  const a = dialog.loadImpact(["a"]);
  await dialog.loadImpact(["a", "c"]);
  first.resolve({ otherAccounts: 1, capped: false, counted: 1 });
  await a;
  expect(dialog.impact).toEqual({ otherAccounts: 2, capped: false, counted: 1 });
  expect(service.machineImpact).toHaveBeenLastCalledWith("1001", ["a", "c"], "tok");
});
test("a new selection drops the previous impact at once; only the newest selection's answer makes it ready", async () => {
  service.account.mockResolvedValue(accountView());
  await dialog.open("1001", { machineAccess: false });
  service.machineImpact.mockResolvedValueOnce({ otherAccounts: 1, capped: false, counted: 1 });
  await dialog.loadImpact(["a"]);
  expect(dialog.impactReadyFor(["a"])).toBe(true);
  const second = deferred();
  service.machineImpact.mockReturnValueOnce(second.promise);
  const pending = dialog.loadImpact(["c", "a"]);
  expect(dialog.impact).toBeNull();
  expect(dialog.impactReadyFor(["a"])).toBe(false);
  expect(dialog.impactReadyFor(["a", "c"])).toBe(false);
  second.resolve({ otherAccounts: 2, capped: false, counted: 1 });
  await pending;
  expect(dialog.impactReadyFor(["a", "c"])).toBe(true);
});
test("a failed impact is not ready, and a retry that succeeds is", async () => {
  service.account.mockResolvedValue(accountView());
  await dialog.open("1001", { machineAccess: false });
  const failure = new BanApiError(503, "MACHINE_DATA_UNAVAILABLE", "");
  service.machineImpact.mockRejectedValueOnce(failure).mockResolvedValueOnce({ otherAccounts: 0, capped: false, counted: 0 });
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(await dialog.loadImpact(["a"])).toBe(false);
  expect(logged).toHaveBeenCalledExactlyOnceWith("Failed to load machine ban impact:", failure);
  logged.mockRestore();
  expect([dialog.impact, dialog.impactError, dialog.impactReadyFor(["a"])]).toEqual([null, failure, false]);
  expect(await dialog.loadImpact(["a"])).toBe(true);
  expect(dialog.impactReadyFor(["a"])).toBe(true);
});
test("other accounts are loaded per machine ID, excluding the dialog's account", async () => {
  service.account.mockResolvedValue(accountView());
  await dialog.open("1001", { machineAccess: false });
  service.machineIdAccounts.mockResolvedValue({ total: 0, capped: false, accounts: [] });
  await dialog.loadOtherAccounts("aa");
  expect(service.machineIdAccounts).toHaveBeenCalledWith("aa", "1001", "tok");
  expect(dialog.otherAccounts.aa).toEqual({ total: 0, capped: false, accounts: [] });
});
test("clear forgets the account and drops answers still in flight", async () => {
  const pending = deferred();
  service.account.mockReturnValueOnce(pending.promise);
  const opening = dialog.open("1001", { machineAccess: false });
  dialog.clear();
  pending.resolve(accountView());
  await opening;
  expect([dialog.account, dialog.accountKey]).toEqual([null, null]);
});
test("the lookup needs 3 characters and trims", async () => {
  expect(await lookupAccounts(" ab ")).toEqual({ total: 0, results: [] });
  expect(service.lookup).not.toHaveBeenCalled();
  service.lookup.mockResolvedValue({ total: 0, results: [] });
  await lookupAccounts(" abc ");
  expect(service.lookup).toHaveBeenCalledWith("abc", "tok");
});
test("an entry link opens the one account whose name matches, ignoring case", () => {
  const answer = { total: 2, results: [accountSuggestion({ accountKey: "1002", matchedBattleTag: "Тестер#1002" }), accountSuggestion({ accountKey: "1003", matchedBattleTag: "Тестер#10021" })] };
  expect(playerEntryOf("тестер#1002", answer)).toEqual({ kind: "account", accountKey: "1002", matchedBattleTag: "Тестер#1002" });
});
test("an entry link without exactly one matching account fills the lookup instead", () => {
  const twoAccounts = { total: 2, results: [accountSuggestion({ accountKey: "1001", matchedBattleTag: "Tester#1001" }), accountSuggestion({ accountKey: "1002", matchedBattleTag: "tester#1001" })] };
  expect(playerEntryOf("Tester#1001", twoAccounts)).toEqual({ kind: "noSingleMatch", lookupText: "Tester#1001" });
  expect(playerEntryOf("Tester#1001", { total: 1, results: [accountSuggestion({ matchedBattleTag: "Tester#10011" })] })).toEqual({ kind: "noSingleMatch", lookupText: "Tester#1001" });
  expect(playerEntryOf("Tester#1001", { total: 0, results: [] })).toEqual({ kind: "noSingleMatch", lookupText: "Tester#1001" });
});
test("one account matching under two names is still one account", () => {
  const sameAccount = { total: 2, results: [accountSuggestion({ accountKey: "1001", matchedBattleTag: "Tester#1001" }), accountSuggestion({ accountKey: "1001", matchedBattleTag: "tester#1001" })] };
  expect(playerEntryOf("Tester#1001", sameAccount)).toEqual({ kind: "account", accountKey: "1001", matchedBattleTag: "Tester#1001" });
});
test("resolvePlayerEntry asks the lookup with the trimmed name", async () => {
  service.lookup.mockResolvedValue({ total: 1, results: [accountSuggestion()] });
  expect(await resolvePlayerEntry(" Tester#1001 ")).toEqual({ kind: "account", accountKey: "1001", matchedBattleTag: "Tester#1001" });
  expect(service.lookup).toHaveBeenCalledWith("Tester#1001", "tok");
  expect(await resolvePlayerEntry("ab")).toEqual({ kind: "noSingleMatch", lookupText: "ab" });
  expect(service.lookup).toHaveBeenCalledTimes(1);
});
