import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { loadLatest, requestSequence } from "@/store/admin/latest";
import { describeNetDiagError } from "./errors";
import { networkDiagnosticsService } from "./service";
import type { CreateRunRequest, RunDetailDto, RunDto, RunsQuery, TargetsDto } from "./types";

// Module level so `$reset()` cannot rewind them (see store/admin/latest.ts).
const runsSequence = requestSequence();
const runSequence = requestSequence();

interface NetDiagRunsState {
  runs: RunDto[];
  total: number;
  runsLoading: boolean;
  runsError: string;
  targets: TargetsDto | null;
  targetsLoading: boolean;
  targetsError: string;
  runDetail: RunDetailDto | null;
  runLoading: boolean;
  runError: string;
}

export const useNetDiagRunsStore = defineStore("netDiagRuns", {
  state: (): NetDiagRunsState => ({
    runs: [],
    total: 0,
    runsLoading: false,
    runsError: "",
    targets: null,
    targetsLoading: false,
    targetsError: "",
    runDetail: null,
    runLoading: false,
    runError: "",
  }),

  actions: {
    async loadRuns(query: RunsQuery): Promise<boolean> {
      const token = useOauthStore().token;
      return await loadLatest(runsSequence, {
        what: "network diagnostic runs",
        setLoading: (loading) => {
          this.runsLoading = loading;
        },
        fetch: () => networkDiagnosticsService().getRuns(token, query),
        apply: (page) => {
          this.runs = page.items;
          this.total = page.total;
          this.runsError = "";
        },
        fail: (e) => {
          this.runs = [];
          this.total = 0;
          this.runsError = describeNetDiagError(e);
        },
      });
    },

    /** Node list and configured endpoints change only with a deploy, so they are fetched once per app visit. */
    async loadTargets(): Promise<void> {
      if (this.targets !== null || this.targetsLoading) return;
      this.targetsLoading = true;
      this.targetsError = "";
      try {
        this.targets = await networkDiagnosticsService().getTargets(useOauthStore().token);
      } catch (e) {
        console.error("Failed to load network diagnostic targets:", e);
        this.targetsError = describeNetDiagError(e);
      } finally {
        this.targetsLoading = false;
      }
    },

    /** Throws on failure; the form shows the message. */
    async createRun(request: CreateRunRequest): Promise<RunDto> {
      return await networkDiagnosticsService().createRun(useOauthStore().token, request);
    },

    async loadRun(runId: string): Promise<boolean> {
      // Never show another run under this id, not while loading and not after a failure.
      if (this.runDetail?.run.id !== runId) {
        this.runDetail = null;
        this.runError = "";
      }
      const token = useOauthStore().token;
      return await loadLatest(runSequence, {
        what: `network diagnostic run ${runId}`,
        setLoading: (loading) => {
          this.runLoading = loading;
        },
        fetch: () => networkDiagnosticsService().getRun(token, runId),
        apply: (detail) => {
          this.runDetail = detail;
          this.runError = "";
        },
        fail: (e) => {
          this.runError = describeNetDiagError(e);
        },
      });
    },

    /** Throws on failure (409 when already cancelled); reloads the run so the expired assignments show. */
    async cancelRun(runId: string): Promise<void> {
      await networkDiagnosticsService().cancelRun(useOauthStore().token, runId);
      await this.loadRun(runId);
    },
  },
});
