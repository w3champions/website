import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { describeCommercialEventsError } from "./errors";
import { requestSequence } from "./latest";
import { commercialEventsService } from "./service";
import type { ActiveEventGame } from "./types";
import { runAdminWrite } from "./write";

interface ActiveGamesState {
  games: ActiveEventGame[];
  loading: boolean;
  loadError: string;
  saving: boolean;
  error: string;
}

function token(): string {
  return useOauthStore().token;
}

const loads = requestSequence();

/** Running event games of every event (Terminate). */
export const useCommercialEventActiveGamesStore = defineStore("commercialEventActiveGames", {
  state: (): ActiveGamesState => ({
    games: [],
    loading: false,
    loadError: "",
    saving: false,
    error: "",
  }),

  actions: {
    async load(): Promise<void> {
      const request = loads.next();
      this.loading = true;
      this.loadError = "";
      try {
        const games = await commercialEventsService().getActiveGames(token());
        if (loads.isLatest(request)) this.games = games;
      } catch (e) {
        console.error("Failed to load active event games:", e);
        if (loads.isLatest(request)) {
          this.loadError = describeCommercialEventsError(e);
          this.games = [];
        }
      } finally {
        if (loads.isLatest(request)) this.loading = false;
      }
    },

    /** Drops the list and every pending list response. */
    clear(): void {
      loads.invalidate();
      this.$reset();
    },

    async terminate(matchId: string): Promise<boolean> {
      const terminated = await runAdminWrite(this, "other", () => commercialEventsService().terminateGame(token(), matchId).then(() => true));
      if (terminated) {
        // A list request that started before the terminate could still bring the game back.
        loads.invalidate();
        this.loading = false;
        this.games = this.games.filter((game) => game.matchId !== matchId);
      } else {
        // The game may have ended meanwhile (UNKNOWN_GAME): show the current list.
        void this.load();
      }
      return terminated ?? false;
    },
  },
});
