import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { describeCommercialEventsError } from "./errors";
import { commercialEventsService } from "./service";
import type { AdminEventDetail, AuditEntry, EventGame, ManagedRole } from "./types";
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
  /** startedAt descending, running games included. */
  games: EventGame[];
  /** null once the last page is loaded. */
  gamesCursor: string | null;
  gamesLoading: boolean;
  gamesError: string;
  /** Newest first. */
  audit: AuditEntry[];
  auditLoading: boolean;
  auditError: string;
  matchLinkError: string;
  /** The game whose match page is being looked up. */
  resolvingMatchId: string;
}

/** C-E3 caps a games page at 50. */
export const EVENT_GAMES_PAGE_SIZE = 50;

const NO_MATCH_PAGE = "This game has no match page. Only finished games with a result have one.";

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
    games: [],
    gamesCursor: null,
    gamesLoading: false,
    gamesError: "",
    audit: [],
    auditLoading: false,
    auditError: "",
    matchLinkError: "",
    resolvingMatchId: "",
  }),

  actions: {
    /** Shows another event: drops the previous one's data and loads everything. */
    async open(eventId: string): Promise<void> {
      this.$reset();
      this.eventId = eventId;
      await Promise.all([this.loadEvent(), this.loadGames(true), this.loadAudit()]);
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

    /** First page when `reset`, else the next page (no-op after the last one). */
    async loadGames(reset: boolean): Promise<void> {
      const eventId = this.eventId;
      const cursor = reset ? undefined : this.gamesCursor ?? undefined;
      if (!reset && cursor === undefined) return;
      this.gamesLoading = true;
      this.gamesError = "";
      try {
        const page = await commercialEventsService().getEventGames(token(), eventId, cursor, EVENT_GAMES_PAGE_SIZE);
        if (eventId !== this.eventId) return;
        this.games = reset ? page.games : [...this.games, ...page.games];
        this.gamesCursor = page.nextCursor ?? null;
      } catch (e) {
        console.error("Failed to load event games:", e);
        if (eventId === this.eventId) this.gamesError = describeCommercialEventsError(e);
      } finally {
        if (eventId === this.eventId) this.gamesLoading = false;
      }
    },

    async loadAudit(): Promise<void> {
      const eventId = this.eventId;
      this.auditLoading = true;
      this.auditError = "";
      try {
        const audit = await commercialEventsService().getAudit(token(), { eventId });
        if (eventId === this.eventId) this.audit = audit;
      } catch (e) {
        console.error("Failed to load the audit log:", e);
        if (eventId === this.eventId) this.auditError = describeCommercialEventsError(e);
      } finally {
        if (eventId === this.eventId) this.auditLoading = false;
      }
    },

    /** Website match id of a game (planning fact W7), or null with `matchLinkError` set. */
    async resolveMatchPage(matchId: string): Promise<string | null> {
      this.matchLinkError = "";
      this.resolvingMatchId = matchId;
      try {
        const id = await commercialEventsService().resolveMatchPageId(matchId);
        if (id === null) this.matchLinkError = NO_MATCH_PAGE;
        return id;
      } catch (e) {
        console.error("Failed to look up the match page:", e);
        this.matchLinkError = describeCommercialEventsError(e);
        return null;
      } finally {
        this.resolvingMatchId = "";
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
