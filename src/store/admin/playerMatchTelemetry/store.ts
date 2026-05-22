import { defineStore } from "pinia";
import { API_URL } from "@/main";
import { useOauthStore } from "@/store/oauth/store";
import { PlayerMatchTelemetryService } from "@/services/admin/PlayerMatchTelemetryService";
import type { IPlayerMatchTelemetry } from "./types";

interface State {
  telemetry: IPlayerMatchTelemetry | null;
  loading: boolean;
  error: string | null;
}

// Lazy singleton: API_URL lives in @/main and the module graph touches us before
// main.ts has finished initializing its own exports. Constructing the service at
// module-load time would trip a Temporal Dead Zone error on API_URL. Defer
// construction to first call — by then all modules are fully initialized.
let _service: PlayerMatchTelemetryService | null = null;
function getService(): PlayerMatchTelemetryService {
  return _service ??= new PlayerMatchTelemetryService({ endpoint: API_URL });
}

export const usePlayerMatchTelemetryStore = defineStore("playerMatchTelemetry", {
  state: (): State => ({
    telemetry: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchByGame(gameId: number): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        const oauthStore = useOauthStore();
        this.telemetry = await getService().getByGame(oauthStore.token, gameId);
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e);
        this.telemetry = null;
      } finally {
        this.loading = false;
      }
    },
    reset(): void {
      this.telemetry = null;
      this.loading = false;
      this.error = null;
    },
  },
});
