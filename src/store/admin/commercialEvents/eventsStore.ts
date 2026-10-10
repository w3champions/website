import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { describeCommercialEventsError } from "./errors";
import { useCommercialEventAllocationsStore } from "./allocationsStore";
import { useCommercialEventDetailStore } from "./eventDetailStore";
import { loadLatest, requestSequence } from "./latest";
import { commercialEventsService } from "./service";
import { emptyEventFilters } from "./types";
import type { AdminEvent, AdminEventDetail, EventCreateRequest, EventFilters, EventUpdateRequest, SuspendRequest } from "./types";
import { resetKeepingWrite, runAdminWrite } from "./write";

interface EventsState {
  events: AdminEvent[];
  filters: EventFilters;
  loading: boolean;
  saving: boolean;
  /** Last failed event write; shown by the event dialogs. */
  error: string;
  loadError: string;
  /** Why the filters changed without the admin (after an uncertain create); shown above the list. */
  filterNotice: string;
  /** Filters set by the store after an uncertain create, not by the admin; null once the admin changes them. */
  autoFilters: EventFilters | null;
}

function token(): string {
  return useOauthStore().token;
}

// Filters change while the admin types: only the newest list request may write the result.
const loads = requestSequence();
// One number per page visit: a write that settles after its page was left drops its error and reload.
const visits = requestSequence();

/** The events list and every event write (used by the list and the detail page). */
export const useCommercialEventsStore = defineStore("commercialEvents", {
  state: (): EventsState => ({
    events: [],
    filters: emptyEventFilters(),
    loading: false,
    saving: false,
    error: "",
    loadError: "",
    filterNotice: "",
    autoFilters: null,
  }),

  actions: {
    /** Server order: startsAt descending. Resolves to whether the request succeeded. */
    async load(): Promise<boolean> {
      this.loadError = "";
      const filters = { ...this.filters };
      return await loadLatest(loads, {
        what: "events",
        setLoading: (loading) => (this.loading = loading),
        fetch: () => commercialEventsService().getEvents(token(), filters),
        apply: (events) => (this.events = events),
        fail: (e) => {
          this.loadError = describeCommercialEventsError(e);
          this.events = [];
        },
      });
    },

    /** Drops the list and every pending list response; a write in flight stays marked. */
    clear(): void {
      loads.invalidate();
      visits.invalidate();
      resetKeepingWrite(this);
    },

    /** The page was left: writes still in flight no longer report into it, and its last write error is not shown again. */
    endVisit(): void {
      visits.invalidate();
      this.error = "";
      // Filters set for an uncertain create are not the admin's, even once the notice was dismissed: don't leave them
      // behind unexplained.
      if (this.autoFilters !== null) this.filters = emptyEventFilters();
      this.autoFilters = null;
      this.filterNotice = "";
    },

    /** Called when the filters change: once they differ from the ones the store set, they are the admin's again. */
    filtersChanged(): void {
      const auto = this.autoFilters;
      const same = auto !== null && (Object.keys(auto) as Array<keyof EventFilters>).every((key) => auto[key] === this.filters[key]);
      if (!same) {
        this.autoFilters = null;
        this.filterNotice = "";
      }
    },

    /** Hides the notice; the filters stay marked as set by the store. */
    dismissFilterNotice(): void {
      this.filterNotice = "";
    },

    /** Reloads the list and the allocations the create and move dialogs offer (after a create or move was refused). */
    async refreshWithAllocations(eventId?: string): Promise<boolean> {
      const results = await Promise.all([this.refresh(eventId), useCommercialEventAllocationsStore().load()]);
      return results.every(Boolean);
    },

    /**
     * After a write whose outcome is unknown: reloads what the page shows. On the detail page of that event, that is
     * everything a write can change there (the event and its audit log; the list reloads when its page opens);
     * elsewhere the list. Resolves to whether it loaded.
     */
    async refresh(eventId?: string): Promise<boolean> {
      const detail = useCommercialEventDetailStore();
      return eventId !== undefined && detail.eventId === eventId ? await detail.refreshAfterWrite() : await this.load();
    },

    /** Takes the result of a write into the list. */
    applied(event: AdminEventDetail | null): AdminEventDetail | null {
      if (!event) return null;
      this.events = this.events.map((e) => (e.id === event.id ? event : e));
      // The write may take the event out of (or into) the filtered list, and a list load
      // already in flight may answer with the event's old state.
      if (this.loading || Object.values(this.filters).some((value) => value !== "")) void this.load();
      return event;
    },

    async create(request: EventCreateRequest): Promise<AdminEventDetail | null> {
      // A notice from an earlier create no longer explains what this one will show.
      this.dismissFilterNotice();
      const created = await runAdminWrite(this, "event", () => commercialEventsService().createEvent(token(), request), (reason) => (reason === "uncertain" ? this.showAttemptedCreate(request) : this.refreshWithAllocations()), visits);
      // Reload: the filters decide whether and where the new event is listed.
      if (created) void this.load();
      return created;
    },

    /**
     * After an uncertain create: the current filters may hide the new event (a status filter, a search), so they are
     * replaced by its allocation and its name, a search that lists the event if it was created, and the page says so.
     */
    async showAttemptedCreate(request: EventCreateRequest): Promise<boolean> {
      const name = request.name.trim();
      this.filters = { ...emptyEventFilters(), allocationId: request.allocationId, q: name };
      this.autoFilters = { ...this.filters };
      this.filterNotice = `The filters now show the events named "${name}" in the chosen allocation, so you can check whether the new event was created.`;
      return await this.load();
    },

    async update(eventId: string, request: EventUpdateRequest): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "event", () => commercialEventsService().updateEvent(token(), eventId, request), () => this.refresh(eventId), visits));
    },

    async move(eventId: string, allocationId: string): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "event", () => commercialEventsService().moveEvent(token(), eventId, allocationId), (reason) => (reason === "conflict" ? this.refreshWithAllocations(eventId) : this.refresh(eventId)), visits));
    },

    async close(eventId: string): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "event", () => commercialEventsService().closeEvent(token(), eventId), () => this.refresh(eventId), visits));
    },

    async suspend(eventId: string, request: SuspendRequest): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "suspension", () => commercialEventsService().suspendEvent(token(), eventId, request), () => this.refresh(eventId), visits));
    },

    async unsuspend(eventId: string): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "event", () => commercialEventsService().unsuspendEvent(token(), eventId), () => this.refresh(eventId), visits));
    },
  },
});
