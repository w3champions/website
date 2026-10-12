import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import ReplayExportService, { adminReplayExportApi, ReplayExportApi } from "@/services/admin/ReplayExportService";
import ReplayStoreService, { replayStoreApi } from "@/services/ReplayStoreService";
import { HttpError } from "@/services/http/AuthorizedClient";
import { EGameMode } from "@/store/types";
import { replayExportError } from "./errors";
import { ReplayExportFilter, ReplayExportMode, ReplayExportState, ReplayExportTicket } from "./types";

/** Counts the options requests, so a slow answer for an earlier game mode does not replace a newer one. */
let optionsRequests = 0;

/**
 * Counts the visits of the page (and the mode changes). An answer that arrives after the user left the page
 * belongs to the last visit, maybe to the other mode: it is dropped.
 */
let visit = 0;

/** Counts the closed orders: a confirm answer that arrives after the buyer closed the order is dropped. */
let orderVersion = 0;

/** Lets the browser download the ZIP: a plain link, so it streams to disk with the native progress. */
function startDownload(api: ReplayExportApi, ticket: ReplayExportTicket): ReplayExportTicket {
  const link = document.createElement("a");
  link.href = api.downloadUrl(ticket.ticket);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  return ticket;
}

const emptySearch = () => ({ preview: null, previewFilter: null, previewDescription: "", matchesById: {} });

/**
 * The search, the list and the history of replay downloads. One store for both pages: the admin export
 * (`mode` admin, free) and the public replay store (`mode` store, paid). Only one of them shows at a time;
 * each page sets its mode first.
 */
export const useReplayExportStore = defineStore("replayExport", {
  state: (): ReplayExportState => ({
    mode: "admin",
    options: null,
    ...emptySearch(),
    pagesLoading: 0,
    exports: [],
    exportsLoading: false,
    allExports: [],
    allExportsLoading: false,
    order: null,
    loading: false,
    error: "",
  }),

  getters: {
    api: (state): ReplayExportApi => (state.mode === "store" ? replayStoreApi : adminReplayExportApi),
  },

  actions: {
    /** Before the page shows: the data of the other mode must not show on this page. */
    setMode(mode: ReplayExportMode) {
      if (this.mode === mode) return;
      this.leave();
      this.mode = mode;
      this.options = null;
    },

    /**
     * The user leaves the page (or signs out): the form starts empty on the next visit, and the data of this
     * visit goes. Answers that are still on the way are dropped.
     */
    leave() {
      visit++;
      this.clearSearch();
      this.closeOrder();
      this.exports = [];
      this.loading = false;
      this.exportsLoading = false;
      this.pagesLoading = 0;
    },

    async loadOptions(gameMode: EGameMode) {
      const request = ++optionsRequests;
      const thisVisit = visit;
      try {
        const options = await this.api.getOptions(useOauthStore().token, gameMode);
        if (request === optionsRequests && thisVisit === visit) this.options = options;
      } catch (e) {
        if (request === optionsRequests && thisVisit === visit) this.error = replayExportError(e);
      }
    },

    async loadExports() {
      const token = useOauthStore().token;
      // The store page shows to users who are not signed in: they have no history.
      if (!token) {
        this.exports = [];
        return;
      }
      const thisVisit = visit;
      this.exportsLoading = true;
      try {
        const exports = await this.api.getHistory(token);
        if (thisVisit === visit) this.exports = exports;
      } catch (e) {
        if (thisVisit === visit) this.error = replayExportError(e);
      } finally {
        if (thisVisit === visit) this.exportsLoading = false;
      }
    },

    async loadAllExports() {
      this.allExportsLoading = true;
      try {
        this.allExports = await ReplayExportService.getAllExports(useOauthStore().token);
      } catch (e) {
        this.error = replayExportError(e);
      } finally {
        this.allExportsLoading = false;
      }
    },

    async loadPreview(filter: ReplayExportFilter, description: string) {
      const thisVisit = visit;
      this.loading = true;
      this.error = "";
      try {
        const preview = await this.api.preview(useOauthStore().token, filter);
        if (thisVisit !== visit) return;
        this.matchesById = Object.fromEntries(preview.matches.map((m) => [m.id, m]));
        this.preview = preview;
        this.previewFilter = filter;
        this.previewDescription = description;
      } catch (e) {
        if (thisVisit === visit) this.error = replayExportError(e);
      } finally {
        if (thisVisit === visit) this.loading = false;
      }
    },

    /**
     * Loads the games of a table page that are not loaded yet. The list of a search holds only their ids.
     * Returns false when the request failed.
     */
    async loadMatches(matchIds: string[]): Promise<boolean> {
      const missing = matchIds.filter((id) => !(id in this.matchesById));
      if (missing.length === 0) return true;
      const thisVisit = visit;
      this.pagesLoading++;
      try {
        const matches = await this.api.matches(useOauthStore().token, missing);
        if (thisVisit !== visit) return false;
        for (const match of matches) this.matchesById[match.id] = match;
        // A game that is gone since the search leaves the list. The next games move up into the page.
        const gone = new Set(missing.filter((id) => !(id in this.matchesById)));
        if (gone.size > 0 && this.preview) this.preview.matchIds = this.preview.matchIds.filter((id) => !gone.has(id));
        return true;
      } catch (e) {
        if (thisVisit === visit) this.error = replayExportError(e);
        return false;
      } finally {
        if (thisVisit === visit) this.pagesLoading--;
      }
    },

    /** Forgets the search and its games, for example when the user leaves the page. */
    clearSearch() {
      Object.assign(this, emptySearch());
      this.error = "";
    },

    /** Admin: starts the browser download of the selected games. Returns the ticket (count and price), or null. */
    async download(matchIds: string[], label: string): Promise<ReplayExportTicket | null> {
      this.error = "";
      try {
        const token = useOauthStore().token;
        const ticket = await ReplayExportService.createTicket(token, matchIds, this.previewFilter, label, this.previewDescription);
        return startDownload(this.api, ticket);
      } catch (e) {
        this.error = replayExportError(e);
        return null;
      }
    },

    /**
     * Store: saves the order of the selected games and opens the Stripe payment page. Returns false when the
     * page did not open; then `error` says why.
     */
    async checkout(matchIds: string[], label: string): Promise<boolean> {
      this.error = "";
      const thisVisit = visit;
      try {
        const token = useOauthStore().token;
        const checkout = await ReplayStoreService.checkout(token, matchIds, this.previewFilter, label, this.previewDescription);
        // The user went to another page in the meantime: no payment page.
        if (thisVisit !== visit) return false;
        window.location.assign(checkout.url);
        return true;
      } catch (e) {
        if (thisVisit === visit) this.error = replayExportError(e);
        return false;
      }
    },

    /**
     * Store: the order that the buyer came back with from the payment page. `error` is "" when the server
     * answered, else the text; the page shows it, because it asks again. `final`: asking again gives the same
     * error (the order does not exist, no access, sign-in expired).
     */
    async confirmOrder(orderId: string): Promise<{ error: string; final: boolean }> {
      const [thisVisit, version] = [visit, orderVersion];
      try {
        const order = await ReplayStoreService.confirmOrder(useOauthStore().token, orderId);
        if (thisVisit === visit && version === orderVersion) this.order = order;
        return { error: "", final: false };
      } catch (e) {
        const final = e instanceof HttpError && e.status >= 400 && e.status < 500 && e.status !== 408 && e.status !== 429;
        return { error: replayExportError(e), final };
      }
    },

    /** Store: the buyer closed the order. */
    closeOrder() {
      orderVersion++;
      this.order = null;
    },

    /**
     * Downloads an entry of the history: a past download (admin) or a purchase (store). `asAdmin` for a
     * download of another user. Returns the number of replays, or 0.
     */
    async downloadAgain(exportId: string, asAdmin = false): Promise<number> {
      this.error = "";
      try {
        const token = useOauthStore().token;
        const ticket = asAdmin
          ? await ReplayExportService.createAdminRepeatTicket(token, exportId)
          : await this.api.createHistoryTicket(token, exportId);
        return startDownload(this.api, ticket).count;
      } catch (e) {
        this.error = replayExportError(e);
        return 0;
      }
    },
  },
});
