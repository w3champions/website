import { moduleActionContext } from "..";
import {Clan, ClanState} from "./types";
import { RootState } from "../typings";
import { ActionContext } from "vuex";

const mod = {
  namespaced: true,
  state: {
    selectedClan: {},
    clanValidationError: "",
    loading: true,
  } as ClanState,
  actions: {
    async creatClan(
        context: ActionContext<ClanState, RootState>,
        clanName: string) {
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
  },
  mutations: {
    SET_SELECTED_CLAN(state: ClanState, clan: Clan) {
      state.selectedClan = clan;
    },
    SET_CLAN_ERROR(state: ClanState, error: string) {
      state.clanValidationError = error;
    },
    SET_LOADING(state: ClanState, loading: boolean) {
      state.loading = loading;
    }
  },
} as const;

export default mod;
