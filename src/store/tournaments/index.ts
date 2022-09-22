import { moduleActionContext } from "..";
import { ActionContext } from "vuex";
import { TournamentsState, ITournament } from "./types";
import { RootState } from "../typings";

const mod = {
  namespaced: true,
  state: {
    loaded: false,
    tournaments: [],
  } as TournamentsState,
  actions: {
    async retrieveTournaments(
      context: ActionContext<TournamentsState, RootState>
    ) {
      const { commit, rootGetters, state } = moduleActionContext(context, mod);

      if (state.loaded) {
        return
      }

      const response = await rootGetters.tournamentsService.getTournaments();
      commit.SET_TOURNAMENTS(response.tournaments);
    },
  },
  mutations: {
    SET_TOURNAMENTS(state: TournamentsState, tournaments: ITournament[]) {
      state.tournaments = tournaments;
      state.loaded = true;
    },
  },
} as const;

export default mod;
