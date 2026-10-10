import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { describeCommercialEventsError } from "./errors";
import { loadLatest, requestSequence } from "./latest";
import { commercialEventsService } from "./service";
import type { AdminEventDetail, AuditEntry, EventGame, EventPeople, ManagedRole } from "./types";
import { type RefreshReason, resetKeepingWrite, runAdminWrite } from "./write";

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

// Only the newest request of each kind may write its result; `clear()` (navigation, unmount) supersedes them all.
const eventLoads = requestSequence();
const gamesLoads = requestSequence();
const auditLoads = requestSequence();
const matchLookups = requestSequence();
// One number per visit of the detail page, even of the same event: a write's follow-up checks it is still current.
const visits = requestSequence();

function invalidateLoads(): void {
  eventLoads.invalidate();
  gamesLoads.invalidate();
  auditLoads.invalidate();
  matchLookups.invalidate();
  visits.invalidate();
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
      this.loadError = "";
      const eventId = this.eventId;
      return await loadLatest(eventLoads, {
        what: "the event",
        setLoading: (loading) => (this.loading = loading),
        fetch: () => commercialEventsService().getEvent(token(), eventId),
        apply: (event) => (this.event = event),
        fail: (e) => (this.loadError = describeCommercialEventsError(e)),
      });
    },

    /**
     * First page when `reset`, else the next page. The next page is a no-op after the
     * last one and while games are loading; a first-page load supersedes a pending next page.
     */
    async loadGames(reset: boolean): Promise<boolean> {
      const cursor = reset ? undefined : this.gamesCursor ?? undefined;
      if (!reset && (cursor === undefined || this.gamesLoading)) return true;
      this.gamesError = "";
      const eventId = this.eventId;
      return await loadLatest(gamesLoads, {
        what: "event games",
        setLoading: (loading) => (this.gamesLoading = loading),
        fetch: () => commercialEventsService().getEventGames(token(), eventId, cursor, EVENT_GAMES_PAGE_SIZE),
        apply: (page) => {
          this.games = reset ? page.games : [...this.games, ...page.games];
          this.gamesCursor = page.nextCursor ?? null;
        },
        fail: (e) => (this.gamesError = describeCommercialEventsError(e)),
      });
    },

    async loadAudit(): Promise<boolean> {
      this.auditError = "";
      const eventId = this.eventId;
      return await loadLatest(auditLoads, {
        what: "the audit log",
        setLoading: (loading) => (this.auditLoading = loading),
        fetch: () => commercialEventsService().getAudit(token(), { eventId }),
        apply: (audit) => (this.audit = audit),
        fail: (e) => (this.auditError = describeCommercialEventsError(e)),
      });
    },

    /** After a write whose outcome is unknown: reloads everything a write can change here. Resolves to whether all of it loaded. */
    async refreshAfterWrite(): Promise<boolean> {
      const results = await Promise.all([this.loadEvent(), this.loadAudit()]);
      return results.every(Boolean);
    },

    /** Website match id of a game (planning fact W7), or null with `matchLinkError` set; null too once the page was left. */
    async resolveMatchPage(matchId: string): Promise<string | null> {
      const request = matchLookups.next();
      this.matchLinkError = "";
      this.resolvingMatchId = matchId;
      try {
        const id = await commercialEventsService().resolveMatchPageId(matchId);
        // The page was left or reopened meanwhile: neither navigate nor report.
        if (!matchLookups.isLatest(request)) return null;
        if (id === null) this.matchLinkError = NO_MATCH_PAGE;
        return id;
      } catch (e) {
        console.error("Failed to look up the match page:", e);
        if (matchLookups.isLatest(request)) this.matchLinkError = describeCommercialEventsError(e);
        return null;
      } finally {
        if (matchLookups.isLatest(request)) this.resolvingMatchId = "";
      }
    },

    /** A token for the current visit, to pass back to {@link applyEvent}. */
    visitToken(): number {
      return visits.current();
    },

    /**
     * Takes the result of an event write (EventActionDialogs `changed`), which also adds an audit entry. `visit` is the
     * token taken when the write began: once the page was left or reopened, even for the same event, it is dropped.
     */
    applyEvent(event: AdminEventDetail, visit: number): void {
      if (!visits.isLatest(visit) || event.id !== this.eventId) return;
      this.event = event;
      this.supersedePendingLoad();
      void this.loadAudit();
    },

    /** After a write applied locally: an event load already in flight may answer with the old state, so supersede it with a fresh one. */
    supersedePendingLoad(): void {
      if (this.loading) void this.loadEvent();
    },

    /** A people write for the shown event. Once the page was left or reopened, its result, error and reload are dropped. */
    async writePeople(write: (eventId: string) => Promise<EventPeople>): Promise<boolean> {
      const eventId = this.eventId;
      const visit = visits.current();
      // After the page was left, reload only if it shows the same event again; another event is not affected.
      const reload = (reason: RefreshReason) => (reason !== "elsewhere" || this.eventId === eventId ? this.refreshAfterWrite() : Promise.resolve(true));
      const people = await runAdminWrite(this, "other", () => write(eventId), reload, visits);
      if (people && this.event && visits.isLatest(visit)) {
        this.event = { ...this.event, ...people };
        this.supersedePendingLoad();
        void this.loadAudit();
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
