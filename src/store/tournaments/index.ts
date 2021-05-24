import { moduleActionContext } from "..";
import { ActionContext } from "vuex";
import { TournamentsState, ITournament } from './types';
import { RootState } from '../typings';

const mod = {
  namespaced: true,
  state: {
    tournaments: [],
  } as TournamentsState,
  actions: {
    async retrieveTournaments(
      context: ActionContext<TournamentsState, RootState>,
    ) {
      const { commit, rootGetters } = moduleActionContext(
        context,
        mod
      );

      const response = await rootGetters.tournamentsService.getTournaments();

      commit.SET_TOURNAMENTS(response.tournaments);
    },
    
    async saveTournament(
      context: ActionContext<ITournament, RootState>,
      tournament?: ITournament
    ) {
      if (!tournament) return;
      
      const { dispatch, rootGetters, rootState } = moduleActionContext(
        context,
        mod
      );

      await rootGetters.tournamentsService.updateTournament(
        tournament,
        rootState.oauth.token
      );

      await dispatch.retrieveTournaments();
      
      return tournament;
    },
  },
  mutations: {
    SET_TOURNAMENTS(state: TournamentsState, tournaments: ITournament[]) {
      state.tournaments = tournaments;
    },
  },
} as const;

export default mod;
