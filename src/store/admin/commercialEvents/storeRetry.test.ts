import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { HttpError } from "@/services/http/AuthorizedClient";
import { MAYBE_SAVED_TEXT } from "./errors";

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
