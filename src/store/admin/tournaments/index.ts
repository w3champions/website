import { moduleActionContext } from "../..";
import { RootState } from "../../typings";
import { ActionContext } from "vuex";
import { ITournament, ITournamentPlayer } from "@/store/tournaments/types";

interface AdminTournamentsState {
  upcomingTournament: ITournament;
  isLoading: boolean,
}

const mod = {
  namespaced: true,
  state: {
    upcomingTournament: {} as ITournament,
    isLoading: false,
  } as AdminTournamentsState,
  actions: {
    async loadUpcomingTournament(context: ActionContext<AdminTournamentsState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);
      const data = await rootGetters.tournamentsService.getUpcomingTournament();
      commit.SET_UPCOMING_TOURNAMENT(data.tournament);
    },
    async registerPlayer(context: ActionContext<AdminTournamentsState, RootState>, player: ITournamentPlayer) {
      const { rootGetters, commit, state, rootState } = moduleActionContext(context, mod);
      const token = rootState.oauth.token;
      commit.SET_IS_LOADING(true);
      const registered = await rootGetters.tournamentsService.registerPlayer(state.upcomingTournament.id, player, token);
      commit.SET_IS_LOADING(false);
      return registered;
    },
    async cancelTournament(context: ActionContext<AdminTournamentsState, RootState>) {
      const { rootGetters, commit, state, rootState } = moduleActionContext(context, mod);
      const token = rootState.oauth.token;
      commit.SET_IS_LOADING(true);
      const registered = await rootGetters.tournamentsService.cancelTournament(state.upcomingTournament.id, token);
      commit.SET_IS_LOADING(false);
      return registered;
    },
    async createTournament(context: ActionContext<AdminTournamentsState, RootState>, tournament: ITournament) {
      const { rootGetters, commit, rootState } = moduleActionContext(context, mod);
      const token = rootState.oauth.token;
      commit.SET_IS_LOADING(true);
      const created = await rootGetters.tournamentsService.createTournament(tournament, token);
      commit.SET_IS_LOADING(false);
      return created;
    },
    async updateTournament(context: ActionContext<AdminTournamentsState, RootState>, tournament: ITournament) {
      const { rootGetters, commit, rootState } = moduleActionContext(context, mod);
      const token = rootState.oauth.token;
      commit.SET_IS_LOADING(true);
      const updated = await rootGetters.tournamentsService.updateTournament(tournament, token);
      commit.SET_IS_LOADING(false);
      return updated;
    },
  },
  mutations: {
    SET_UPCOMING_TOURNAMENT(state: AdminTournamentsState, tournament: ITournament) {
      state.upcomingTournament = tournament;
    },
    SET_IS_LOADING(state: AdminTournamentsState, isLoading: boolean) {
      state.isLoading = isLoading;
    },
  },
} as const;

export default mod;
