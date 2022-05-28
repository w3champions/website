import { moduleActionContext } from "../..";
import { RootState } from "../../typings";
import { ActionContext } from "vuex";
import {
  AdminMapsState, GetMapsResponse, Map
} from "./types";
const mod = {
  namespaced: true,
  state: {
    totalMaps: 0 as number,
    maps: [] as Map[],
  } as AdminMapsState,

  actions: {
    async loadMaps(context: ActionContext<AdminMapsState, RootState>, filter?: string) {
      const { commit, rootGetters, rootState } = moduleActionContext(context, mod);
      const searchMapsResponse = await rootGetters.mapService.getAllMaps(rootState.oauth.token, filter);
      commit.SET_MAPS(searchMapsResponse);
    },
  },

  mutations: {
    SET_MAPS(state: AdminMapsState, getMapsResponse: GetMapsResponse) {
      state.maps = getMapsResponse?.items ?? [];
      state.totalMaps = getMapsResponse?.total ?? 0;
    },
  },
} as const;

export default mod;
