import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { SmurfEventsApiError } from "@/services/admin/SmurfEventsService";
import type { SmurfEventDetail, SmurfEventPreview, SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import type { SmurfEventDraft } from "./draft";

const service = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  denyPreview: vi.fn(),
  preview: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  review: vi.fn(),
}));

vi.mock("./service", () => ({ smurfEventsService: () => service }));
const oauth = vi.hoisted(() => ({ token: "tok" }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => oauth }));

import { SMURF_EVENTS_PAGE_SIZE, useSmurfEventsStore } from "./store";

function summary(id: string, review: SmurfEventSummary["review"] = "confirmed", origin: SmurfEventSummary["origin"] = "detected"): SmurfEventSummary {
  return {
    id,
    name: `Event ${id}`,
    origin,
    review,
    from: "2026-10-01T00:00:00.000Z",
    to: "2026-10-03T00:00:00.000Z",
    counts: { networks: 2, machines: 9, attendees: 12, homes: 7 },
    endedLinks: 4,
    createdAt: "2026-10-04T00:00:00.000Z",
  };
}

function detail(id: string, overrides: Partial<SmurfEventDetail> = {}): SmurfEventDetail {
  return {
    ...summary(id, "unreviewed", "manual"),
    attendees: ["Anchor#1001", "Anchor#1002", "Guest#1003"],
    anchors: ["Anchor#1001", "Anchor#1002"],
    requested: { from: "2026-10-01T00:00:00.000Z", to: "2026-10-03T00:00:00.000Z" },
    networks: [{ hash8: "0a1b2c3d", firstAt: "2026-10-01T08:00:00.000Z", lastAt: "2026-10-02T20:00:00.000Z", accounts: 12 }],
    machines: [{ hash8: "9f8e7d6c", accounts: 3 }],
    evidence: { countries: 1, networkDaysBefore: 0, networkDaysAfter: 0, returningAttendees: 2 },
    endedLinksList: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }],
    ...overrides,
  };
}

const PREVIEW: SmurfEventPreview = {
  span: { from: "2026-10-01T06:00:00.000Z", to: "2026-10-02T22:00:00.000Z" },
  networks: [{ hash8: "0a1b2c3d", anchors: 2, firstAt: "2026-10-01T06:00:00.000Z", lastAt: "2026-10-02T22:00:00.000Z" }],
  excluded: [{ hash8: "11223344", reason: "home" }],
  counts: { machines: 9, attendees: 12 },
  endsLinks: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }],
};

const DRAFT: SmurfEventDraft = { name: " LAN party ", from: "2026-10-01T00:00", to: "2026-10-03T00:00", anchors: ["Anchor#1001", " Anchor#1002 "], reason: "  known LAN  " };
const REQUEST = { name: "LAN party", from: "2026-10-01T00:00:00.000Z", to: "2026-10-03T00:00:00.000Z", anchors: ["Anchor#1001", "Anchor#1002"] };

beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
  service.list.mockResolvedValue({ events: [summary("1"), summary("2", "unreviewed"), summary("3", "denied")], next: "c1" });
  service.get.mockResolvedValue(detail("1"));
  service.preview.mockResolvedValue(PREVIEW);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

test("loadList sends the filters with the page size and lists unreviewed events first", async () => {
  const store = useSmurfEventsStore();

  await store.setFilters({ origin: "manual", review: null });

  expect(service.list).toHaveBeenCalledWith("tok", { origin: "manual", limit: SMURF_EVENTS_PAGE_SIZE });
  expect(store.orderedEvents.map((e) => e.id)).toEqual(["2", "1", "3"]);
  expect(store.next).toBe("c1");
});

test("loadMore appends the next page with the cursor and stops after the last page", async () => {
  const store = useSmurfEventsStore();
  await store.loadList();
  service.list.mockResolvedValueOnce({ events: [summary("4")] });

  await store.loadMore();

  expect(service.list).toHaveBeenLastCalledWith("tok", { cursor: "c1", limit: SMURF_EVENTS_PAGE_SIZE });
  expect(store.events.map((e) => e.id)).toEqual(["1", "2", "3", "4"]);
  expect(store.next).toBeNull();

  await store.loadMore();
  expect(service.list).toHaveBeenCalledTimes(2);
});

test("a failed list load keeps its error and shows no events", async () => {
  const failure = new SmurfEventsApiError(500, "boom", null);
  service.list.mockRejectedValue(failure);
  const store = useSmurfEventsStore();

  await store.loadList();

  expect(store.listError).toBe(failure);
  expect(store.events).toEqual([]);
  expect(store.listLoading).toBe(false);
});

test("openDetail loads the event and a failure keeps the error", async () => {
  const store = useSmurfEventsStore();

  await store.openDetail("1");
  expect(service.get).toHaveBeenCalledWith("tok", "1");
  expect(store.detail?.id).toBe("1");

  const failure = new SmurfEventsApiError(404, "No such event", null);
  service.get.mockRejectedValue(failure);
  await store.openDetail("missing");
  expect(store.detail).toBeNull();
  expect(store.detailError).toBe(failure);
});

test("runPreview sends the draft's span and anchors and remembers what it previewed", async () => {
  const store = useSmurfEventsStore();

  await store.runPreview(DRAFT);

  expect(service.preview).toHaveBeenCalledWith("tok", REQUEST);
  expect(store.preview).toEqual(PREVIEW);
  expect(store.previewKey).not.toBeNull();
});

test("saveManual creates the event after a preview, shows it and reloads the list", async () => {
  service.create.mockResolvedValue(detail("new"));
  const store = useSmurfEventsStore();
  await store.runPreview(DRAFT);

  const saved = await store.saveManual(DRAFT, null);

  expect(service.create).toHaveBeenCalledWith("tok", { ...REQUEST, reason: "known LAN" });
  expect(saved?.id).toBe("new");
  expect(store.detail?.id).toBe("new");
  expect(service.list).toHaveBeenCalledTimes(1);
});

test("saveManual updates an existing event by id", async () => {
  service.update.mockResolvedValue(detail("1"));
  const store = useSmurfEventsStore();
  await store.runPreview(DRAFT);

  await store.saveManual({ ...DRAFT, reason: "" }, "1");

  expect(service.update).toHaveBeenCalledWith("tok", "1", REQUEST);
});

test("saveManual sends nothing without a preview of the current draft, or after a refused one", async () => {
  const store = useSmurfEventsStore();

  expect(await store.saveManual(DRAFT, null)).toBeNull();

  await store.runPreview(DRAFT);
  expect(await store.saveManual({ ...DRAFT, to: "2026-10-04T00:00" }, null)).toBeNull();

  service.preview.mockResolvedValue({ ...PREVIEW, refused: "too-wide" });
  await store.runPreview(DRAFT);
  expect(await store.saveManual(DRAFT, null)).toBeNull();

  expect(service.create).not.toHaveBeenCalled();
});

test("a create refused by the server shows its preview and keeps the error", async () => {
  const refusedPreview: SmurfEventPreview = { ...PREVIEW, refused: "no-venue" };
  const failure = new SmurfEventsApiError(422, "Refused", { error: "Refused", preview: refusedPreview });
  service.create.mockRejectedValue(failure);
  const store = useSmurfEventsStore();
  await store.runPreview(DRAFT);

  const saved = await store.saveManual(DRAFT, null);

  expect(saved).toBeNull();
  expect(store.preview?.refused).toBe("no-venue");
  expect(store.actionError).toBe(failure);
  expect(store.acting).toBe(false);
});

test("deleteEvent sends the reason, drops the shown event and reloads the list", async () => {
  service.remove.mockResolvedValue(undefined);
  const store = useSmurfEventsStore();
  await store.openDetail("1");

  const ok = await store.deleteEvent("1", "  duplicate  ");

  expect(ok).toBe(true);
  expect(service.remove).toHaveBeenCalledWith("tok", "1", "duplicate");
  expect(store.detail).toBeNull();
  expect(service.list).toHaveBeenCalledTimes(1);
});

test("review sends the decision, omits an empty reason and shows the answer", async () => {
  service.review.mockResolvedValue(detail("1", { review: "confirmed", reviewedBy: "Mod#1" }));
  const store = useSmurfEventsStore();
  await store.openDetail("1");

  const ok = await store.review("1", "confirmed", "   ");

  expect(ok).toBe(true);
  expect(service.review).toHaveBeenCalledWith("tok", "1", { decision: "confirmed" });
  expect(store.detail?.review).toBe("confirmed");
});

test("a refused review keeps the server's error and leaves the event as shown", async () => {
  const failure = new SmurfEventsApiError(409, "Changed meanwhile", null);
  service.review.mockRejectedValue(failure);
  const store = useSmurfEventsStore();
  await store.openDetail("1");

  const ok = await store.review("1", "denied", "not an event");

  expect(ok).toBe(false);
  expect(service.review).toHaveBeenCalledWith("tok", "1", { decision: "denied", reason: "not an event" });
  expect(store.actionError).toBe(failure);
  expect(store.detail?.review).toBe("unreviewed");
});

test("loadDenyPreview keeps the links a deny would bring back", async () => {
  service.denyPreview.mockResolvedValue({ links: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }] });
  const store = useSmurfEventsStore();

  await store.loadDenyPreview("1");

  expect(service.denyPreview).toHaveBeenCalledWith("tok", "1");
  expect(store.denyLinks).toEqual([{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }]);
});
