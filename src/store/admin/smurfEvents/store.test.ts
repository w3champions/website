import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
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
  rename: vi.fn(),
  identifiers: vi.fn(),
  history: vi.fn(),
}));

vi.mock("./service", () => ({ smurfEventsService: () => service }));
const oauth = vi.hoisted(() => ({ token: "tok" }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => oauth }));

import { SMURF_EVENTS_PAGE_SIZE, useSmurfEventsStore } from "./store";

function summary(id: string, review: SmurfEventSummary["review"] = "confirmed", origin: SmurfEventSummary["origin"] = "detected"): SmurfEventSummary {
  return {
    id,
    name: `Event ${id}`,
    named: false,
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
    evidence: { networkDaysBefore: 0, networkDaysAfter: 0, returningAttendees: 2 },
    endedLinksList: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }],
    notCounted: [],
    recorded: {},
    evidenceRecorded: true,
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

test("loadList sends the filters with the page size and keeps the server order", async () => {
  const store = useSmurfEventsStore();

  await store.setFilters({ origin: "manual", review: null });

  expect(service.list).toHaveBeenCalledWith("tok", { origin: "manual", limit: SMURF_EVENTS_PAGE_SIZE });
  expect(store.events.map((e) => e.id)).toEqual(["1", "2", "3"]);
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

test("runPreview of an edit names the event it replaces; a failed one keeps the server's error", async () => {
  const store = useSmurfEventsStore();

  await store.runPreview(DRAFT, "1");
  expect(service.preview).toHaveBeenCalledWith("tok", { ...REQUEST, replacing: "1" });

  const gone = new SmurfEventsApiError(404, "No such smurf event", null);
  service.preview.mockRejectedValue(gone);
  await store.runPreview(DRAFT, "1");
  expect(store.previewError).toBe(gone);
  expect(store.preview).toBeNull();
});

test("saveManual creates the event after a preview, shows it and reloads the list", async () => {
  service.create.mockResolvedValue(created(detail("new")));
  const store = useSmurfEventsStore();
  await store.runPreview(DRAFT);

  const saved = await store.saveManual(DRAFT, null);

  expect(service.create).toHaveBeenCalledWith("tok", { ...REQUEST, reason: "known LAN" });
  expect(saved?.detail.id).toBe("new");
  expect(saved?.applied).toBe(true);
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

test("an edit refused with 409 keeps the error and the draft's preview, and reloads the event shown", async () => {
  const kept = new SmurfEventsApiError(409, "The event kept changing", null);
  service.update.mockRejectedValue(kept);
  service.get.mockResolvedValue(detail("1", { name: "Newer name" }));
  const store = useSmurfEventsStore();
  await store.openDetail("1");
  await store.runPreview(DRAFT, "1");
  service.get.mockClear();

  const saved = await store.saveManual(DRAFT, "1");
  await flushPromises();

  expect(saved).toBeNull();
  expect(store.actionError).toBe(kept);
  expect(store.preview).toEqual(PREVIEW);
  expect(service.get).toHaveBeenCalledWith("tok", "1");
  expect(store.detail?.name).toBe("Newer name");
  expect(store.acting).toBe(false);
});

test("an edit refused with 409 does not reload an event that is no longer shown, nor does a create or another status", async () => {
  const store = useSmurfEventsStore();
  await store.openDetail("2");
  await store.runPreview(DRAFT, "1");
  service.get.mockClear();

  service.update.mockRejectedValue(new SmurfEventsApiError(409, "kept changing", null));
  await store.saveManual(DRAFT, "1");
  service.update.mockRejectedValue(new SmurfEventsApiError(500, "boom", null));
  await store.saveManual(DRAFT, "2");
  service.create.mockRejectedValue(new SmurfEventsApiError(409, "other", null));
  await store.saveManual(DRAFT, null);
  await flushPromises();

  expect(service.get).not.toHaveBeenCalled();
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

test("deny and delete are not sent without a reason", async () => {
  const store = useSmurfEventsStore();
  await store.openDetail("1");

  expect(await store.review("1", "denied", "   ")).toBeNull();
  expect(await store.deleteEvent("1", "")).toBe(false);

  expect(service.review).not.toHaveBeenCalled();
  expect(service.remove).not.toHaveBeenCalled();
});

test("review sends the decision, omits an empty reason and shows the answer", async () => {
  service.review.mockResolvedValue(detail("1", { review: "confirmed", reviewedBy: "Mod#1" }));
  const store = useSmurfEventsStore();
  await store.openDetail("1");

  const reviewed = await store.review("1", "confirmed", "   ");

  expect(reviewed?.detail.review).toBe("confirmed");
  expect(service.review).toHaveBeenCalledWith("tok", "1", { decision: "confirmed" });
  expect(store.detail?.review).toBe("confirmed");
});

test("a refused review keeps the server's error and leaves the event as shown", async () => {
  const failure = new SmurfEventsApiError(409, "Changed meanwhile", null);
  service.review.mockRejectedValue(failure);
  const store = useSmurfEventsStore();
  await store.openDetail("1");

  const reviewed = await store.review("1", "denied", "not an event");

  expect(reviewed).toBeNull();
  expect(service.review).toHaveBeenCalledWith("tok", "1", { decision: "denied", reason: "not an event" });
  expect(store.actionError).toBe(failure);
  expect(store.detail?.review).toBe("unreviewed");
});

test("a review that carried a name and failed reads the event and its record again, keeping the error", async () => {
  const failure = new SmurfEventsApiError(429, "Busy", null);
  service.review.mockRejectedValue(failure);
  service.history.mockResolvedValue({ entries: [] });
  const store = useSmurfEventsStore();
  await store.openDetail("1");
  service.get.mockResolvedValue({ ...detail("1"), name: "Renamed by the review" });

  await store.review("1", "confirmed", "", "Renamed by the review");
  await flushPromises();

  expect(service.get).toHaveBeenCalledTimes(2);
  expect(service.history).toHaveBeenCalledWith("tok", "1");
  expect(store.detail?.name).toBe("Renamed by the review");
  expect(store.actionError).toBe(failure);
});

test("a review without a name that failed reads nothing again", async () => {
  service.review.mockRejectedValue(new SmurfEventsApiError(429, "Busy", null));
  const store = useSmurfEventsStore();
  await store.openDetail("1");

  await store.review("1", "confirmed", "");
  await flushPromises();

  expect(service.get).toHaveBeenCalledTimes(1);
  expect(service.history).not.toHaveBeenCalled();
});

test("clearActionError drops the last write error", async () => {
  service.review.mockRejectedValue(new SmurfEventsApiError(409, "Changed meanwhile", null));
  const store = useSmurfEventsStore();
  await store.review("1", "confirmed", "");

  store.clearActionError();

  expect(store.actionError).toBeNull();
});

test("loadDenyPreview keeps the links a deny would bring back", async () => {
  service.denyPreview.mockResolvedValue({ links: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }] });
  const store = useSmurfEventsStore();

  await store.loadDenyPreview("1");

  expect(service.denyPreview).toHaveBeenCalledWith("tok", "1");
  expect(store.denyLinks).toEqual([{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }]);
});

// --- paging ---

test("loadMore holds an event that arrives again once, in its first place, with the newer data", async () => {
  const store = useSmurfEventsStore();
  await store.loadList();
  service.list.mockResolvedValueOnce({ events: [summary("2", "confirmed"), summary("4"), summary("4", "denied")] });

  await store.loadMore();

  expect(store.events.map((e) => e.id)).toEqual(["1", "2", "3", "4"]);
  expect(store.events[1].review).toBe("confirmed");
  expect(store.events[3].review).toBe("denied");
});

test("setFilters supersedes a loadMore still in flight", async () => {
  const store = useSmurfEventsStore();
  await store.loadList();
  const page = deferred<{ events: SmurfEventSummary[] }>();
  service.list.mockReturnValueOnce(page.promise);
  const more = store.loadMore();
  service.list.mockResolvedValueOnce({ events: [summary("9")] });

  await store.setFilters({ origin: "manual", review: null });
  page.resolve({ events: [summary("4")] });
  await more;

  expect(store.events.map((e) => e.id)).toEqual(["9"]);
  expect(store.listLoading).toBe(false);
});

// --- stale previews ---

test("an older preview that lands after a newer one does not replace it", async () => {
  const older = deferred<SmurfEventPreview>();
  const newerDraft = { ...DRAFT, to: "2026-10-04T00:00" };
  const store = useSmurfEventsStore();
  service.preview.mockReturnValueOnce(older.promise);
  const first = store.runPreview(DRAFT);
  const newer: SmurfEventPreview = { ...PREVIEW, counts: { machines: 1, attendees: 2 } };
  service.preview.mockResolvedValueOnce(newer);
  await store.runPreview(newerDraft);

  older.resolve(PREVIEW);
  await first;

  expect(store.preview).toEqual(newer);
  expect(store.previewLoading).toBe(false);
  // Save follows the newer draft's preview.
  service.create.mockResolvedValue(created(detail("new")));
  expect(await store.saveManual(DRAFT, null)).toBeNull();
  expect(await store.saveManual(newerDraft, null)).not.toBeNull();
});

// --- refused writes (422) ---

test("a 422 whose preview lacks a reason still counts as refused", async () => {
  const { refused: _omitted, ...withoutReason } = { ...PREVIEW, refused: "no-venue" as const };
  service.create.mockRejectedValue(new SmurfEventsApiError(422, "Refused", { error: "Refused", preview: withoutReason }));
  const store = useSmurfEventsStore();
  await store.runPreview(DRAFT);

  await store.saveManual(DRAFT, null);

  expect(store.preview?.refused).toBe("no-venue");
});

test("a 422 without a valid preview is a plain failure: Save stays off until a new preview succeeds", async () => {
  const failure = new SmurfEventsApiError(422, "Refused", { error: "Refused", preview: { networks: "none" } });
  service.update.mockRejectedValue(failure);
  const store = useSmurfEventsStore();
  await store.runPreview(DRAFT);

  expect(await store.saveManual(DRAFT, "1")).toBeNull();

  expect(store.actionError).toBe(failure);
  expect(store.preview).toBeNull();
  expect(await store.saveManual(DRAFT, "1")).toBeNull();
  expect(service.update).toHaveBeenCalledTimes(1);
  await store.runPreview(DRAFT);
  expect(store.preview).toEqual(PREVIEW);
});

// --- applied: false ---

test("a write answered applied: false reports it and keeps the flag out of the shown event", async () => {
  service.review.mockResolvedValue({ ...detail("1", { review: "confirmed" }), applied: false });
  const store = useSmurfEventsStore();
  await store.openDetail("1");

  const reviewed = await store.review("1", "confirmed", "");

  expect(reviewed?.applied).toBe(false);
  expect(store.detail).not.toHaveProperty("applied");
});

// --- list patched at once ---

test("a review updates the row at once and a delete removes it, before the reload lands", async () => {
  const store = useSmurfEventsStore();
  await store.loadList();
  const reload = deferred<{ events: SmurfEventSummary[] }>();
  service.list.mockReturnValue(reload.promise);
  service.review.mockResolvedValue(detail("2", { review: "confirmed" }));
  service.remove.mockResolvedValue(undefined);

  await store.review("2", "confirmed", "");
  expect(store.events.find((e) => e.id === "2")?.review).toBe("confirmed");

  await store.deleteEvent("3", "duplicate");
  expect(store.events.map((e) => e.id)).toEqual(["1", "2"]);
  reload.resolve({ events: [] });
});

// --- writes that settle late ---

test("a save that settles after clear() writes nothing, requests nothing and leaves no spinner", async () => {
  const answer = deferred<CreateResult>();
  service.create.mockReturnValue(answer.promise);
  const store = useSmurfEventsStore();
  await store.runPreview(DRAFT);
  const saving = store.saveManual(DRAFT, null);
  expect(store.acting).toBe(true);

  store.clear();
  answer.resolve(created(detail("late")));
  const outcome = await saving;

  expect(outcome?.detail.id).toBe("late");
  expect(store.detail).toBeNull();
  expect(store.detailId).toBeNull();
  expect(store.acting).toBe(false);
  expect(service.list).not.toHaveBeenCalled();
});

test("a failed save that settles after clear() does not put its error into the next visit", async () => {
  const answer = deferred<CreateResult>();
  service.create.mockReturnValue(answer.promise);
  const store = useSmurfEventsStore();
  await store.runPreview(DRAFT);
  const saving = store.saveManual(DRAFT, null);

  store.clear();
  answer.reject(new SmurfEventsApiError(422, "Refused", { preview: { ...PREVIEW, refused: "no-venue" } }));
  await saving;

  expect(store.actionError).toBeNull();
  expect(store.preview).toBeNull();
});

test("a late write never ends the spinner of a write of the next visit", async () => {
  const first = deferred<CreateResult>();
  service.create.mockReturnValueOnce(first.promise);
  const store = useSmurfEventsStore();
  await store.runPreview(DRAFT);
  const saving = store.saveManual(DRAFT, null);
  store.clear();
  const second = deferred<SmurfEventDetail>();
  service.review.mockReturnValue(second.promise);
  const reviewing = store.review("1", "confirmed", "");

  first.resolve(created(detail("late")));
  await saving;

  expect(store.acting).toBe(true);
  second.resolve(detail("1", { review: "confirmed" }));
  await reviewing;
  expect(store.acting).toBe(false);
});

test("a save that settles after the moderator opened another event leaves that event alone", async () => {
  const answer = deferred<SmurfEventDetail>();
  service.update.mockReturnValue(answer.promise);
  service.get.mockImplementation((_token: string, id: string) => Promise.resolve(detail(id)));
  const store = useSmurfEventsStore();
  await store.openDetail("1");
  await store.runPreview(DRAFT);
  const saving = store.saveManual(DRAFT, "1");
  // Browser back: another event is being loaded while the save is pending.
  const slow = deferred<SmurfEventDetail>();
  service.get.mockReturnValueOnce(slow.promise);
  const opening = store.openDetail("2");

  answer.resolve(detail("1", { name: "Renamed" }));
  await saving;
  slow.resolve(detail("2"));
  await opening;

  expect(store.detail?.id).toBe("2");
  expect(store.detailLoading).toBe(false);
});

test("a save that settles while its own event is loading shows the saved event and ends the load", async () => {
  const answer = deferred<SmurfEventDetail>();
  service.update.mockReturnValue(answer.promise);
  const store = useSmurfEventsStore();
  await store.openDetail("1");
  await store.runPreview(DRAFT);
  const saving = store.saveManual(DRAFT, "1");
  const slow = deferred<SmurfEventDetail>();
  service.get.mockReturnValueOnce(slow.promise);
  const reopening = store.openDetail("1");

  answer.resolve(detail("1", { name: "Renamed" }));
  await saving;
  slow.resolve(detail("1", { name: "Old" }));
  await reopening;

  expect(store.detail?.name).toBe("Renamed");
  expect(store.detailLoading).toBe(false);
});

test("a review and a delete that settle after clear() write nothing", async () => {
  const reviewAnswer = deferred<SmurfEventDetail>();
  const removeAnswer = deferred<void>();
  service.review.mockReturnValue(reviewAnswer.promise);
  service.remove.mockReturnValue(removeAnswer.promise);
  const store = useSmurfEventsStore();
  await store.openDetail("1");
  await store.loadList();
  service.list.mockClear();

  const reviewing = store.review("1", "confirmed", "");
  store.clear();
  reviewAnswer.resolve(detail("1", { review: "confirmed" }));
  await reviewing;
  await store.openDetail("1");
  store.clear();
  const deleting = store.deleteEvent("1", "dup");
  store.clear();
  removeAnswer.resolve();
  await deleting;
  await flushPromises();

  expect(store.detail).toBeNull();
  expect(store.events).toEqual([]);
  expect(store.acting).toBe(false);
  expect(service.list).not.toHaveBeenCalled();
});

type CreateResult = { event: SmurfEventDetail; existing: boolean };

function created(event: SmurfEventDetail, existing = false): CreateResult {
  return { event, existing };
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("a create answered with an existing event is reported as existing", async () => {
  service.create.mockResolvedValue(created(detail("old"), true));
  const store = useSmurfEventsStore();
  await store.runPreview(DRAFT);

  const saved = await store.saveManual(DRAFT, null);

  expect(saved?.existing).toBe(true);
  expect(saved?.detail.id).toBe("old");
});

test("an edit that sends a confirmed event back to unreviewed shows that at once in the event and its row", async () => {
  service.list.mockResolvedValue({ events: [summary("1", "confirmed")] });
  service.get.mockResolvedValue(detail("1", { review: "confirmed", reviewedBy: "Mod#1", reviewedAt: "2026-10-05T00:00:00.000Z" }));
  const store = useSmurfEventsStore();
  await store.loadList();
  await store.openDetail("1");
  await store.runPreview(DRAFT);
  const reload = deferred<{ events: SmurfEventSummary[] }>();
  service.list.mockReturnValue(reload.promise);
  service.update.mockResolvedValue(detail("1", { review: "unreviewed" }));

  await store.saveManual(DRAFT, "1");

  expect(store.detail?.review).toBe("unreviewed");
  expect(store.detail?.reviewedBy).toBeUndefined();
  expect(store.events[0].review).toBe("unreviewed");
  expect(store.events[0].reviewedBy).toBeUndefined();
  reload.resolve({ events: [] });
});

// --- applies ---

test("a write answered applies: false reports it and keeps the flag out of the shown event", async () => {
  service.review.mockResolvedValue({ ...detail("1", { review: "confirmed" }), applies: false });
  const store = useSmurfEventsStore();
  await store.openDetail("1");

  const reviewed = await store.review("1", "confirmed", "");

  expect(reviewed?.applies).toBe(false);
  expect(store.detail).not.toHaveProperty("applies");
});

test("a write without the applies flag (an older server) counts as applying", async () => {
  service.review.mockResolvedValue(detail("1", { review: "confirmed" }));
  const store = useSmurfEventsStore();

  expect((await store.review("1", "confirmed", ""))?.applies).toBe(true);
});

test("a deny preview answered applies: false is remembered; true or absent is not", async () => {
  const store = useSmurfEventsStore();
  expect(store.denyApplies).toBe(true);

  service.denyPreview.mockResolvedValue({ applies: false, links: [], endedLinks: 0 });
  await store.loadDenyPreview("1");
  expect(store.denyApplies).toBe(false);

  service.denyPreview.mockResolvedValue({ applies: true, links: [], endedLinks: 0 });
  await store.loadDenyPreview("1");
  expect(store.denyApplies).toBe(true);

  service.denyPreview.mockResolvedValue({ applies: false, links: [], endedLinks: 0 });
  await store.loadDenyPreview("1");
  service.denyPreview.mockResolvedValue({ links: [], endedLinks: 0 });
  await store.loadDenyPreview("1");
  expect(store.denyApplies).toBe(true);

  service.denyPreview.mockResolvedValue({ applies: false, links: [], endedLinks: 0 });
  await store.loadDenyPreview("1");
  store.clearDenyPreview();
  expect(store.denyApplies).toBe(true);
});

test("review sends name only when given", async () => {
  service.review.mockResolvedValue(detail("1", { review: "confirmed" }));
  const store = useSmurfEventsStore();

  await store.review("1", "confirmed", "");
  await store.review("1", "confirmed", "", "Sofia LAN");

  expect(service.review).toHaveBeenNthCalledWith(1, "tok", "1", { decision: "confirmed" });
  expect(service.review).toHaveBeenNthCalledWith(2, "tok", "1", { decision: "confirmed", name: "Sofia LAN" });
});

test("rename replaces the list row and the open detail", async () => {
  service.list.mockResolvedValue({ events: [summary("1"), summary("2")] });
  service.get.mockResolvedValue(detail("1"));
  service.rename.mockResolvedValue(detail("1", { name: "Sofia LAN", named: true }));
  const store = useSmurfEventsStore();
  await store.loadList();
  await store.openDetail("1");

  const outcome = await store.rename("1", " Sofia LAN ", " ");

  expect(service.rename).toHaveBeenCalledWith("tok", "1", { name: "Sofia LAN" });
  expect(outcome?.name).toBe("Sofia LAN");
  expect(store.events.map((e) => e.name)).toEqual(["Sofia LAN", "Event 2"]);
  expect(store.detail?.name).toBe("Sofia LAN");
});

test("rename sends a reason when given and keeps the error when refused", async () => {
  const store = useSmurfEventsStore();
  service.rename.mockResolvedValue(detail("1"));
  await store.rename("1", "Sofia LAN", "venue said so");
  expect(service.rename).toHaveBeenCalledWith("tok", "1", { name: "Sofia LAN", reason: "venue said so" });

  const refused = new SmurfEventsApiError(400, "bad name", null);
  service.rename.mockRejectedValue(refused);
  expect(await store.rename("1", "x")).toBeNull();
  expect(store.actionError).toBe(refused);
});

test("loadIdentifiers and loadHistory keep the answer of the newest request only", async () => {
  const store = useSmurfEventsStore();
  let first!: (v: unknown) => void;
  service.identifiers.mockImplementationOnce(() => new Promise((resolve) => (first = resolve)));
  service.identifiers.mockResolvedValueOnce({ window: { fromDay: 1, toDay: 2, eventFromDay: 1, eventToDay: 2 }, rows: [] });
  const stale = store.loadIdentifiers("1");
  await store.loadIdentifiers("2");
  first({ window: { fromDay: 9, toDay: 9, eventFromDay: 9, eventToDay: 9 }, rows: [{ hash8: "stale" }] });
  await stale;

  expect(store.identifiers?.rows).toEqual([]);
  expect(store.identifiersLoading).toBe(false);

  service.history.mockResolvedValue({ entries: [] });
  await store.loadHistory("2");
  expect(service.history).toHaveBeenCalledWith("tok", "2");
  expect(store.history).toEqual({ entries: [] });

  const failure = new Error("boom");
  service.identifiers.mockRejectedValue(failure);
  service.history.mockRejectedValue(failure);
  await store.loadIdentifiers("2");
  await store.loadHistory("2");
  expect(store.identifiersError).toBe(failure);
  expect(store.historyError).toBe(failure);
  expect(store.identifiers).toBeNull();
  expect(store.history).toBeNull();
});

test("a late identifiers answer for the event left behind is dropped when another event opens", async () => {
  const store = useSmurfEventsStore();
  let late!: (v: unknown) => void;
  service.identifiers.mockImplementationOnce(() => new Promise((resolve) => (late = resolve)));
  service.get.mockResolvedValue(detail("2"));
  const pending = store.loadIdentifiers("1");

  await store.openDetail("2");
  late({ window: { fromDay: 1, toDay: 2, eventFromDay: 1, eventToDay: 2 }, rows: [{ hash8: "ofA" }] });
  await pending;

  expect(store.identifiers).toBeNull();
  expect(store.identifiersLoading).toBe(false);
  expect(store.identifiersError).toBeNull();
});

test("a late history answer is dropped when the detail is closed, and the loaded state is cleared", async () => {
  const store = useSmurfEventsStore();
  service.identifiers.mockResolvedValue({ window: { fromDay: 1, toDay: 2, eventFromDay: 1, eventToDay: 2 }, rows: [] });
  service.history.mockResolvedValueOnce({ entries: [] });
  await store.loadIdentifiers("1");
  await store.loadHistory("1");
  expect(store.history).not.toBeNull();
  let late!: (v: unknown) => void;
  service.history.mockImplementationOnce(() => new Promise((resolve) => (late = resolve)));
  const pending = store.loadHistory("1");

  store.closeDetail();
  late({ entries: [{ id: "x" }] });
  await pending;

  expect(store.history).toBeNull();
  expect(store.historyLoading).toBe(false);
  expect(store.identifiers).toBeNull();
});

test("a late rename answer after clear() puts neither a row nor a detail back", async () => {
  service.get.mockResolvedValue(detail("1"));
  const store = useSmurfEventsStore();
  await store.loadList();
  await store.openDetail("1");
  let late!: (v: unknown) => void;
  service.rename.mockImplementationOnce(() => new Promise((resolve) => (late = resolve)));
  const pending = store.rename("1", "Sofia LAN");

  store.clear();
  late(detail("1", { name: "Sofia LAN", named: true }));
  await pending;

  expect(store.events).toEqual([]);
  expect(store.detail).toBeNull();
  expect(store.detailId).toBeNull();
  expect(store.acting).toBe(false);
});
