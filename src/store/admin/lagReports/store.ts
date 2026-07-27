import { defineStore } from "pinia";
import { API_URL } from "@/config/env";
import { useOauthStore } from "@/store/oauth/store";
import { LagReportService } from "@/services/admin/LagReportService";
import { LagReportQueryParams, LagReportsState } from "./types";

// Lazy singleton: constructing at module-load time would read API_URL before the
// module graph has finished initializing. Defer to first call.
let _service: LagReportService | null = null;
function getService(): LagReportService {
  return _service ??= new LagReportService({ endpoint: API_URL });
}

// Bumped on every loadReport call. A response is only committed while it is
// still the newest request, so a slow load for a previous id cannot overwrite
// the report the user has since navigated to.
let selectedReportSeq = 0;

export const useLagReportsStore = defineStore("lagReports", {
  state: (): LagReportsState => ({
    reports: [],
    total: 0,
    loading: false,
    reportsError: null,
    selectedReport: null,
    selectedReportLoading: false,
    selectedReportError: null,
  }),

  actions: {
    async loadReports(params: LagReportQueryParams) {
      this.loading = true;
      this.reportsError = null;
      try {
        const oauthStore = useOauthStore();
        const response = await getService().getReports(oauthStore.token, params);
        this.reports = response.items;
        this.total = response.total;
      } catch (e) {
        // The service now throws on a non-OK status instead of parsing the error
        // body as if it were a page of results. Record it so the list can say so.
        this.reportsError = e instanceof Error ? e.message : String(e);
        this.reports = [];
        this.total = 0;
      } finally {
        this.loading = false;
      }
    },

    async loadReport(id: string) {
      const seq = ++selectedReportSeq;
      this.selectedReportLoading = true;
      // Drop the previous report up front: when this page is reused for another
      // id (see the id watcher in AdminLagReportDetail), leaving the old report
      // in place would render stale data under the new id if the load fails.
      this.selectedReport = null;
      this.selectedReportError = null;
      try {
        const oauthStore = useOauthStore();
        const report = await getService().getReport(oauthStore.token, id);
        if (seq !== selectedReportSeq) return;
        this.selectedReport = report;
      } catch (e) {
        if (seq === selectedReportSeq) {
          this.selectedReportError = e instanceof Error ? e.message : String(e);
        }
        throw e;
      } finally {
        // A superseded request must not clear the flag out from under the newer one.
        if (seq === selectedReportSeq) {
          this.selectedReportLoading = false;
        }
      }
    },
  },
});
