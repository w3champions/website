import { moduleActionContext } from "../..";
import { RootState } from "../../typings";
import { ActionContext } from "vuex";
import { ITournament, ITournamentPlayer } from "@/store/tournaments/types";
import { useOauthStore } from "@/store/oauth/store";
import TournamentsService from "@/services/TournamentsService";

interface AdminTournamentsState {
  upcomingTournament: ITournament;
  isLoading: boolean;
}

const mod = {
  namespaced: true,
  state: {
    upcomingTournament: {} as ITournament,
    isLoading: false,
  } as AdminTournamentsState,
  actions: {
    async loadUpcomingTournament(context: ActionContext<AdminTournamentsState, RootState>) {
      const { commit } = moduleActionContext(context, mod);
      const data = await TournamentsService.getUpcomingTournament();
      commit.SET_UPCOMING_TOURNAMENT(data.tournament);
    },
    async registerPlayer(context: ActionContext<AdminTournamentsState, RootState>, player: ITournamentPlayer): Promise<boolean> {
      const {  commit, state } = moduleActionContext(context, mod);
      const oauthStore = useOauthStore();
      const token = oauthStore.token;
      commit.SET_IS_LOADING(true);
      const registered = await TournamentsService.registerPlayer(state.upcomingTournament.id, player, token);
      commit.SET_IS_LOADING(false);
      return registered;
    },
    async unregisterPlayer(context: ActionContext<AdminTournamentsState, RootState>, battleTag: string): Promise<boolean> {
      const {  commit, state } = moduleActionContext(context, mod);
      const oauthStore = useOauthStore();
      const token = oauthStore.token;
      commit.SET_IS_LOADING(true);
      const registered = await TournamentsService.unregisterPlayer(state.upcomingTournament.id, battleTag, token);
      commit.SET_IS_LOADING(false);
      return registered;
    },
    async createTournament(context: ActionContext<AdminTournamentsState, RootState>, tournament: ITournament): Promise<boolean> {
      const {  commit } = moduleActionContext(context, mod);
      const oauthStore = useOauthStore();
      const token = oauthStore.token;
      commit.SET_IS_LOADING(true);
      const created = await TournamentsService.createTournament(tournament, token);
      commit.SET_IS_LOADING(false);
      return created;
    },
    async updateTournament(context: ActionContext<AdminTournamentsState, RootState>, tournament: ITournament): Promise<boolean> {
      const { commit } = moduleActionContext(context, mod);
      const oauthStore = useOauthStore();
      const token = oauthStore.token;
      commit.SET_IS_LOADING(true);
      const updated = await TournamentsService.updateTournament(tournament, token);
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
