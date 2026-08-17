import { defineStore } from "pinia";
import { API_URL } from "@/config/env";
import { useOauthStore } from "@/store/oauth/store";
import { LagReportService } from "@/services/admin/LagReportService";
import { LagReportAggregateBucket, LagReportAggregateParams, LagReportQueryParams, LagReportsState } from "./types";

// Lazy singleton: constructing at module-load time would read API_URL before the
// module graph has finished initializing. Defer to first call.
let _service: LagReportService | null = null;
function getService(): LagReportService {
  return _service ??= new LagReportService({ endpoint: API_URL });
}

// Bumped on every call of the matching loader. A response is only committed
// while it is still the newest request, so a slow response for a previous
// page/filter/range cannot overwrite the state the user has since moved to.
let selectedReportSeq = 0;
let reportsSeq = 0;
let nodeDaySeq = 0;
let battleTagSeq = 0;

export const useLagReportsStore = defineStore("lagReports", {
  state: (): LagReportsState => ({
    reports: [],
    total: 0,
    loading: false,
    reportsError: null,
    selectedReport: null,
    selectedReportLoading: false,
    selectedReportError: null,
    nodeDayBuckets: [],
    nodeDayLoading: false,
    nodeDayError: false,
    battleTagCounts: new Map(),
  }),

  getters: {
    // Aggregation-backed, range-scoped, top-500 capped (submissions-first
    // ranked, so real submitters survive the cap; a player beyond it can miss
    // a badge, never wear a wrong one). Submissions drive every repeat-shaped
    // number — appearance counts track activity, not distress, and are
    // context only.
    playerSubmittedCounts(state): Map<string, number> {
      const counts = new Map<string, number>();
      for (const [tag, bucket] of state.battleTagCounts) {
        counts.set(tag, bucket.submittedCount ?? 0);
      }
      return counts;
    },
    playerAppearanceCounts(state): Map<string, number> {
      const counts = new Map<string, number>();
      for (const [tag, bucket] of state.battleTagCounts) {
        counts.set(tag, bucket.count);
      }
      return counts;
    },
  },

  actions: {
    async loadReports(params: LagReportQueryParams) {
      const seq = ++reportsSeq;
      this.loading = true;
      this.reportsError = null;
      try {
        const oauthStore = useOauthStore();
        const response = await getService().getReports(oauthStore.token, params);
        if (seq !== reportsSeq) return;
        this.reports = response.items;
        this.total = response.total;
      } catch (e) {
        if (seq !== reportsSeq) return;
        // The service now throws on a non-OK status instead of parsing the error
        // body as if it were a page of results. Record it so the list can say so.
        this.reportsError = e instanceof Error ? e.message : String(e);
        this.reports = [];
        this.total = 0;
      } finally {
        if (seq === reportsSeq) this.loading = false;
      }
    },

    // Blank the table ahead of a deliberate context switch (the group→list
    // bridge), so the new context shows a spinner rather than the old rows.
    clearReports() {
      this.reports = [];
      this.total = 0;
    },

    // One-shot page fetch that bypasses the list state — the grouped view uses
    // it to load one group's rows on expand without disturbing the flat list.
    async fetchReportsOnce(params: LagReportQueryParams) {
      const oauthStore = useOauthStore();
      return await getService().getReports(oauthStore.token, params);
    },

    // One-shot aggregation fetch. Throws on failure — every caller decides for
    // itself whether that means an error state or a silent degrade.
    async fetchAggregate(params: LagReportAggregateParams): Promise<LagReportAggregateBucket[]> {
      const oauthStore = useOauthStore();
      const response = await getService().getAggregate(oauthStore.token, params);
      return response.buckets;
    },

    async loadNodeDay(params: Omit<LagReportAggregateParams, "groupBy">) {
      const seq = ++nodeDaySeq;
      this.nodeDayLoading = true;
      try {
        const buckets = await this.fetchAggregate({ ...params, groupBy: "node-day" });
        if (seq !== nodeDaySeq) return;
        this.nodeDayBuckets = buckets;
        this.nodeDayError = false;
      } catch (_e) {
        if (seq !== nodeDaySeq) return;
        // An empty result and a failed request must not look alike — the view
        // renders this flag instead of a false "no reports match".
        this.nodeDayBuckets = [];
        this.nodeDayError = true;
      } finally {
        if (seq === nodeDaySeq) this.nodeDayLoading = false;
      }
    },

    // Per-player report counts for the repeat badges. Scoped to the date window
    // and the server filter — a badge means "reports in the shown range, within
    // the current server scope" — and deliberately nothing else, so unrelated
    // narrowing (a category, a proxy) doesn't change what the number means.
    async loadBattleTagCounts(scope: Pick<LagReportAggregateParams, "dateFrom" | "dateTo" | "serverNames" | "serverNodeIds">) {
      const seq = ++battleTagSeq;
      try {
        const buckets = await this.fetchAggregate({ ...scope, groupBy: "battleTag", limit: 500 });
        if (seq !== battleTagSeq) return;
        this.battleTagCounts = new Map(
          buckets.filter((b) => b.battleTag).map((b) => [b.battleTag as string, b]),
        );
      } catch (_e) {
        // Badges are annotations over rows that render fine without them;
        // honest absence beats stale numbers.
        if (seq === battleTagSeq) this.battleTagCounts = new Map();
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
