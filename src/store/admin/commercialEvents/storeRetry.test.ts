import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { HttpError } from "@/services/http/AuthorizedClient";
import { MAYBE_SAVED_TEXT } from "./errors";

const service = vi.hoisted(() => ({
  getEvents: vi.fn(),
  createEvent: vi.fn(),
  getAllocations: vi.fn(),
  createAllocation: vi.fn(),
}));

vi.mock("./service", () => ({ commercialEventsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import { useCommercialEventAllocationsStore } from "./allocationsStore";
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
