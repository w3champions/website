import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { describeCommercialEventsError } from "./errors";
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
let latestLoad = 0;

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
    /** Server order: startsAt descending. */
    async load(): Promise<void> {
      const request = ++latestLoad;
      this.loading = true;
      this.loadError = "";
      try {
        const events = await commercialEventsService().getEvents(token(), { ...this.filters });
        if (request === latestLoad) this.events = events;
      } catch (e) {
        console.error("Failed to load events:", e);
        if (request === latestLoad) {
          this.loadError = describeCommercialEventsError(e);
          this.events = [];
        }
      } finally {
        if (request === latestLoad) this.loading = false;
      }
    },

    /** Replaces the listed copy of an event after a write (no-op when it is not listed). */
    upsertLocal(event: AdminEventDetail): void {
      this.events = this.events.map((e) => (e.id === event.id ? event : e));
    },

    applied(event: AdminEventDetail | null): AdminEventDetail | null {
      if (event) this.upsertLocal(event);
      return event;
    },

    async create(request: EventCreateRequest): Promise<AdminEventDetail | null> {
      const created = await runAdminWrite(this, "event", () => commercialEventsService().createEvent(token(), request));
      // Reload: the filters decide whether and where the new event is listed.
      if (created) void this.load();
      return created;
    },

    async update(eventId: string, request: EventUpdateRequest): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "event", () => commercialEventsService().updateEvent(token(), eventId, request)));
    },

    async move(eventId: string, allocationId: string): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "event", () => commercialEventsService().moveEvent(token(), eventId, allocationId)));
    },

    async close(eventId: string): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "event", () => commercialEventsService().closeEvent(token(), eventId)));
    },

    async suspend(eventId: string, request: SuspendRequest): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "suspension", () => commercialEventsService().suspendEvent(token(), eventId, request)));
    },

    async unsuspend(eventId: string): Promise<AdminEventDetail | null> {
      return this.applied(await runAdminWrite(this, "event", () => commercialEventsService().unsuspendEvent(token(), eventId)));
    },
  },
});
