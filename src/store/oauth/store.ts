import { BnetOAuthRegion, OauthState, TwitchToken } from "@/store/oauth/types";
import { defineStore } from "pinia";
import AuthorizationService from "@/services/AuthorizationService";
import { VueCookies } from "vue-cookies";

const w3CAuth = "W3ChampionsJWT";
const w3CAuthRegion = "W3ChampionsAuthRegion";

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
    async authorizeWithCode(code: string, cookies: VueCookies | undefined) {
      const region = cookies?.get(w3CAuthRegion) ?? "";
      const bearer = await AuthorizationService.authorize(code, region);

      this.SET_BEARER(bearer.jwt);

      const profile = await AuthorizationService.getProfile(bearer.jwt);
      if (profile) {
        this.SET_PROFILE_NAME(profile.battleTag);
        this.SET_IS_ADMIN(profile.isAdmin);
        if (profile.isAdmin) {
          this.SET_PERMISSIONS(profile.permissions);
        }
        cookies?.set(w3CAuth, bearer.jwt, Infinity); // Cookie never expires
      }
    },
    async authorizeWithTwitch() {
      const token = await AuthorizationService.authorizeWithTwitch();
      this.SET_TWITCH_TOKEN(token);
    },
    async loadAuthCodeToState(cookies: VueCookies | undefined) {
      const bearer = cookies?.get(w3CAuth) ?? "";
      this.SET_BEARER(bearer);
    },
    async loadBlizzardBtag(bearerToken: string, cookies: VueCookies | undefined) {
      if (this.isLoadingBlizzardBtag) return;
      this.SET_IS_LOADING_BLIZZARD_BTAG(true);
      const profile = await AuthorizationService.getProfile(bearerToken);

      if (profile) {
        this.SET_PROFILE_NAME(profile.battleTag);
        this.SET_IS_ADMIN(profile.isAdmin);
        if (profile.isAdmin) {
          this.SET_PERMISSIONS(profile.permissions);
        }
        cookies?.set(w3CAuth, profile.jwt, Infinity); // Cookie never expires
      } else {
        this.logout(cookies);
      }
      this.SET_IS_LOADING_BLIZZARD_BTAG(false);
    },
    async saveLoginRegion(region: BnetOAuthRegion, cookies: VueCookies | undefined) {
      cookies?.set(w3CAuthRegion, region, Infinity); // Cookie never expires
    },
    logout(cookies: VueCookies | undefined) {
      cookies?.remove(w3CAuth);
      cookies?.remove(w3CAuthRegion);
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
