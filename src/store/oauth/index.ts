import { moduleActionContext } from "..";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import { OauthState, TwitchToken } from "@/store/oauth/types";

const mod = {
  namespaced: true,
  state: {
    code: "",
    blizzardVerifiedBtag: "",
    token: "",
    twitch_token: {} as TwitchToken,
    isAdmin: false,
  } as OauthState,
  actions: {
    async authorizeWithCode(
      context: ActionContext<OauthState, RootState>,
      code: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const bearer = await rootGetters.oauthService.authorize(code);
      commit.SET_BEARER(bearer.token);

      const profile = await rootGetters.oauthService.getProfile(
        bearer.token
      );

      if (profile) {
        commit.SET_PROFILE_NAME(profile.battleTag);
        commit.SET_IS_ADMIN(profile.isAdmin);
        await rootGetters.oauthService.saveAuthToken(bearer);
      }

      rootGetters.oauthService.deleteAuthCookie();
    },
    async authorizeWithTwitch(context: ActionContext<OauthState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const token = await rootGetters.oauthService.authorizeWithTwitch();
      commit.SET_TWITCH_TOKEN(token);
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

      const profile = await rootGetters.oauthService.getProfile(bearerToken);

      if (profile) {
        commit.SET_PROFILE_NAME(profile.battleTag);
        commit.SET_IS_ADMIN(profile.isAdmin);
        await rootGetters.oauthService.saveAuthToken(profile);
      } else {
        rootGetters.oauthService.deleteAuthCookie();
        commit.SET_PROFILE_NAME("");
        commit.SET_IS_ADMIN(false);
        commit.SET_BEARER("");
      }
    },
    logout(context: ActionContext<OauthState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      rootGetters.oauthService.deleteAuthCookie();
      commit.SET_PROFILE_NAME("");
      commit.SET_IS_ADMIN(false);
      commit.SET_BEARER("");
    },
  },
  mutations: {
    SET_BEARER(state: OauthState, token: string) {
      state.token = token;
    },
    SET_TWITCH_TOKEN(state: OauthState, token: TwitchToken) {
      state.twitch_token = token;
    },
    SET_PROFILE_NAME(state: OauthState, btag: string) {
      state.blizzardVerifiedBtag = btag;
    },
    SET_IS_ADMIN(state: OauthState, isAdmin: boolean) {
      state.isAdmin = isAdmin;
    },
  },
} as const;

export default mod;
