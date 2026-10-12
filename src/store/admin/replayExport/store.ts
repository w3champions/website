import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import ReplayExportService from "@/services/admin/ReplayExportService";
import { EGameMode } from "@/store/types";
import { replayExportError } from "./errors";
import { ReplayExportFilter, ReplayExportState, ReplayExportTicket } from "./types";

/** Counts the options requests, so a slow answer for an earlier game mode does not replace a newer one. */
let optionsRequests = 0;

/** Lets the browser download the ZIP: a plain link, so it streams to disk with the native progress. */
function startDownload(ticket: ReplayExportTicket): ReplayExportTicket {
  const link = document.createElement("a");
  link.href = ReplayExportService.downloadUrl(ticket.ticket);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  return ticket;
}

export const useReplayExportStore = defineStore("replayExport", {
  state: (): ReplayExportState => ({
    options: null,
    preview: null,
    previewFilter: null,
    previewDescription: "",
    matchesById: {},
    pagesLoading: 0,
    exports: [],
    exportsLoading: false,
    allExports: [],
    allExportsLoading: false,
    loading: false,
    error: "",
  }),

  actions: {
    async loadOptions(gameMode: EGameMode) {
      const request = ++optionsRequests;
      try {
        const options = await ReplayExportService.getOptions(useOauthStore().token, gameMode);
        if (request === optionsRequests) this.options = options;
      } catch (e) {
        if (request === optionsRequests) this.error = replayExportError(e);
      }
    },

    async loadExports() {
      this.exportsLoading = true;
      try {
        this.exports = await ReplayExportService.getExports(useOauthStore().token);
      } catch (e) {
        this.error = replayExportError(e);
      } finally {
        this.exportsLoading = false;
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
      this.loading = true;
      this.error = "";
      try {
        const preview = await ReplayExportService.preview(useOauthStore().token, filter);
        this.matchesById = Object.fromEntries(preview.matches.map((m) => [m.id, m]));
        this.preview = preview;
        this.previewFilter = filter;
        this.previewDescription = description;
      } catch (e) {
        this.error = replayExportError(e);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Loads the games of a table page that are not loaded yet. The list of a search holds only their ids.
     * Returns false when the request failed.
     */
    async loadMatches(matchIds: string[]): Promise<boolean> {
      const missing = matchIds.filter((id) => !(id in this.matchesById));
      if (missing.length === 0) return true;
      this.pagesLoading++;
      try {
        const matches = await ReplayExportService.matches(useOauthStore().token, missing);
        for (const match of matches) this.matchesById[match.id] = match;
        // A game that is gone since the search leaves the list. The next games move up into the page.
        const gone = new Set(missing.filter((id) => !(id in this.matchesById)));
        if (gone.size > 0 && this.preview) this.preview.matchIds = this.preview.matchIds.filter((id) => !gone.has(id));
        return true;
      } catch (e) {
        this.error = replayExportError(e);
        return false;
      } finally {
        this.pagesLoading--;
      }
    },

    /** Forgets the search and its games, for example when the admin leaves the page. */
    clearSearch() {
      this.preview = null;
      this.previewFilter = null;
      this.previewDescription = "";
      this.matchesById = {};
      this.error = "";
    },

    /** Starts the browser download of the selected games. Returns the ticket (count and price), or null. */
    async download(matchIds: string[], label: string): Promise<ReplayExportTicket | null> {
      this.error = "";
      try {
        const token = useOauthStore().token;
        return startDownload(await ReplayExportService.createTicket(token, matchIds, this.previewFilter, label, this.previewDescription));
      } catch (e) {
        this.error = replayExportError(e);
        return null;
      }
    },

    /** Downloads a past download again; `asAdmin` for a download of another user. Returns the number of replays. */
    async downloadAgain(exportId: string, asAdmin = false): Promise<number> {
      this.error = "";
      try {
        const token = useOauthStore().token;
        const ticket = asAdmin
          ? await ReplayExportService.createAdminRepeatTicket(token, exportId)
          : await ReplayExportService.createRepeatTicket(token, exportId);
        return startDownload(ticket).count;
      } catch (e) {
        this.error = replayExportError(e);
        return 0;
      }
    },
  },
});
