import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { HardwareSmurfApiError } from "@/services/admin/HardwareSmurfService";
import type { AuditEntry } from "@/services/admin/smurf-detection/HardwareSmurfResponse";

const service = vi.hoisted(() => ({
  getLinks: vi.fn(),
  getItems: vi.fn(),
  getItem: vi.fn(),
  getAudit: vi.fn(),
  setSmurf: vi.fn(),
  revokeSmurf: vi.fn(),
  setNotSmurf: vi.fn(),
  revokeNotSmurf: vi.fn(),
  trustItem: vi.fn(),
  revokeTrust: vi.fn(),
  ignoreItem: vi.fn(),
  revokeIgnore: vi.fn(),
}));

vi.mock("./service", () => ({ hardwareSmurfService: () => service }));
const oauth = vi.hoisted(() => ({ token: "tok" }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => oauth }));

import { AUDIT_PAGE_SIZE, useHardwareSmurfsStore } from "./store";

function entry(id: string): AuditEntry {
  return { id, at: "2026-10-01T10:00:00.000Z", author: "M#1", action: "trust-add", target: { kind: "pair", a: "A#1", b: "B#2" }, accounts: ["A#1"], outcome: {} };
}

const LIVE = { _id: "A#1|B#2", a: "A#1", b: "B#2", source: "hardware", createdAt: "x", lastConfirmedAt: "x", evidence: { matched: [] } };
const TOMB = { ...LIVE, _id: "A#1|C#3", b: "C#3", invalidatedAt: "y", invalidReason: "venue" };

beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
  service.getLinks.mockResolvedValue({ battleTag: "A#1", generation: null, raw: [LIVE, TOMB] });
  service.getItems.mockResolvedValue({ battleTag: "A#1", generation: null, items: [] });
  service.getAudit.mockResolvedValue({ entries: [entry("1")], next: "c1" });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

test("open loads links, items and the first audit page of the account", async () => {
  const store = useHardwareSmurfsStore();

  await store.open("A#1");

  expect(service.getLinks).toHaveBeenCalledWith("tok", "A#1");
  expect(service.getItems).toHaveBeenCalledWith("tok", "A#1");
  expect(service.getAudit).toHaveBeenCalledWith("tok", { battleTag: "A#1", limit: AUDIT_PAGE_SIZE });
  expect(store.liveLinks.map((l) => l._id)).toEqual(["A#1|B#2"]);
  expect(store.tombstones.map((l) => l._id)).toEqual(["A#1|C#3"]);
  expect(store.audit.map((e) => e.id)).toEqual(["1"]);
  expect(store.auditNext).toBe("c1");
});

test("loadMoreAudit appends the next page and stops once next is null", async () => {
  const store = useHardwareSmurfsStore();
  await store.open("A#1");
  service.getAudit.mockResolvedValueOnce({ entries: [entry("2")], next: null });

  await store.loadMoreAudit();

  expect(service.getAudit).toHaveBeenLastCalledWith("tok", { battleTag: "A#1", before: "c1", limit: AUDIT_PAGE_SIZE });
  expect(store.audit.map((e) => e.id)).toEqual(["1", "2"]);
  expect(store.auditNext).toBeNull();

  await store.loadMoreAudit();
  expect(service.getAudit).toHaveBeenCalledTimes(2);
});

test("an account without a hardware profile shows no items and no error", async () => {
  service.getItems.mockRejectedValue(new HardwareSmurfApiError(404, "The account has no hardware profile"));
  const store = useHardwareSmurfsStore();

  await store.open("A#1");

  expect(store.noProfile).toBe(true);
  expect(store.items).toEqual([]);
  expect(store.itemsError).toBeNull();
});

test("a failed links load keeps its error and the other sections load", async () => {
  const failure = new HardwareSmurfApiError(500, "boom");
  service.getLinks.mockRejectedValue(failure);
  const store = useHardwareSmurfsStore();

  await store.open("A#1");

  expect(store.linksError).toBe(failure);
  expect(store.audit).toHaveLength(1);
});

test("an item action sends the trimmed reason, keeps the result and refreshes everything", async () => {
  service.trustItem.mockResolvedValue({ message: "Item trusted; holders queued for a re-check", queued: 3 });
  const store = useHardwareSmurfsStore();
  await store.open("A#1");

  const ok = await store.runAction({ action: "trust", target: { kind: "item", hash8: "0a1b2c3d" }, reason: "  one owner  " });

  expect(ok).toBe(true);
  expect(service.trustItem).toHaveBeenCalledWith("tok", "A#1", "0a1b2c3d", "one owner");
  expect(store.lastResult?.result.queued).toBe(3);
  expect(store.lastResult?.action).toBe("trust");
  expect(service.getLinks).toHaveBeenCalledTimes(2);
  expect(service.getItems).toHaveBeenCalledTimes(2);
  expect(service.getAudit).toHaveBeenCalledTimes(2);
});

test("a pair action calls the route for the shown account and the other one", async () => {
  service.revokeSmurf.mockResolvedValue({ message: "revoked", outcome: "restored" });
  const store = useHardwareSmurfsStore();
  await store.open("A#1");

  await store.runAction({ action: "revoke-smurf", target: { kind: "pair", other: "B#2" }, reason: "" });

  expect(service.revokeSmurf).toHaveBeenCalledWith("tok", "A#1", "B#2");
});

test("an action that needs a reason is not sent without one", async () => {
  const store = useHardwareSmurfsStore();
  await store.open("A#1");

  const ok = await store.runAction({ action: "smurf", target: { kind: "pair", other: "B#2" }, reason: "   " });

  expect(ok).toBe(false);
  expect(service.setSmurf).not.toHaveBeenCalled();
});

test("a refused action keeps the server's error and does not refresh", async () => {
  const failure = new HardwareSmurfApiError(409, "The pair changed meanwhile; read it again");
  service.setNotSmurf.mockRejectedValue(failure);
  const store = useHardwareSmurfsStore();
  await store.open("A#1");

  const ok = await store.runAction({ action: "not-smurf", target: { kind: "pair", other: "B#2" }, reason: "siblings" });

  expect(ok).toBe(false);
  expect(store.actionError).toBe(failure);
  expect(store.lastResult).toBeNull();
  expect(service.getLinks).toHaveBeenCalledTimes(1);
});

test("loadItemDetail fetches the item of the shown account", async () => {
  service.getItem.mockResolvedValue({ kind: "disk", tier: "INTERNAL", hash8: "0a1b2c3d", holders: { count: 5, capped: false }, stat: null, trusted: null, ignored: false });
  const store = useHardwareSmurfsStore();
  await store.open("A#1");

  await store.loadItemDetail("0a1b2c3d");

  expect(service.getItem).toHaveBeenCalledWith("tok", "A#1", "0a1b2c3d");
  expect(store.itemDetail?.holders.count).toBe(5);
});
