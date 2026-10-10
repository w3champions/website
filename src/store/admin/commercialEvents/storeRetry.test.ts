import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { HttpError } from "@/services/http/AuthorizedClient";
import { MAYBE_SAVED_RELOAD_FAILED_TEXT, MAYBE_SAVED_TEXT } from "./errors";

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
}));

vi.mock("./service", () => ({ commercialEventsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import { useCommercialEventAllocationsStore } from "./allocationsStore";
import { useCommercialEventDetailStore } from "./eventDetailStore";
import { useCommercialEventsStore } from "./eventsStore";

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

test("a 504 on event create reloads the list and tells the admin to check it", async () => {
  service.createEvent.mockRejectedValue(new HttpError(504, "POST", "https://x", ""));
  service.getEvents.mockResolvedValue([{ id: "e1" }]);
  const store = useCommercialEventsStore();

  const result = await store.create({} as never);

  expect(result).toBeNull();
  expect(store.error).toBe(MAYBE_SAVED_TEXT);
  await vi.waitFor(() => expect(store.events).toEqual([{ id: "e1" }]));
  expect(service.getEvents).toHaveBeenCalledTimes(1);
});

test("a 409 on event create does not reload", async () => {
  service.createEvent.mockRejectedValue(new HttpError(409, "POST", "https://x", JSON.stringify({ code: "EVENT_CLOSED" })));
  const store = useCommercialEventsStore();

  await store.create({} as never);

  expect(service.getEvents).not.toHaveBeenCalled();
  expect(store.error).toBe("This event is closed. Closed events can't be changed.");
});

test("a 500 on allocation create reloads the list; a stale older load cannot overwrite it", async () => {
  let resolveOld: (value: unknown[]) => void = () => undefined;
  service.getAllocations.mockReturnValueOnce(new Promise((resolve) => (resolveOld = resolve)));
  service.getAllocations.mockResolvedValueOnce([{ id: "a-saved" }]);
  service.createAllocation.mockRejectedValue(new HttpError(500, "POST", "https://x", ""));
  const store = useCommercialEventAllocationsStore();

  const oldLoad = store.load();
  await store.create({} as never);
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
])("a 504 on event %s reloads the list and the shown event", async (_name, run, write) => {
  write.mockRejectedValue(gatewayTimeout());
  service.getEvents.mockResolvedValue([]);
  service.getEvent.mockResolvedValue({ id: "e1" });
  const detail = useCommercialEventDetailStore();
  detail.eventId = "e1";
  const store = useCommercialEventsStore();

  await run(store);

  expect(store.error).toBe(MAYBE_SAVED_TEXT);
  await vi.waitFor(() => expect(service.getEvents).toHaveBeenCalledTimes(1));
  await vi.waitFor(() => expect(service.getEvent).toHaveBeenCalledTimes(1));
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

test("a 504 on an event person write reloads the event", async () => {
  service.addEventPerson.mockRejectedValue(gatewayTimeout());
  service.getEvent.mockResolvedValue({ id: "e1" });
  const store = useCommercialEventDetailStore();
  store.eventId = "e1";

  expect(await store.addPerson("Tag#1", "host")).toBe(false);

  expect(store.error).toBe(MAYBE_SAVED_TEXT);
  await vi.waitFor(() => expect(service.getEvent).toHaveBeenCalledTimes(1));
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

  expect(await store.create({} as never)).toBeNull();

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
  expect(service.getEvent).not.toHaveBeenCalled();
});
