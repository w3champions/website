import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { loadLatest, requestSequence } from "@/store/admin/latest";
import { SmurfEventsApiError } from "@/services/admin/SmurfEventsService";
import type { SmurfEventDetail, SmurfEventLinkRef, SmurfEventOrigin, SmurfEventPreview, SmurfEventReview, SmurfEventsQuery, SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { previewKey, saveBlocker, type SmurfEventDraft, toManualRequest, toPreviewRequest } from "./draft";
import { orderEvents } from "./labels";
import { smurfEventsService } from "./service";

export const SMURF_EVENTS_PAGE_SIZE = 50;

export interface SmurfEventFilters {
  origin: SmurfEventOrigin | null;
  review: SmurfEventReview | null;
}

interface SmurfEventsState {
  filters: SmurfEventFilters;
  /** Server order, every page loaded so far. */
  events: SmurfEventSummary[];
  /** The cursor of the next page; null once the last page is shown. */
  next: string | null;
  listLoading: boolean;
  listError: unknown;
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

/** The preview inside a refused create's 422 body, if it carries one. */
function refusedPreviewOf(e: unknown): SmurfEventPreview | null {
  if (!(e instanceof SmurfEventsApiError) || e.status !== 422) return null;
  const body = e.body;
  if (typeof body !== "object" || body === null) return null;
  const preview = (body as { preview?: unknown }).preview;
  return typeof preview === "object" && preview !== null ? (preview as SmurfEventPreview) : null;
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

export const useSmurfEventsStore = defineStore("smurfEvents", {
  state: (): SmurfEventsState => ({
    filters: { origin: null, review: null },
    events: [],
    next: null,
    listLoading: false,
    listError: null,
    detail: null,
    detailLoading: false,
    detailError: null,
    preview: null,
    previewKey: null,
    previewLoading: false,
    previewError: null,
    denyLinks: null,
    denyLoading: false,
    denyError: null,
    acting: false,
    actionError: null,
  }),

  getters: {
    /** Unreviewed events first. */
    orderedEvents: (state): SmurfEventSummary[] => orderEvents(state.events),
  },

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
          this.events = [...this.events, ...(page.events ?? [])];
          this.next = page.next ?? null;
        },
        fail: (e) => (this.listError = e),
      });
    },

    async openDetail(id: string): Promise<boolean> {
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
      this.detail = null;
      this.detailError = null;
      this.detailLoading = false;
    },

    /** Previews the draft's span and anchors; Save is offered only for this preview's draft. */
    async runPreview(draft: SmurfEventDraft): Promise<boolean> {
      const key = previewKey(draft);
      if (key === null) return false;
      this.previewError = null;
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
        fail: (e) => (this.previewError = e),
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
     * non-refused preview. A create the server refuses shows the preview it answered with.
     * Resolves to the saved event, or null.
     */
    async saveManual(draft: SmurfEventDraft, id: string | null): Promise<SmurfEventDetail | null> {
      if (this.acting || saveBlocker(draft, { preview: this.preview, key: this.previewKey, loading: this.previewLoading }) !== null) return null;
      const request = toManualRequest(draft);
      this.acting = true;
      this.actionError = null;
      try {
        const service = smurfEventsService();
        const saved = id === null ? await service.create(token(), request) : await service.update(token(), id, request);
        detailLoads.invalidate();
        this.detail = saved;
        this.resetPreview();
        void this.loadList();
        return saved;
      } catch (e) {
        console.error("Saving the smurf event failed:", e);
        this.actionError = e;
        const refused = refusedPreviewOf(e);
        if (refused !== null) {
          previewLoads.invalidate();
          this.preview = refused;
          this.previewKey = previewKey(draft);
        }
        return null;
      } finally {
        this.acting = false;
      }
    },

    async deleteEvent(id: string, reason: string): Promise<boolean> {
      if (this.acting) return false;
      this.acting = true;
      this.actionError = null;
      try {
        await smurfEventsService().remove(token(), id, trimmedOrUndefined(reason));
        if (this.detail?.id === id) this.closeDetail();
        void this.loadList();
        return true;
      } catch (e) {
        console.error("Deleting the smurf event failed:", e);
        this.actionError = e;
        return false;
      } finally {
        this.acting = false;
      }
    },

    async review(id: string, decision: SmurfEventReview, reason: string): Promise<boolean> {
      if (this.acting) return false;
      this.acting = true;
      this.actionError = null;
      const trimmed = trimmedOrUndefined(reason);
      try {
        const reviewed = await smurfEventsService().review(token(), id, trimmed === undefined ? { decision } : { decision, reason: trimmed });
        if (this.detail?.id === id) {
          detailLoads.invalidate();
          this.detail = reviewed;
        }
        void this.loadList();
        return true;
      } catch (e) {
        console.error("Reviewing the smurf event failed:", e);
        this.actionError = e;
        return false;
      } finally {
        this.acting = false;
      }
    },

    async loadDenyPreview(id: string): Promise<boolean> {
      this.denyLinks = null;
      this.denyError = null;
      return await loadLatest(denyLoads, {
        what: "the deny preview",
        setLoading: (loading) => (this.denyLoading = loading),
        fetch: () => smurfEventsService().denyPreview(token(), id),
        apply: (preview) => (this.denyLinks = preview.links ?? []),
        fail: (e) => (this.denyError = e),
      });
    },

    clearDenyPreview(): void {
      denyLoads.invalidate();
      this.denyLinks = null;
      this.denyError = null;
      this.denyLoading = false;
    },

    clear(): void {
      listLoads.invalidate();
      detailLoads.invalidate();
      previewLoads.invalidate();
      denyLoads.invalidate();
      this.$reset();
    },
  },
});
