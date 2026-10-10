import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { describeCommercialEventsError } from "./errors";
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
      this.loading = true;
      this.loadError = "";
      try {
        this.games = await commercialEventsService().getActiveGames(token());
      } catch (e) {
        console.error("Failed to load active event games:", e);
        this.loadError = describeCommercialEventsError(e);
        this.games = [];
      } finally {
        this.loading = false;
      }
    },

    async terminate(matchId: string): Promise<boolean> {
      const terminated = await runAdminWrite(this, "other", () => commercialEventsService().terminateGame(token(), matchId).then(() => true));
      if (terminated) {
        this.games = this.games.filter((game) => game.matchId !== matchId);
      } else {
        // The game may have ended meanwhile (UNKNOWN_GAME): show the current list.
        void this.load();
      }
      return terminated ?? false;
    },
  },
});
