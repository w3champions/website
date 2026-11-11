import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { loadLatest, requestSequence } from "@/store/admin/latest";
import { SmurfEventsApiError } from "@/services/admin/SmurfEventsService";
import type { SmurfEventDetail, SmurfEventLinkRef, SmurfEventOrigin, SmurfEventPreview, SmurfEventReview, SmurfEventsQuery, SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { previewKey, saveBlocker, type SmurfEventDraft, toManualRequest, toPreviewRequest } from "./draft";
import { reviewNeedsReason } from "./actions";
import { mergeEvents, outcomeOf, refusedPreviewFrom, summaryOf, type WriteOutcome } from "./events";
import { smurfEventsService } from "./service";

export const SMURF_EVENTS_PAGE_SIZE = 50;

/** HTTP status of "busy with other previews, retry in a moment" (preview, create, update). */
const TOO_BUSY = 429;

export interface SmurfEventFilters {
  origin: SmurfEventOrigin | null;
  review: SmurfEventReview | null;
}

interface SmurfEventsState {
  filters: SmurfEventFilters;
  /** Server order (unreviewed first), every page loaded so far. */
  events: SmurfEventSummary[];
  /** The cursor of the next page; null once the last page is shown. */
  next: string | null;
  listLoading: boolean;
  listError: unknown;
  /** The event the page shows or is loading; a write that finishes later applies its answer only to this one. */
  detailId: string | null;
  detail: SmurfEventDetail | null;
  detailLoading: boolean;
  detailError: unknown;
  preview: SmurfEventPreview | null;
  /** The preview key of the draft `preview` was made for. */
  previewKey: string | null;
  previewLoading: boolean;
  previewError: unknown;
  /** The links a deny of the event would bring back; null until loaded. */
  denyLinks: SmurfEventLinkRef[] | null;
  /** How many links the event ended, as the deny preview reported it; null until loaded. */
  denyEndedLinks: number | null;
  /** The deny preview's list was cut: it may miss links a deny would bring back. */
  denyLinksTruncated: boolean;
  denyLoading: boolean;
  denyError: unknown;
  acting: boolean;
  actionError: unknown;
}

function token(): string {
  return useOauthStore().token;
}

function queryOf(filters: SmurfEventFilters, cursor?: string): SmurfEventsQuery {
  const query: SmurfEventsQuery = {};
  if (filters.review !== null) query.review = filters.review;
  if (filters.origin !== null) query.origin = filters.origin;
  if (cursor !== undefined) query.cursor = cursor;
  return { ...query, limit: SMURF_EVENTS_PAGE_SIZE };
}

function trimmedOrUndefined(reason: string): string | undefined {
  const trimmed = reason.trim();
  return trimmed === "" ? undefined : trimmed;
}

// Only the newest request of each kind writes its result; `clear()` supersedes them all.
const listLoads = requestSequence();
const detailLoads = requestSequence();
const previewLoads = requestSequence();
const denyLoads = requestSequence();
// One visit of the page; `clear()` ends it. A write that settles after that changes nothing.
const visits = requestSequence();

export const useSmurfEventsStore = defineStore("smurfEvents", {
  state: (): SmurfEventsState => ({
    filters: { origin: null, review: null },
    events: [],
    next: null,
    listLoading: false,
    listError: null,
    detailId: null,
    detail: null,
    detailLoading: false,
    detailError: null,
    preview: null,
    previewKey: null,
    previewLoading: false,
    previewError: null,
    denyLinks: null,
    denyEndedLinks: null,
    denyLinksTruncated: false,
    denyLoading: false,
    denyError: null,
    acting: false,
    actionError: null,
  }),

  actions: {
    async setFilters(filters: SmurfEventFilters): Promise<boolean> {
      this.filters = { ...filters };
      return await this.loadList();
    },

    /** The first page under the current filters. */
    async loadList(): Promise<boolean> {
      this.listError = null;
      const query = queryOf(this.filters);
      return await loadLatest(listLoads, {
        what: "smurf events",
        setLoading: (loading) => (this.listLoading = loading),
        fetch: () => smurfEventsService().list(token(), query),
        apply: (page) => {
          this.events = page.events ?? [];
          this.next = page.next ?? null;
        },
        fail: (e) => {
          this.events = [];
          this.next = null;
          this.listError = e;
        },
      });
    },

    /** The next page; a no-op after the last one and while a page is loading. */
    async loadMore(): Promise<boolean> {
      const cursor = this.next;
      if (cursor === null || this.listLoading) return true;
      this.listError = null;
      const query = queryOf(this.filters, cursor);
      return await loadLatest(listLoads, {
        what: "smurf events",
        setLoading: (loading) => (this.listLoading = loading),
        fetch: () => smurfEventsService().list(token(), query),
        apply: (page) => {
          this.events = mergeEvents(this.events, page.events ?? []);
          this.next = page.next ?? null;
        },
        fail: (e) => (this.listError = e),
      });
    },

    async openDetail(id: string): Promise<boolean> {
      this.detailId = id;
      this.detail = null;
      this.detailError = null;
      return await loadLatest(detailLoads, {
        what: "the smurf event",
        setLoading: (loading) => (this.detailLoading = loading),
        fetch: () => smurfEventsService().get(token(), id),
        apply: (detail) => (this.detail = detail),
        fail: (e) => (this.detailError = e),
      });
    },

    closeDetail(): void {
      detailLoads.invalidate();
      this.detailId = null;
      this.detail = null;
      this.detailError = null;
      this.detailLoading = false;
    },

    /** Shows a written event, superseding any detail load still in flight (its answer is older). */
    showWritten(detail: SmurfEventDetail): void {
      detailLoads.invalidate();
      this.detailId = detail.id;
      this.detail = detail;
      this.detailError = null;
      this.detailLoading = false;
    },

    /** Previews the draft's span and anchors; Save is offered only for this preview's draft. */
    async runPreview(draft: SmurfEventDraft): Promise<boolean> {
      const key = previewKey(draft);
      if (key === null) return false;
      this.previewError = null;
      const before = { preview: this.preview, key: this.previewKey };
      this.preview = null;
      this.previewKey = null;
      const request = toPreviewRequest(draft);
      return await loadLatest(previewLoads, {
        what: "the smurf event preview",
        setLoading: (loading) => (this.previewLoading = loading),
        fetch: () => smurfEventsService().preview(token(), request),
        apply: (preview) => {
          this.preview = preview;
          this.previewKey = key;
        },
        fail: (e) => {
          this.previewError = e;
          // A busy server refused nothing: the preview shown before stays as it was.
          if (e instanceof SmurfEventsApiError && e.status === TOO_BUSY) {
            this.preview = before.preview;
            this.previewKey = before.key;
          }
        },
      });
    },

    resetPreview(): void {
      previewLoads.invalidate();
      this.preview = null;
      this.previewKey = null;
      this.previewError = null;
      this.previewLoading = false;
    },

    /**
     * Creates (`id` null) or replaces a manual event. Sends nothing unless the draft has a
     * non-refused preview. A create or update the server refuses shows the preview it answered with.
     * Resolves to the saved event, or null. An answer that arrives after the store was cleared, or
     * after the moderator moved to another event, is returned but not written into the store.
     */
    async saveManual(draft: SmurfEventDraft, id: string | null): Promise<WriteOutcome | null> {
      if (this.acting || saveBlocker(draft, { preview: this.preview, key: this.previewKey, loading: this.previewLoading }) !== null) return null;
      const request = toManualRequest(draft);
      const visit = visits.current();
      const shown = this.detailId;
      this.acting = true;
      this.actionError = null;
      try {
        const service = smurfEventsService();
        let outcome: WriteOutcome;
        if (id === null) {
          const created = await service.create(token(), request);
          outcome = outcomeOf(created.event, created.existing);
        } else {
          outcome = outcomeOf(await service.update(token(), id, request));
        }
        if (visits.isLatest(visit)) {
          if (this.detailId === shown) this.showWritten(outcome.detail);
          // The row shows what the server answered (an edit may have reset the review) until the reload lands.
          this.events = this.events.map((e) => (e.id === outcome.detail.id ? summaryOf(outcome.detail) : e));
          this.resetPreview();
          void this.loadList();
        }
        return outcome;
      } catch (e) {
        console.error("Saving the smurf event failed:", e);
        if (!visits.isLatest(visit)) return null;
        this.actionError = e;
        if (e instanceof SmurfEventsApiError && e.status === 422) {
          // The server refused: show the preview it answered with. Without a valid one, the earlier
          // preview no longer holds, so Save waits for a new preview.
          const refused = refusedPreviewFrom(e.body);
          if (refused === null) {
            this.resetPreview();
          } else {
            previewLoads.invalidate();
            this.preview = refused;
            this.previewKey = previewKey(draft);
          }
        }
        return null;
      } finally {
        if (visits.isLatest(visit)) this.acting = false;
      }
    },

    /** Deletes a manual event; the reason is required (it goes to the audit log). */
    async deleteEvent(id: string, reason: string): Promise<boolean> {
      const trimmed = reason.trim();
      if (this.acting || trimmed === "") return false;
      const visit = visits.current();
      this.acting = true;
      this.actionError = null;
      try {
        await smurfEventsService().remove(token(), id, trimmed);
        if (visits.isLatest(visit)) {
          if (this.detailId === id) this.closeDetail();
          // The row goes at once; the reload below brings the server's view.
          this.events = this.events.filter((e) => e.id !== id);
          void this.loadList();
        }
        return true;
      } catch (e) {
        console.error("Deleting the smurf event failed:", e);
        if (visits.isLatest(visit)) this.actionError = e;
        return false;
      } finally {
        if (visits.isLatest(visit)) this.acting = false;
      }
    },

    /**
     * A deny needs a reason; confirm and unreview send one only when given. Resolves to the
     * reviewed event, or null; like a save, a late answer is not written into the store.
     */
    async review(id: string, decision: SmurfEventReview, reason: string): Promise<WriteOutcome | null> {
      const trimmed = trimmedOrUndefined(reason);
      if (this.acting || (reviewNeedsReason(decision) && trimmed === undefined)) return null;
      const visit = visits.current();
      this.acting = true;
      this.actionError = null;
      try {
        const outcome = outcomeOf(await smurfEventsService().review(token(), id, trimmed === undefined ? { decision } : { decision, reason: trimmed }));
        if (visits.isLatest(visit)) {
          if (this.detailId === id) this.showWritten(outcome.detail);
          // The row shows the new review at once; the reload below brings the server's view.
          this.events = this.events.map((e) => (e.id === id ? summaryOf(outcome.detail) : e));
          void this.loadList();
        }
        return outcome;
      } catch (e) {
        console.error("Reviewing the smurf event failed:", e);
        if (visits.isLatest(visit)) this.actionError = e;
        return null;
      } finally {
        if (visits.isLatest(visit)) this.acting = false;
      }
    },

    async loadDenyPreview(id: string): Promise<boolean> {
      this.denyLinks = null;
      this.denyEndedLinks = null;
      this.denyLinksTruncated = false;
      this.denyError = null;
      return await loadLatest(denyLoads, {
        what: "the deny preview",
        setLoading: (loading) => (this.denyLoading = loading),
        fetch: () => smurfEventsService().denyPreview(token(), id),
        apply: (preview) => {
          this.denyLinks = preview.links ?? [];
          this.denyEndedLinks = typeof preview.endedLinks === "number" ? preview.endedLinks : null;
          this.denyLinksTruncated = preview.linksTruncated === true;
        },
        fail: (e) => (this.denyError = e),
      });
    },

    clearActionError(): void {
      this.actionError = null;
    },

    clearDenyPreview(): void {
      denyLoads.invalidate();
      this.denyLinks = null;
      this.denyEndedLinks = null;
      this.denyLinksTruncated = false;
      this.denyError = null;
      this.denyLoading = false;
    },

    clear(): void {
      visits.invalidate();
      listLoads.invalidate();
      detailLoads.invalidate();
      previewLoads.invalidate();
      denyLoads.invalidate();
      this.$reset();
    },
  },
});
