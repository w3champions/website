import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { describeCommercialEventsError } from "./errors";
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
}

function token(): string {
  return useOauthStore().token;
}

// Filters change while the admin types: only the newest list request may write the result.
const loads = requestSequence();

/** The events list and every event write (used by the list and the detail page). */
export const useCommercialEventsStore = defineStore("commercialEvents", {
  state: (): EventsState => ({
    events: [],
    filters: emptyEventFilters(),
    loading: false,
    saving: false,
    error: "",
    loadError: "",
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
      resetKeepingWrite(this);
    },

    /**
     * After a write whose outcome is unknown: reloads the list and, when the detail page shows that event, everything
     * a write can change there (the event and its audit log). Resolves to whether all of it loaded.
     */
    async refresh(eventId?: string): Promise<boolean> {
      const detail = useCommercialEventDetailStore();
      const results = await Promise.all([this.load(), eventId !== undefined && detail.eventId === eventId ? detail.refreshAfterWrite() : Promise.resolve(true)]);
      return results.every(Boolean);
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
      const created = await runAdminWrite(this, "event", () => commercialEventsService().createEvent(token(), request), () => this.load());
      // Reload: the filters decide whether and where the new event is listed.
      if (created) void this.load();
      return created;
    },

    async update(eventId: string, request: EventUpdateRequest): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "event", () => commercialEventsService().updateEvent(token(), eventId, request), () => this.refresh(eventId)));
    },

    async move(eventId: string, allocationId: string): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "event", () => commercialEventsService().moveEvent(token(), eventId, allocationId), () => this.refresh(eventId)));
    },

    async close(eventId: string): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "event", () => commercialEventsService().closeEvent(token(), eventId), () => this.refresh(eventId)));
    },

    async suspend(eventId: string, request: SuspendRequest): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "suspension", () => commercialEventsService().suspendEvent(token(), eventId, request), () => this.refresh(eventId)));
    },

    async unsuspend(eventId: string): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "event", () => commercialEventsService().unsuspendEvent(token(), eventId), () => this.refresh(eventId)));
    },
  },
});
