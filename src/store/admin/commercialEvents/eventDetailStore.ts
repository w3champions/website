import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { describeCommercialEventsError } from "./errors";
import { requestSequence } from "./latest";
import { commercialEventsService } from "./service";
import type { AdminEventDetail, AuditEntry, EventGame, EventPeople, ManagedRole } from "./types";
import { resetKeepingWrite, runAdminWrite } from "./write";

interface EventDetailState {
  /** The event shown; write and match page responses for another id are dropped. */
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

// Only the newest request of each kind may write its result; `open()` supersedes them all.
const eventLoads = requestSequence();
const gamesLoads = requestSequence();
const auditLoads = requestSequence();

function invalidateLoads(): void {
  eventLoads.invalidate();
  gamesLoads.invalidate();
  auditLoads.invalidate();
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
      this.clear();
      this.eventId = eventId;
      await Promise.all([this.loadEvent(), this.loadGames(true), this.loadAudit()]);
    },

    /** Drops the shown event and every pending load; a write in flight stays marked. */
    clear(): void {
      invalidateLoads();
      resetKeepingWrite(this);
    },

    /** Resolves to whether the request succeeded. */
    async loadEvent(): Promise<boolean> {
      const request = eventLoads.next();
      this.loading = true;
      this.loadError = "";
      try {
        const event = await commercialEventsService().getEvent(token(), this.eventId);
        if (eventLoads.isLatest(request)) this.event = event;
        return true;
      } catch (e) {
        console.error("Failed to load the event:", e);
        if (eventLoads.isLatest(request)) this.loadError = describeCommercialEventsError(e);
        return false;
      } finally {
        if (eventLoads.isLatest(request)) this.loading = false;
      }
    },

    /**
     * First page when `reset`, else the next page. The next page is a no-op after the
     * last one and while games are loading; a first-page load supersedes a pending next page.
     */
    async loadGames(reset: boolean): Promise<void> {
      const cursor = reset ? undefined : this.gamesCursor ?? undefined;
      if (!reset && (cursor === undefined || this.gamesLoading)) return;
      const request = gamesLoads.next();
      this.gamesLoading = true;
      this.gamesError = "";
      try {
        const page = await commercialEventsService().getEventGames(token(), this.eventId, cursor, EVENT_GAMES_PAGE_SIZE);
        if (!gamesLoads.isLatest(request)) return;
        this.games = reset ? page.games : [...this.games, ...page.games];
        this.gamesCursor = page.nextCursor ?? null;
      } catch (e) {
        console.error("Failed to load event games:", e);
        if (gamesLoads.isLatest(request)) this.gamesError = describeCommercialEventsError(e);
      } finally {
        if (gamesLoads.isLatest(request)) this.gamesLoading = false;
      }
    },

    async loadAudit(): Promise<void> {
      const request = auditLoads.next();
      this.auditLoading = true;
      this.auditError = "";
      try {
        const audit = await commercialEventsService().getAudit(token(), { eventId: this.eventId });
        if (auditLoads.isLatest(request)) this.audit = audit;
      } catch (e) {
        console.error("Failed to load the audit log:", e);
        if (auditLoads.isLatest(request)) this.auditError = describeCommercialEventsError(e);
      } finally {
        if (auditLoads.isLatest(request)) this.auditLoading = false;
      }
    },

    /** Website match id of a game (planning fact W7), or null with `matchLinkError` set. */
    async resolveMatchPage(matchId: string): Promise<string | null> {
      const eventId = this.eventId;
      this.matchLinkError = "";
      this.resolvingMatchId = matchId;
      try {
        const id = await commercialEventsService().resolveMatchPageId(matchId);
        // Another event is shown now: neither navigate nor report.
        if (eventId !== this.eventId) return null;
        if (id === null) this.matchLinkError = NO_MATCH_PAGE;
        return id;
      } catch (e) {
        console.error("Failed to look up the match page:", e);
        if (eventId === this.eventId) this.matchLinkError = describeCommercialEventsError(e);
        return null;
      } finally {
        if (eventId === this.eventId) this.resolvingMatchId = "";
      }
    },

    /** Takes the result of an event write (EventActionDialogs `changed`). */
    applyEvent(event: AdminEventDetail): void {
      if (event.id !== this.eventId) return;
      this.event = event;
      this.supersedePendingLoad();
    },

    /** After a write applied locally: an event load already in flight may answer with the old state, so supersede it with a fresh one. */
    supersedePendingLoad(): void {
      if (this.loading) void this.loadEvent();
    },

    /** A people write for the shown event. Once another event is shown, its result and its error are dropped. */
    async writePeople(write: (eventId: string) => Promise<EventPeople>): Promise<boolean> {
      const eventId = this.eventId;
      const people = await runAdminWrite(this, "other", () => write(eventId), () => (eventId === this.eventId ? this.loadEvent() : Promise.resolve(true)));
      if (eventId !== this.eventId) {
        // open() reset the store for the other event; this write's error belongs to the previous one.
        this.error = "";
      } else if (people && this.event) {
        this.event = { ...this.event, ...people };
        this.supersedePendingLoad();
      }
      return people !== null;
    },

    async addPerson(battleTag: string, role: ManagedRole): Promise<boolean> {
      return await this.writePeople((eventId) => commercialEventsService().addEventPerson(token(), eventId, battleTag, role));
    },

    async removePerson(battleTag: string): Promise<boolean> {
      return await this.writePeople((eventId) => commercialEventsService().removeEventPerson(token(), eventId, battleTag));
    },
  },
});
