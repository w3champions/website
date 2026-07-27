import { defineStore } from "pinia";
import { API_URL } from "@/config/env";
import { useOauthStore } from "@/store/oauth/store";
import { PlayerMatchTelemetryService } from "@/services/admin/PlayerMatchTelemetryService";
import type { IPlayerMatchTelemetry } from "./types";

interface State {
  telemetry: IPlayerMatchTelemetry | null;
  loading: boolean;
  error: string | null;
  // Whether a fetch was actually attempted for the current report. Without this
  // we cannot tell "the game has no telemetry" (404 -> telemetry null) apart from
  // "we never asked", and both render as a silently missing action-latency trace.
  attempted: boolean;
}

// Lazy singleton: API_URL lives in @/main and the module graph touches us before
// main.ts has finished initializing its own exports. Constructing the service at
// module-load time would trip a Temporal Dead Zone error on API_URL. Defer
// construction to first call — by then all modules are fully initialized.
let _service: PlayerMatchTelemetryService | null = null;
function getService(): PlayerMatchTelemetryService {
  return _service ??= new PlayerMatchTelemetryService({ endpoint: API_URL });
}

// Bumped by every fetch, reset and skip. Only the newest request may commit its
// result, so telemetry for a previously viewed report cannot land on this one.
let fetchSeq = 0;

export const usePlayerMatchTelemetryStore = defineStore("playerMatchTelemetry", {
  state: (): State => ({
    telemetry: null,
    loading: false,
    error: null,
    attempted: false,
  }),
  actions: {
    async fetchByGame(gameId: number): Promise<void> {
      const seq = ++fetchSeq;
      this.loading = true;
      this.error = null;
      this.attempted = true;
      try {
        const oauthStore = useOauthStore();
        const telemetry = await getService().getByGame(oauthStore.token, gameId);
        if (seq !== fetchSeq) return;
        this.telemetry = telemetry;
      } catch (e) {
        if (seq !== fetchSeq) return;
        this.error = e instanceof Error ? e.message : String(e);
        this.telemetry = null;
      } finally {
        // A superseded request must not clear the flag out from under the newer one.
        if (seq === fetchSeq) {
          this.loading = false;
        }
      }
    },
    /**
     * Record that no fetch was attempted, and why. Callers use this when they
     * cannot build a request at all (e.g. the report carries no game id) so the
     * reason reaches the UI instead of vanishing.
     */
    skip(reason: string): void {
      fetchSeq++;
      this.telemetry = null;
      this.loading = false;
      this.error = reason;
      this.attempted = false;
    },
    reset(): void {
      fetchSeq++;
      this.telemetry = null;
      this.loading = false;
      this.error = null;
      this.attempted = false;
    },
  },
});
