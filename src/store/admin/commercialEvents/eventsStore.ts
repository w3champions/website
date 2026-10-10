import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { describeCommercialEventsError } from "./errors";
import { useCommercialEventDetailStore } from "./eventDetailStore";
import { requestSequence } from "./latest";
import { commercialEventsService } from "./service";
import { emptyEventFilters } from "./types";
import type { AdminEvent, AdminEventDetail, EventCreateRequest, EventFilters, EventUpdateRequest, SuspendRequest } from "./types";
import { runAdminWrite } from "./write";

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
      const request = loads.next();
      this.loading = true;
      this.loadError = "";
      try {
        const events = await commercialEventsService().getEvents(token(), { ...this.filters });
        if (loads.isLatest(request)) this.events = events;
        return true;
      } catch (e) {
        console.error("Failed to load events:", e);
        if (loads.isLatest(request)) {
          this.loadError = describeCommercialEventsError(e);
          this.events = [];
        }
        return false;
      } finally {
        if (loads.isLatest(request)) this.loading = false;
      }
    },

    /** Drops the list and every pending list response. */
    clear(): void {
      loads.invalidate();
      this.$reset();
    },

    /** After a write whose outcome is unknown: reloads the list and, when it shows that event, the detail page's event. Resolves to whether both loaded. */
    async refresh(eventId?: string): Promise<boolean> {
      const detail = useCommercialEventDetailStore();
      const results = await Promise.all([this.load(), eventId !== undefined && detail.eventId === eventId ? detail.loadEvent() : Promise.resolve(true)]);
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
