import { moduleActionContext } from "..";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import { OauthState } from "@/store/oauth/types";

const mod = {
  namespaced: true,
  state: {
    code: "",
    blizzardVerifiedBtag: "",
    token: "",
  } as OauthState,
  actions: {
    async authorizeWithCode(
      context: ActionContext<OauthState, RootState>,
      code: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const bearer = await rootGetters.oauthService.authorize(code);
      commit.SET_BEARER(bearer.access_token);

      const profileName = await rootGetters.oauthService.getProfileName(
        bearer.access_token
      );
      commit.SET_PROFILE_NAME(profileName);

      await rootGetters.oauthService.saveAuthToken(bearer);
    },
    async loadAuthCodeToState(context: ActionContext<OauthState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const bearer = await rootGetters.oauthService.loadAuthCookie();
      commit.SET_BEARER(bearer);
    },
    async loadBlizzardBtag(
      context: ActionContext<OauthState, RootState>,
      bearerToken: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const profileName = await rootGetters.oauthService.getProfileName(
        bearerToken
      );
      commit.SET_PROFILE_NAME(profileName);
    },
    logout(context: ActionContext<OauthState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      rootGetters.oauthService.deleteAuthCookie();
      commit.SET_PROFILE_NAME("");
      commit.SET_BEARER("");
    },
  },
  mutations: {
    SET_BEARER(state: OauthState, token: string) {
      state.token = token;
    },
    SET_PROFILE_NAME(state: OauthState, btag: string) {
      state.blizzardVerifiedBtag = btag;
    },
  },
} as const;

export default mod;
