import { moduleActionContext } from "..";
import { Clan, ClanState } from "./types";
import { RootState } from "../typings";
import { ActionContext } from "vuex";

const mod = {
  namespaced: true,
  state: {
    selectedClan: {},
    playersClan: {},
    clanValidationError: "",
    loading: true,
  } as ClanState,
  actions: {
    async createClan(
      context: ActionContext<ClanState, RootState>,
      clanName: string
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(
        context,
        mod
      );

      commit.SET_LOADING(true);

      const response = await rootGetters.clanService.createClan(
        clanName,
        rootState.oauth.token
      );

      commit.SET_LOADING(true);
      commit.SET_CLAN_ERROR(response);
    },

    async retrieveClan(
      context: ActionContext<ClanState, RootState>,
      clanId: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const response = await rootGetters.clanService.retrieveClan(clanId);

      commit.SET_SELECTED_CLAN(response);
    },

    async retrievePlayersClan(
      context: ActionContext<ClanState, RootState>,
      battleTagId: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const response = await rootGetters.clanService.retrieveClanForPlayer(
        battleTagId
      );

      commit.SET_PLAYERS_CLAN(response);
    },
  },
  mutations: {
    SET_SELECTED_CLAN(state: ClanState, clan: Clan) {
      state.selectedClan = clan;
    },
    SET_PLAYERS_CLAN(state: ClanState, clan: Clan) {
      state.playersClan = clan;
    },
    SET_CLAN_ERROR(state: ClanState, error: string) {
      state.clanValidationError = error;
    },
    SET_LOADING(state: ClanState, loading: boolean) {
      state.loading = loading;
    },
  },
} as const;

export default mod;
