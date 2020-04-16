import { moduleActionContext } from "..";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import { BlizzardToken, OauthState } from "@/store/oauth/types";

const mod = {
  namespaced: true,
  state: {
    code: "",
    blizzardVerifiedBtag: "",
    token: {} as BlizzardToken
  } as OauthState,
  actions: {
    async authorizeWithCode(
        context: ActionContext<OauthState, RootState>,
        code: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const bearer = await rootGetters.oauthService.authorize(code);
      await rootGetters.oauthService.saveAuthToken(bearer);
      commit.SET_BEARER(bearer);

      const profileName = await rootGetters.oauthService.getProfileName(bearer.access_token);
      commit.SET_PROFILE_NAME(profileName);
    },
    async loadAuthCodeToState(
        context: ActionContext<OauthState, RootState>
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const bearer = await rootGetters.oauthService.loadAuthCookie();
      commit.SET_BEARER(bearer);
    }
  },
  mutations: {
    SET_BEARER(state: OauthState, token: BlizzardToken) {
      state.token = token;
    },
    SET_PROFILE_NAME(state: OauthState, btag: string) {
      state.blizzardVerifiedBtag = btag;
    }
  }
} as const;

export default mod;
