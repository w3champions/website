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
// One number per page visit: a write that settles after its page was left drops its error and reload.
const visits = requestSequence();

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
      visits.invalidate();
      resetKeepingWrite(this);
    },

    /** The page was left: writes still in flight no longer report into it, and its last write error is not shown again. */
    endVisit(): void {
      visits.invalidate();
      this.error = "";
    },

    async terminate(matchId: string): Promise<boolean> {
      const visit = visits.current();
      let refreshed = false;
      // UNKNOWN_GAME (it ended meanwhile) is a state conflict: runAdminWrite reloads the list, as after an uncertain answer.
      const terminated = await runAdminWrite(this, "other", () => commercialEventsService().terminateGame(token(), matchId).then(() => true), () => {
        refreshed = true;
        return this.load();
      }, visits);
      if (terminated) {
        // matchmaking marks the game terminated before it answers, so a fresh list no longer has it.
        this.games = this.games.filter((game) => game.matchId !== matchId);
        this.supersedePendingLoad();
      } else if (!refreshed && visits.isLatest(visit)) {
        // Any other refusal too: TERMINATE_FAILED can come after the flo cancel, with the game already marked terminated.
        void this.load();
      }
      return terminated ?? false;
    },
  },
});
