import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { HttpError } from "@/services/http/AuthorizedClient";
import { allocationMaybeCreatedText, MAYBE_SAVED_RELOAD_FAILED_TEXT, MAYBE_SAVED_TEXT } from "./errors";

const service = vi.hoisted(() => ({
  getEvents: vi.fn(),
  createEvent: vi.fn(),
  getEvent: vi.fn(),
  updateEvent: vi.fn(),
  moveEvent: vi.fn(),
  closeEvent: vi.fn(),
  suspendEvent: vi.fn(),
  unsuspendEvent: vi.fn(),
  addEventPerson: vi.fn(),
  removeEventPerson: vi.fn(),
  getAllocations: vi.fn(),
  getAllocationPeriods: vi.fn(),
  createAllocation: vi.fn(),
  updateAllocation: vi.fn(),
  addAllocationMember: vi.fn(),
  removeAllocationMember: vi.fn(),
  endAllocation: vi.fn(),
  deleteAllocation: vi.fn(),
  getAudit: vi.fn(),
  resolveMatchPageId: vi.fn(),
  getActiveGames: vi.fn(),
  terminateGame: vi.fn(),
}));

vi.mock("./service", () => ({ commercialEventsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import { useCommercialEventActiveGamesStore } from "./activeGamesStore";
import { useCommercialEventAllocationsStore } from "./allocationsStore";
import { useCommercialEventDetailStore } from "./eventDetailStore";
import { useCommercialEventsStore } from "./eventsStore";

beforeEach(() => {
  setActivePinia(createPinia());
  // Reset, not clear: an implementation set by one test must not leak into the next.
  vi.resetAllMocks();
  service.getAudit.mockResolvedValue([]);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

test("a 504 on event create reloads the list and tells the admin to check it", async () => {
  service.createEvent.mockRejectedValue(new HttpError(504, "POST", "https://x", ""));
  service.getEvents.mockResolvedValue([{ id: "e1" }]);
  const store = useCommercialEventsStore();

  const result = await store.create({ allocationId: "a1", name: "Cup" } as never);

  expect(result).toBeNull();
  expect(store.error).toBe(MAYBE_SAVED_TEXT);
  await vi.waitFor(() => expect(store.events).toEqual([{ id: "e1" }]));
  expect(service.getEvents).toHaveBeenCalledTimes(1);
});

test("a validation error on event create does not reload", async () => {
  service.createEvent.mockRejectedValue(new HttpError(400, "POST", "https://x", JSON.stringify({ code: "INVALID_FIELD", field: "name", rule: "too-long" })));
  const store = useCommercialEventsStore();

  await store.create({ allocationId: "a1", name: "Cup" } as never);

  expect(service.getEvents).not.toHaveBeenCalled();
  expect(store.error).toBe("Name: Use at most 32 characters.");
});

test("a state conflict on an event write keeps its message and reloads the shown event before saving clears", async () => {
  const reload = deferred<unknown>();
  service.suspendEvent.mockRejectedValue(new HttpError(409, "POST", "https://x", JSON.stringify({ code: "EVENT_CLOSED" })));
  service.getEvent.mockReturnValueOnce(reload.promise);
  const detail = useCommercialEventDetailStore();
  detail.eventId = "e1";
  const store = useCommercialEventsStore();

  const suspending = store.suspend("e1", {} as never);
  await vi.waitFor(() => expect(service.getEvent).toHaveBeenCalledTimes(1));
  expect(store.saving).toBe(true);
  reload.resolve({ id: "e1", status: "closed" });
  expect(await suspending).toBeNull();

  expect(store.error).toBe("This event is closed. Closed events can't be changed.");
  expect(detail.event).toEqual({ id: "e1", status: "closed" });
  expect(service.getAudit).toHaveBeenCalledTimes(1);
});

test("a refused move onto an allocation that changed reloads the allocations too", async () => {
  service.moveEvent.mockRejectedValue(new HttpError(409, "POST", "https://x", JSON.stringify({ code: "ALLOCATION_INACTIVE" })));
  service.getEvents.mockResolvedValue([]);
  service.getAllocations.mockResolvedValue([{ id: "a2" }]);
  const allocations = useCommercialEventAllocationsStore();
  const store = useCommercialEventsStore();

  await store.move("e1", "a1");

  expect(store.error).toContain("Only an active allocation");
  expect(service.getEvents).toHaveBeenCalledTimes(1);
  expect(allocations.allocations).toEqual([{ id: "a2" }]);
});

test("validation and permission refusals are not state conflicts", async () => {
  service.addAllocationMember.mockRejectedValue(new HttpError(400, "PUT", "https://x", JSON.stringify({ code: "UNKNOWN_BATTLE_TAG", data: { battleTag: "X#1" } })));
  const store = useCommercialEventAllocationsStore();

  await store.addMember("a1", "X#1");

  expect(service.getAllocations).not.toHaveBeenCalled();
});

test("a member add refused because the account already has a role reloads the allocations", async () => {
  service.addAllocationMember.mockRejectedValue(new HttpError(409, "PUT", "https://x", JSON.stringify({ code: "ROLE_EXISTS", data: { battleTag: "X#1", role: "member" } })));
  service.getAllocations.mockResolvedValue([]);
  const store = useCommercialEventAllocationsStore();

  await store.addMember("a1", "X#1");

  expect(service.getAllocations).toHaveBeenCalledTimes(1);
  expect(store.error).toContain("X#1");
});

test("a 500 on allocation create reloads the list; a stale older load cannot overwrite it", async () => {
  let resolveOld: (value: unknown[]) => void = () => undefined;
  service.getAllocations.mockReturnValueOnce(new Promise((resolve) => (resolveOld = resolve)));
  service.getAllocations.mockResolvedValueOnce([{ id: "a-saved" }]);
  service.createAllocation.mockRejectedValue(new HttpError(500, "POST", "https://x", ""));
  const store = useCommercialEventAllocationsStore();

  const oldLoad = store.load();
  await store.create({ name: "Spring" } as never);
  await vi.waitFor(() => expect(store.allocations).toEqual([{ id: "a-saved" }]));
  resolveOld([]);
  await oldLoad;

  expect(store.error).toBe(MAYBE_SAVED_TEXT);
  expect(store.allocations).toEqual([{ id: "a-saved" }]);
});

const gatewayTimeout = () => new HttpError(504, "POST", "https://x", "");

test.each([
  ["update", (s: ReturnType<typeof useCommercialEventsStore>) => s.update("e1", {}), service.updateEvent],
  ["move", (s: ReturnType<typeof useCommercialEventsStore>) => s.move("e1", "a1"), service.moveEvent],
  ["close", (s: ReturnType<typeof useCommercialEventsStore>) => s.close("e1"), service.closeEvent],
  ["suspend", (s: ReturnType<typeof useCommercialEventsStore>) => s.suspend("e1", {} as never), service.suspendEvent],
  ["unsuspend", (s: ReturnType<typeof useCommercialEventsStore>) => s.unsuspend("e1"), service.unsuspendEvent],
])("a 504 on event %s on its detail page reloads the event and its audit log", async (_name, run, write) => {
  write.mockRejectedValue(gatewayTimeout());
  service.getEvent.mockResolvedValue({ id: "e1" });
  const detail = useCommercialEventDetailStore();
  detail.eventId = "e1";
  const store = useCommercialEventsStore();

  await run(store);

  expect(store.error).toBe(MAYBE_SAVED_TEXT);
  expect(service.getEvent).toHaveBeenCalledTimes(1);
  expect(service.getAudit).toHaveBeenCalledTimes(1);
  // The list is not on screen; its page reloads it when it opens.
  expect(service.getEvents).not.toHaveBeenCalled();
});

test("a 504 on an event write on the list page reloads the list", async () => {
  service.closeEvent.mockRejectedValue(gatewayTimeout());
  service.getEvents.mockResolvedValue([{ id: "e1" }]);
  const store = useCommercialEventsStore();

  await store.close("e1");

  expect(store.error).toBe(MAYBE_SAVED_TEXT);
  expect(store.events).toEqual([{ id: "e1" }]);
  expect(service.getEvent).not.toHaveBeenCalled();
});

test("a write that settles after its page was left reports nothing there", async () => {
  const write = deferred<unknown>();
  service.closeEvent.mockReturnValueOnce(write.promise);
  const store = useCommercialEventsStore();

  const closing = store.close("e1");
  store.endVisit();
  write.reject(new HttpError(409, "POST", "https://x", JSON.stringify({ code: "EVENT_CLOSED" })));
  await closing;

  expect(store.error).toBe("");
  expect(store.saving).toBe(false);
});

test("a superseded list reload keeps saving until the newest load has answered", async () => {
  const older = deferred<unknown[]>();
  const newer = deferred<unknown[]>();
  service.createAllocation.mockRejectedValue(gatewayTimeout());
  service.getAllocations.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
  const store = useCommercialEventAllocationsStore();

  const creating = store.create({ name: "Spring" } as never);
  await vi.waitFor(() => expect(service.getAllocations).toHaveBeenCalledTimes(1));
  // The admin reloads meanwhile: a newer list load supersedes the write's reload.
  void store.load();
  older.resolve([{ id: "a-old" }]);
  await vi.waitFor(() => expect(service.getAllocations).toHaveBeenCalledTimes(2));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(store.saving).toBe(true);

  newer.resolve([{ id: "a-new" }]);
  await creating;
  expect(store.saving).toBe(false);
  expect(store.allocations).toEqual([{ id: "a-new" }]);
  expect(store.error).toBe(MAYBE_SAVED_TEXT);
});

test.each([
  ["update", (s: ReturnType<typeof useCommercialEventAllocationsStore>) => s.update("a1", {}), service.updateAllocation],
  ["addMember", (s: ReturnType<typeof useCommercialEventAllocationsStore>) => s.addMember("a1", "Tag#1"), service.addAllocationMember],
  ["removeMember", (s: ReturnType<typeof useCommercialEventAllocationsStore>) => s.removeMember("a1", "Tag#1"), service.removeAllocationMember],
  ["end", (s: ReturnType<typeof useCommercialEventAllocationsStore>) => s.end("a1"), service.endAllocation],
  ["remove", (s: ReturnType<typeof useCommercialEventAllocationsStore>) => s.remove("a1"), service.deleteAllocation],
])("a 504 on allocation %s reloads the list", async (_name, run, write) => {
  write.mockRejectedValue(gatewayTimeout());
  service.getAllocations.mockResolvedValue([]);
  const store = useCommercialEventAllocationsStore();

  await run(store);

  expect(store.error).toBe(MAYBE_SAVED_TEXT);
  await vi.waitFor(() => expect(service.getAllocations).toHaveBeenCalledTimes(1));
});

test("a 504 on an event person write reloads the event and its audit log", async () => {
  service.addEventPerson.mockRejectedValue(gatewayTimeout());
  service.getEvent.mockResolvedValue({ id: "e1" });
  service.getAudit.mockResolvedValue([]);
  const store = useCommercialEventDetailStore();
  store.eventId = "e1";

  expect(await store.addPerson("Tag#1", "host")).toBe(false);

  expect(store.error).toBe(MAYBE_SAVED_TEXT);
  await vi.waitFor(() => expect(service.getEvent).toHaveBeenCalledTimes(1));
  expect(service.getAudit).toHaveBeenCalledTimes(1);
});

/** A promise whose resolution the test controls. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: unknown) => void } {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("a list load in flight during an allocation delete cannot bring the deleted row back", async () => {
  const old = deferred<unknown[]>();
  service.getAllocations.mockReturnValueOnce(old.promise);
  service.getAllocations.mockResolvedValueOnce([{ id: "a2" }]);
  service.deleteAllocation.mockResolvedValue(undefined);
  const store = useCommercialEventAllocationsStore();
  store.allocations = [{ id: "a1" }, { id: "a2" }] as never;

  const oldLoad = store.load();
  expect(await store.remove("a1")).toBe(true);
  old.resolve([{ id: "a1" }, { id: "a2" }]);
  await oldLoad;

  await vi.waitFor(() => expect(store.loading).toBe(false));
  expect(store.allocations).toEqual([{ id: "a2" }]);
});

test("a list load in flight during an allocation update cannot restore the old row", async () => {
  const old = deferred<unknown[]>();
  service.getAllocations.mockReturnValueOnce(old.promise);
  service.getAllocations.mockResolvedValueOnce([{ id: "a1", name: "new" }]);
  service.updateAllocation.mockResolvedValue({ id: "a1", name: "new" });
  const store = useCommercialEventAllocationsStore();
  store.allocations = [{ id: "a1", name: "old" }] as never;

  const oldLoad = store.load();
  await store.update("a1", {});
  old.resolve([{ id: "a1", name: "old" }]);
  await oldLoad;

  await vi.waitFor(() => expect(store.loading).toBe(false));
  expect(store.allocations).toEqual([{ id: "a1", name: "new" }]);
});

test("an events list load in flight during an event write cannot restore the old row", async () => {
  const old = deferred<unknown[]>();
  service.getEvents.mockReturnValueOnce(old.promise);
  service.getEvents.mockResolvedValueOnce([{ id: "e1", status: "closed" }]);
  service.closeEvent.mockResolvedValue({ id: "e1", status: "closed" });
  const store = useCommercialEventsStore();
  store.events = [{ id: "e1", status: "open" }] as never;

  const oldLoad = store.load();
  await store.close("e1");
  old.resolve([{ id: "e1", status: "open" }]);
  await oldLoad;

  await vi.waitFor(() => expect(store.loading).toBe(false));
  expect(store.events).toEqual([{ id: "e1", status: "closed" }]);
});

test("an event load in flight during a person write cannot restore the old people", async () => {
  const old = deferred<unknown>();
  service.getEvent.mockReturnValueOnce(old.promise);
  service.getEvent.mockResolvedValueOnce({ id: "e1", hosts: [{ battleTag: "Tag#1" }] });
  service.addEventPerson.mockResolvedValue({ hosts: [{ battleTag: "Tag#1" }] });
  const store = useCommercialEventDetailStore();
  store.eventId = "e1";
  store.event = { id: "e1", hosts: [] } as never;

  const oldLoad = store.loadEvent();
  expect(await store.addPerson("Tag#1", "host")).toBe(true);
  old.resolve({ id: "e1", hosts: [] });
  await oldLoad;

  await vi.waitFor(() => expect(store.loading).toBe(false));
  expect(store.event).toEqual({ id: "e1", hosts: [{ battleTag: "Tag#1" }] });
});

test("a failed reload after an uncertain allocation write says the list couldn't be reloaded", async () => {
  service.createAllocation.mockRejectedValue(new TypeError("Failed to fetch"));
  service.getAllocations.mockRejectedValue(new TypeError("Failed to fetch"));
  const store = useCommercialEventAllocationsStore();

  expect(await store.create({ name: "Spring" } as never)).toBeNull();

  expect(store.error).toBe(MAYBE_SAVED_RELOAD_FAILED_TEXT);
  expect(store.saving).toBe(false);
});

test("a failed reload of the shown event after an uncertain event write says the list couldn't be reloaded", async () => {
  service.updateEvent.mockRejectedValue(gatewayTimeout());
  service.getEvents.mockResolvedValue([]);
  service.getEvent.mockRejectedValue(gatewayTimeout());
  const detail = useCommercialEventDetailStore();
  detail.eventId = "e1";
  const store = useCommercialEventsStore();

  await store.update("e1", {});

  expect(store.error).toBe(MAYBE_SAVED_RELOAD_FAILED_TEXT);
});

test("a person write for an event no longer shown leaves the shown event alone", async () => {
  const write = deferred<unknown>();
  service.addEventPerson.mockReturnValueOnce(write.promise);
  const store = useCommercialEventDetailStore();
  store.eventId = "e1";
  store.event = { id: "e1", hosts: [] } as never;

  const adding = store.addPerson("Tag#1", "host");
  store.clear();
  store.eventId = "e2";
  store.event = { id: "e2", hosts: [] } as never;
  write.reject(gatewayTimeout());
  await adding;

  expect(store.error).toBe("");
  expect(store.event).toEqual({ id: "e2", hosts: [] });
  // The write was for e1: the page showing e2 has nothing to reload.
  expect(service.getEvent).not.toHaveBeenCalled();
});

test("showing another event keeps a pending people write marked until it settles", async () => {
  const write = deferred<unknown>();
  service.addEventPerson.mockReturnValueOnce(write.promise);
  const store = useCommercialEventDetailStore();
  store.eventId = "e1";
  store.event = { id: "e1", hosts: [] } as never;

  const adding = store.addPerson("Tag#1", "host");
  store.clear();
  store.eventId = "e2";

  expect(store.saving).toBe(true);
  write.resolve({ hosts: [{ battleTag: "Tag#1" }] });
  await adding;
  expect(store.saving).toBe(false);
});

test("a terminate during a list load replaces that load with a fresh one", async () => {
  const old = deferred<unknown[]>();
  service.getActiveGames.mockReturnValueOnce(old.promise);
  service.getActiveGames.mockResolvedValueOnce([{ matchId: "m2" }, { matchId: "m4" }]);
  service.terminateGame.mockResolvedValue(undefined);
  const store = useCommercialEventActiveGamesStore();
  store.games = [{ matchId: "m1" }, { matchId: "m2" }] as never;

  const oldLoad = store.load();
  expect(await store.terminate("m1")).toBe(true);
  old.resolve([{ matchId: "m1" }, { matchId: "m2" }, { matchId: "m3" }]);
  await oldLoad;

  await vi.waitFor(() => expect(store.loading).toBe(false));
  expect(store.games).toEqual([{ matchId: "m2" }, { matchId: "m4" }]);
});

test("an uncertain terminate keeps saving until the list is reloaded, once", async () => {
  const reload = deferred<unknown[]>();
  service.terminateGame.mockRejectedValue(gatewayTimeout());
  service.getActiveGames.mockReturnValueOnce(reload.promise);
  const store = useCommercialEventActiveGamesStore();

  const terminating = store.terminate("m1");
  await vi.waitFor(() => expect(service.getActiveGames).toHaveBeenCalledTimes(1));
  expect(store.saving).toBe(true);
  reload.resolve([{ matchId: "m2" }]);
  expect(await terminating).toBe(false);

  expect(store.saving).toBe(false);
  expect(store.error).toBe(MAYBE_SAVED_TEXT);
  expect(store.games).toEqual([{ matchId: "m2" }]);
  expect(service.getActiveGames).toHaveBeenCalledTimes(1);
});

test("a match-page lookup that answers after the same event was reopened is dropped", async () => {
  const old = deferred<string | null>();
  const current = deferred<string | null>();
  service.resolveMatchPageId.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
  const store = useCommercialEventDetailStore();
  store.eventId = "e1";

  const stale = store.resolveMatchPage("m1");
  store.clear();
  store.eventId = "e1";
  const fresh = store.resolveMatchPage("m2");
  old.resolve(null);

  expect(await stale).toBeNull();
  // Neither the old "no match page" error nor the end of the old lookup reaches the new visit.
  expect(store.matchLinkError).toBe("");
  expect(store.resolvingMatchId).toBe("m2");
  current.resolve("website-id");
  expect(await fresh).toBe("website-id");
});

test("a people write that settles after the same event was reopened leaves the new visit alone", async () => {
  const write = deferred<unknown>();
  service.addEventPerson.mockReturnValueOnce(write.promise);
  const store = useCommercialEventDetailStore();
  store.eventId = "e1";
  store.event = { id: "e1", hosts: [] } as never;

  const adding = store.addPerson("Tag#1", "host");
  store.clear();
  store.eventId = "e1";
  store.event = { id: "e1", hosts: [] } as never;
  write.reject(gatewayTimeout());
  await adding;

  // Nothing reported into the new visit, but it reloads: the write may have been saved.
  expect(store.error).toBe("");
  await vi.waitFor(() => expect(service.getEvent).toHaveBeenCalledTimes(1));
  expect(service.getAudit).toHaveBeenCalledTimes(1);
});

test("taking an event write reloads the audit log", () => {
  service.getAudit.mockResolvedValue([{ action: "event-updated" }]);
  const store = useCommercialEventDetailStore();
  store.eventId = "e1";

  store.applyEvent({ id: "e1" } as never, store.visitToken());

  expect(store.event).toEqual({ id: "e1" });
  expect(service.getAudit).toHaveBeenCalledTimes(1);
});

test("an event write begun in an earlier visit of the same event is not taken", () => {
  const store = useCommercialEventDetailStore();
  store.eventId = "e1";
  const visit = store.visitToken();
  store.clear();
  store.eventId = "e1";

  store.applyEvent({ id: "e1", name: "old answer" } as never, visit);

  expect(store.event).toBeNull();
  expect(service.getAudit).not.toHaveBeenCalled();
});

test("leaving a page hides its last write error when it is shown again", async () => {
  service.deleteAllocation.mockRejectedValue(new HttpError(409, "DELETE", "https://x", JSON.stringify({ code: "ALLOCATION_IN_USE" })));
  const store = useCommercialEventAllocationsStore();
  await store.remove("a1");
  expect(store.error).not.toBe("");

  store.endVisit();

  expect(store.error).toBe("");
});

test("a terminate that fails after the page was left reports nothing, and reloads the list on a state conflict", async () => {
  const write = deferred<unknown>();
  service.terminateGame.mockReturnValueOnce(write.promise);
  const store = useCommercialEventActiveGamesStore();

  const terminating = store.terminate("m1");
  store.endVisit();
  write.reject(new HttpError(404, "POST", "https://x", JSON.stringify({ code: "UNKNOWN_GAME" })));
  expect(await terminating).toBe(false);

  expect(store.error).toBe("");
  await vi.waitFor(() => expect(service.getActiveGames).toHaveBeenCalledTimes(1));
});

test("an uncertain event create replaces the filters with a search sure to list the event, and says so", async () => {
  service.createEvent.mockRejectedValue(new HttpError(524, "POST", "https://x", ""));
  service.getEvents.mockResolvedValue([{ id: "EV-NEW1", name: "Spring Cup" }]);
  const store = useCommercialEventsStore();
  store.filters = { status: "suspended", phase: "", allocationId: "a-other", q: "zzz" };

  await store.create({ allocationId: "a1", name: " Spring Cup " } as never);

  expect(store.error).toBe(MAYBE_SAVED_TEXT);
  expect(store.filters).toEqual({ status: "", phase: "", allocationId: "a1", q: "Spring Cup" });
  expect(service.getEvents).toHaveBeenCalledWith("tok", { status: "", phase: "", allocationId: "a1", q: "Spring Cup" });
  expect(store.events).toEqual([{ id: "EV-NEW1", name: "Spring Cup" }]);
  expect(store.filterNotice).toContain("Spring Cup");

  store.filtersChanged();
  expect(store.filterNotice).not.toBe("");

  // Leaving the page drops the notice and the filters it explained.
  store.endVisit();
  expect(store.filterNotice).toBe("");
  expect(store.filters).toEqual({ status: "", phase: "", allocationId: "", q: "" });
});

test("the filter notice goes once the admin changes the filters, and when another create starts", async () => {
  service.createEvent.mockRejectedValueOnce(gatewayTimeout()).mockRejectedValueOnce(gatewayTimeout());
  service.getEvents.mockResolvedValue([]);
  const store = useCommercialEventsStore();
  await store.create({ allocationId: "a1", name: "Cup" } as never);
  expect(store.filterNotice).not.toBe("");

  store.filters.q = "";
  store.filtersChanged();
  expect(store.filterNotice).toBe("");

  await store.create({ allocationId: "a1", name: "Cup" } as never);
  expect(store.filterNotice).not.toBe("");
  service.createEvent.mockResolvedValueOnce({ id: "EV-2" });
  await store.create({ allocationId: "a1", name: "Other" } as never);
  expect(store.filterNotice).toBe("");
});

test("an uncertain allocation create points at one new allocation of that name, but never adopts it", async () => {
  service.createAllocation.mockRejectedValue(gatewayTimeout());
  service.getAllocations.mockResolvedValue([{ id: "a-new", name: "Spring" }, { id: "a-old", name: "Other" }]);
  const store = useCommercialEventAllocationsStore();
  store.allocations = [{ id: "a-old", name: "Other" }] as never;

  // Null: another admin may have created it, so the dialog must not switch to editing it.
  expect(await store.create({ name: "Spring " } as never)).toBeNull();

  expect(store.error).toBe(allocationMaybeCreatedText("Spring"));
});

test("an uncertain allocation create keeps the general text when several new allocations have that name", async () => {
  service.createAllocation.mockRejectedValue(gatewayTimeout());
  service.getAllocations.mockResolvedValue([{ id: "a-1", name: "Spring" }, { id: "a-2", name: "Spring" }]);
  const store = useCommercialEventAllocationsStore();

  expect(await store.create({ name: "Spring" } as never)).toBeNull();

  expect(store.error).toBe(MAYBE_SAVED_TEXT);
});

test("an uncertain allocation create keeps the general text when only an older allocation has that name", async () => {
  service.createAllocation.mockRejectedValue(gatewayTimeout());
  service.getAllocations.mockResolvedValue([{ id: "a-old", name: "Spring" }]);
  const store = useCommercialEventAllocationsStore();
  store.allocations = [{ id: "a-old", name: "Spring" }] as never;

  await store.create({ name: "Spring" } as never);

  expect(store.error).toBe(MAYBE_SAVED_TEXT);
});

test("a list reload without an allocation drops its details and their pending load", async () => {
  const details = deferred<unknown[]>();
  service.getAllocationPeriods.mockReturnValueOnce(details.promise);
  service.getEvents.mockResolvedValue([]);
  service.getAllocations.mockResolvedValue([{ id: "a2" }]);
  const store = useCommercialEventAllocationsStore();
  store.allocations = [{ id: "a1" }, { id: "a2" }] as never;

  const loadingDetails = store.loadDetails("a1");
  await store.load();
  details.resolve([{ periodId: "p1" }]);
  await loadingDetails;

  expect(store.details).toEqual({});
});

test("a create that succeeds after its page was left is not applied there; the list reloads instead", async () => {
  const write = deferred<unknown>();
  service.createAllocation.mockReturnValueOnce(write.promise);
  service.getAllocations.mockResolvedValue([{ id: "a-new" }]);
  const store = useCommercialEventAllocationsStore();

  const creating = store.create({ name: "Spring" } as never);
  store.endVisit();
  // The next visit's load already lists the new allocation.
  store.allocations = [{ id: "a-new" }] as never;
  write.resolve({ id: "a-new" });

  expect(await creating).toBeNull();
  expect(store.allocations).toEqual([{ id: "a-new" }]);
  await vi.waitFor(() => expect(service.getAllocations).toHaveBeenCalledTimes(1));
  expect(store.allocations).toEqual([{ id: "a-new" }]);
});

test("a create answer never lists an allocation twice", async () => {
  service.createAllocation.mockResolvedValue({ id: "a-new" });
  const store = useCommercialEventAllocationsStore();
  store.allocations = [{ id: "a-new" }, { id: "a-old" }] as never;

  await store.create({ name: "Spring" } as never);

  expect(store.allocations).toEqual([{ id: "a-new" }, { id: "a-old" }]);
});

test("filters set after an uncertain create are reset on leaving, even after the notice was dismissed", async () => {
  service.createEvent.mockRejectedValue(gatewayTimeout());
  service.getEvents.mockResolvedValue([]);
  const store = useCommercialEventsStore();
  await store.create({ allocationId: "a1", name: "Cup" } as never);

  store.dismissFilterNotice();
  expect(store.filterNotice).toBe("");
  store.endVisit();

  expect(store.filters).toEqual({ status: "", phase: "", allocationId: "", q: "" });
});

test("filters the admin changed after an uncertain create are kept on leaving", async () => {
  service.createEvent.mockRejectedValue(gatewayTimeout());
  service.getEvents.mockResolvedValue([]);
  const store = useCommercialEventsStore();
  await store.create({ allocationId: "a1", name: "Cup" } as never);

  store.filters.status = "open";
  store.filtersChanged();
  store.endVisit();

  expect(store.filters).toEqual({ status: "open", phase: "", allocationId: "a1", q: "Cup" });
});

test("a refused terminate reloads the list once: the game may be gone or already marked terminated", async () => {
  for (const code of ["TERMINATE_FAILED", "UNKNOWN_GAME"]) {
    vi.clearAllMocks();
    service.terminateGame.mockRejectedValue(new HttpError(409, "POST", "https://x", JSON.stringify({ code })));
    service.getActiveGames.mockResolvedValue([{ matchId: "m2" }]);
    const store = useCommercialEventActiveGamesStore();

    expect(await store.terminate("m1")).toBe(false);

    await vi.waitFor(() => expect(store.games).toEqual([{ matchId: "m2" }]));
    expect(service.getActiveGames).toHaveBeenCalledTimes(1);
    expect(store.error).not.toBe("");
  }
});

test("a terminate that settles after the page was left refreshes that game's event page if it is shown now", async () => {
  const write = deferred<undefined>();
  service.terminateGame.mockReturnValueOnce(write.promise);
  service.getActiveGames.mockResolvedValue([]);
  service.getEvent.mockResolvedValue({ id: "e1" });
  const store = useCommercialEventActiveGamesStore();
  store.games = [{ matchId: "m1", eventId: "e1" }] as never;
  const detail = useCommercialEventDetailStore();

  const terminating = store.terminate("m1");
  store.endVisit();
  detail.eventId = "e1";
  write.resolve(undefined);
  expect(await terminating).toBe(false);

  await vi.waitFor(() => expect(service.getEvent).toHaveBeenCalledTimes(1));
  expect(service.getAudit).toHaveBeenCalledTimes(1);
});

test("a late terminate leaves another event's page alone", async () => {
  const write = deferred<undefined>();
  service.terminateGame.mockReturnValueOnce(write.promise);
  service.getActiveGames.mockResolvedValue([]);
  const store = useCommercialEventActiveGamesStore();
  store.games = [{ matchId: "m1", eventId: "e1" }] as never;
  const detail = useCommercialEventDetailStore();

  const terminating = store.terminate("m1");
  store.endVisit();
  detail.eventId = "e2";
  write.resolve(undefined);
  await terminating;

  await vi.waitFor(() => expect(service.getActiveGames).toHaveBeenCalledTimes(1));
  expect(service.getEvent).not.toHaveBeenCalled();
});

test("an uncertain event create that settles after its page was left is shown by the next events list", async () => {
  const write = deferred<never>();
  service.createEvent.mockReturnValueOnce(write.promise);
  service.getEvents.mockResolvedValue([]);
  const store = useCommercialEventsStore();

  const creating = store.create({ allocationId: "a1", name: "Cup" } as never);
  store.endVisit();
  write.reject(gatewayTimeout());
  expect(await creating).toBeNull();
  expect(store.error).toBe("");
  // Leaving another page (the detail page also ends the events visit) keeps it.
  store.endVisit();

  await store.loadOrShowUnconfirmedCreate();

  expect(store.filters).toEqual({ status: "", phase: "", allocationId: "a1", q: "Cup" });
  expect(store.filterNotice).toContain("Cup");
  expect(store.unconfirmedCreate).toBeNull();
  expect(service.getEvents).toHaveBeenCalledTimes(1);
});

test("an event create that succeeds after its page was left is shown by the next events list as created", async () => {
  const write = deferred<unknown>();
  service.createEvent.mockReturnValueOnce(write.promise);
  service.getEvents.mockResolvedValue([]);
  const store = useCommercialEventsStore();

  const creating = store.create({ allocationId: "a1", name: "Cup" } as never);
  store.endVisit();
  write.resolve({ id: "EV-1" });
  expect(await creating).toBeNull();

  await store.loadOrShowUnconfirmedCreate();

  expect(store.filterNotice).toContain("was created after you left the page");
});

test("an event create refused after its page was left leaves nothing for the next visit", async () => {
  const write = deferred<never>();
  service.createEvent.mockReturnValueOnce(write.promise);
  service.getEvents.mockResolvedValue([]);
  service.getAllocations.mockResolvedValue([]);
  const store = useCommercialEventsStore();

  const creating = store.create({ allocationId: "a1", name: "Cup" } as never);
  store.endVisit();
  write.reject(new HttpError(409, "POST", "https://x", JSON.stringify({ code: "ALLOCATION_INACTIVE" })));
  await creating;

  expect(store.unconfirmedCreate).toBeNull();
  await store.loadOrShowUnconfirmedCreate();
  expect(store.filterNotice).toBe("");
});
