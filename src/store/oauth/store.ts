import { BnetOAuthRegion, OauthState, TwitchToken } from "@/store/oauth/types";
import { defineStore } from "pinia";
import AuthorizationService from "@/services/AuthorizationService";

export const useOauthStore = defineStore("oauth", {
  state: (): OauthState => ({
    code: "",
    blizzardVerifiedBtag: "",
    token: "",
    twitch_token: {} as TwitchToken,
    isAdmin: false
  }),
  actions: {
    async authorizeWithCode(code: string) {
      const region = await AuthorizationService.loadAuthRegionCookie();
      const bearer = await AuthorizationService.authorize(code, region);

      this.SET_BEARER(bearer.jwt);

      const profile = await AuthorizationService.getProfile(bearer.jwt);
      if (profile) {
        this.SET_PROFILE_NAME(profile.battleTag);
        this.SET_IS_ADMIN(profile.isAdmin);
        await AuthorizationService.saveAuthToken(bearer);
      }

      AuthorizationService.deleteAuthCookie();
    },
    async authorizeWithTwitch() {
      const token = await AuthorizationService.authorizeWithTwitch();
      this.SET_TWITCH_TOKEN(token);
    },
    async loadAuthCodeToState() {
      const bearer = await AuthorizationService.loadAuthCookie();
      this.SET_BEARER(bearer);
    },
    async loadBlizzardBtag(bearerToken: string) {
      const profile = await AuthorizationService.getProfile(bearerToken);

      if (profile) {
        this.SET_PROFILE_NAME(profile.battleTag);
        this.SET_IS_ADMIN(profile.isAdmin);
        await AuthorizationService.saveAuthToken(profile);
      } else {
        AuthorizationService.deleteAuthCookie();
        this.SET_PROFILE_NAME("");
        this.SET_IS_ADMIN(false);
        this.SET_BEARER("");
      }
    },
    async saveLoginRegion(region: BnetOAuthRegion) {
      await AuthorizationService.saveAuthRegion(region);
    },
    logout() {
      AuthorizationService.deleteAuthCookie();
      this.SET_PROFILE_NAME("");
      this.SET_IS_ADMIN(false);
      this.SET_BEARER("");
    },
    SET_BEARER(token: string): void {
      this.token = token;
    },
    SET_TWITCH_TOKEN(token: TwitchToken): void {
      this.twitch_token = token;
    },
    SET_PROFILE_NAME(btag: string): void {
      this.blizzardVerifiedBtag = btag;
    },
    SET_IS_ADMIN(isAdmin: boolean): void {
      this.isAdmin = isAdmin;
    }
  }
});
