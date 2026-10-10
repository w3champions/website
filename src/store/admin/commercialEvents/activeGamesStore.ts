import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { describeCommercialEventsError } from "./errors";
import { loadLatest, requestSequence } from "./latest";
import { commercialEventsService } from "./service";
import type { ActiveEventGame } from "./types";
import { resetKeepingWrite, runAdminWrite } from "./write";

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
    async load(): Promise<boolean> {
      this.loadError = "";
      return await loadLatest(loads, {
        what: "active event games",
        setLoading: (loading) => (this.loading = loading),
        fetch: () => commercialEventsService().getActiveGames(token()),
        apply: (games) => (this.games = games),
        fail: (e) => {
          this.loadError = describeCommercialEventsError(e);
          this.games = [];
        },
      });
    },

    /** After a write applied locally: a list load already in flight may answer with the old state, so supersede it with a fresh one. */
    supersedePendingLoad(): void {
      if (this.loading) void this.load();
    },

    /** Drops the list and every pending list response; a write in flight stays marked. */
    clear(): void {
      loads.invalidate();
      resetKeepingWrite(this);
    },

    async terminate(matchId: string): Promise<boolean> {
      let refreshed = false;
      const terminated = await runAdminWrite(this, "other", () => commercialEventsService().terminateGame(token(), matchId).then(() => true), () => {
        refreshed = true;
        return this.load();
      });
      if (terminated) {
        // matchmaking marks the game terminated before it answers, so a fresh list no longer has it.
        this.games = this.games.filter((game) => game.matchId !== matchId);
        this.supersedePendingLoad();
      } else if (!refreshed) {
        // The game may have ended meanwhile (UNKNOWN_GAME): show the current list.
        void this.load();
      }
      return terminated ?? false;
    },
  },
});
