import { moduleActionContext } from "..";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import {OauthState} from "@/store/oauth/types";

const mod = {
  namespaced: true,
  state: {
    code: "",
    bearer: "",
    blizzardVerifiedBtag: ""
  } as OauthState,
  actions: {
    async authorizeWithCode(
        context: ActionContext<OauthState, RootState>,
        code: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const bearer = await rootGetters.oauthService.authorize(code);
      const profileName = await rootGetters.oauthService.getProfileName(bearer);

      commit.SET_BEARER(bearer);
      commit.SET_PROFILE_NAME(profileName);
    }
  },
  mutations: {
    SET_BEARER(state: OauthState, code: string) {
      state.bearer = code;
    },
    SET_PROFILE_NAME(state: OauthState, btag: string) {
      state.blizzardVerifiedBtag = btag;
    }
  }
} as const;

export default mod;
