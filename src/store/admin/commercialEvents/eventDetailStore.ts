import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { describeCommercialEventsError } from "./errors";
import { commercialEventsService } from "./service";
import type { AdminEventDetail, ManagedRole } from "./types";
import { runAdminWrite } from "./write";

interface EventDetailState {
  /** The event shown; responses for another id are dropped. */
  eventId: string;
  event: AdminEventDetail | null;
  loading: boolean;
  loadError: string;
  /** People writes. */
  saving: boolean;
  error: string;
}

function token(): string {
  return useOauthStore().token;
}

export const useCommercialEventDetailStore = defineStore("commercialEventDetail", {
  state: (): EventDetailState => ({
    eventId: "",
    event: null,
    loading: false,
    loadError: "",
    saving: false,
    error: "",
  }),

  actions: {
    /** Shows another event: drops the previous one's data and loads everything. */
    async open(eventId: string): Promise<void> {
      this.$reset();
      this.eventId = eventId;
      await this.loadEvent();
    },

    async loadEvent(): Promise<void> {
      const eventId = this.eventId;
      this.loading = true;
      this.loadError = "";
      try {
        const event = await commercialEventsService().getEvent(token(), eventId);
        if (eventId === this.eventId) this.event = event;
      } catch (e) {
        console.error("Failed to load the event:", e);
        if (eventId === this.eventId) this.loadError = describeCommercialEventsError(e);
      } finally {
        if (eventId === this.eventId) this.loading = false;
      }
    },

    /** Takes the result of an event write (EventActionDialogs `changed`). */
    applyEvent(event: AdminEventDetail): void {
      if (event.id === this.eventId) this.event = event;
    },

    async addPerson(battleTag: string, role: ManagedRole): Promise<boolean> {
      const eventId = this.eventId;
      const people = await runAdminWrite(this, "other", () => commercialEventsService().addEventPerson(token(), eventId, battleTag, role));
      if (people && this.event && eventId === this.eventId) this.event = { ...this.event, ...people };
      return people !== null;
    },

    async removePerson(battleTag: string): Promise<boolean> {
      const eventId = this.eventId;
      const people = await runAdminWrite(this, "other", () => commercialEventsService().removeEventPerson(token(), eventId, battleTag));
      if (people && this.event && eventId === this.eventId) this.event = { ...this.event, ...people };
      return people !== null;
    },
  },
});
