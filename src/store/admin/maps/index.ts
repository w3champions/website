import { moduleActionContext } from "../..";
import { RootState } from "../../typings";
import { ActionContext } from "vuex";
import {
  AdminMapsState
} from "./types";
const mod = {
  namespaced: true,
  state: {
    // state variables
  } as AdminMapsState,

  actions: {
    async loadAllMaps(context: ActionContext<AdminMapsState, RootState>) {
      const { rootGetters, rootState } = moduleActionContext(context, mod);

      // await rootGetters.adminService.getAllMaps(rootState.oauth.token);
    },
    // some actions
  },

  mutations: {
    // mutations
    // SET_SOME_STATE(state: AdminMapsState, placeholder: string) {
    //   state.placeholder = placeholder;
    // },
  },
} as const;

export default mod;
