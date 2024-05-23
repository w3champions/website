import { BnetOAuthRegion, OauthState, TwitchToken } from "@/store/oauth/types";
import { defineStore } from "pinia";
import AuthorizationService from "@/services/AuthorizationService";
import { VueCookies } from "vue-cookies";

export const useOauthStore = defineStore("oauth", {
  state: (): OauthState => ({
    code: "",
    blizzardVerifiedBtag: "",
    token: "",
    twitch_token: {} as TwitchToken,
    isAdmin: false,
    permissions: [],
    isLoadingBlizzardBtag: false,
  }),
  actions: {
    async authorizeWithCode(code: string, region: BnetOAuthRegion) {
      const bearer = await AuthorizationService.authorize(code, region);

      this.SET_BEARER(bearer.jwt);

      const profile = await AuthorizationService.getProfile(bearer.jwt);
      if (profile) {
        this.SET_PROFILE_NAME(profile.battleTag);
        this.SET_IS_ADMIN(profile.isAdmin);
        if (profile.isAdmin) {
          this.SET_PERMISSIONS(profile.permissions);
        }
      }
    },
    async authorizeWithTwitch() {
      const token = await AuthorizationService.authorizeWithTwitch();
      this.SET_TWITCH_TOKEN(token);
    },
    async loadAuthCodeToState(bearer: string) {
      this.SET_BEARER(bearer);
    },
    async loadBlizzardBtag(bearerToken: string, cookies: VueCookies): Promise<string> {
      if (this.isLoadingBlizzardBtag) return "";
      this.SET_IS_LOADING_BLIZZARD_BTAG(true);
      const profile = await AuthorizationService.getProfile(bearerToken);

      if (profile) {
        this.SET_PROFILE_NAME(profile.battleTag);
        this.SET_IS_ADMIN(profile.isAdmin);
        if (profile.isAdmin) {
          this.SET_PERMISSIONS(profile.permissions);
        }
        cookies.set("W3ChampionsJWT", bearerToken, Infinity); // Cookie never expires
      } else {
        this.logout(cookies);
      }
      this.SET_IS_LOADING_BLIZZARD_BTAG(false);
      return "";
    },
    logout(cookies: VueCookies) {
      cookies.remove("W3ChampionsJWT");
      cookies.remove("W3ChampionsAuthRegion");
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
    },
    SET_PERMISSIONS(permissions: string[]): void {
      this.permissions = permissions;
    },
    SET_IS_LOADING_BLIZZARD_BTAG(val: boolean): void {
      this.isLoadingBlizzardBtag = val;
    }
  }
});
