import type { BnetOAuthRegion, OauthState, TwitchToken } from "@/store/oauth/types";
import { defineStore } from "pinia";
import AuthorizationService from "@/services/AuthorizationService";

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
    async authorizeWithCode(code: string) {
      const region = AuthorizationService.loadAuthRegionCookie();
      // Only the exchange itself can fail the login: authorize() throws on !response.ok
      // (surfacing the IdP error code). Once it resolves, the IdP issued a valid token.
      const bearer = await AuthorizationService.authorize(code, region);

      this.SET_BEARER(bearer.jwt);

      // Persist the cookie immediately on a successful exchange — the login IS
      // successful at this point; persistence must NOT depend on the secondary
      // profile fetch. saveAuthToken only writes the cookie/region (no network).
      AuthorizationService.saveAuthToken(bearer);

      // The profile fetch is BEST-EFFORT: it only fills the in-memory battletag/admin
      // state. A transient failure (5xx, network/CORS, JSON throw) must NOT reject
      // authorizeWithCode and thereby fail a login whose session is already valid and
      // saved. The battletag fills later via App.vue's status-aware bootstrap on the
      // destination route. So swallow any error here and treat a null profile as a no-op.
      try {
        const profile = await AuthorizationService.getProfile(bearer.jwt);
        if (profile) {
          this.SET_PROFILE_NAME(profile.battleTag);
          this.SET_IS_ADMIN(profile.isAdmin);
          if (profile.isAdmin) {
            this.SET_PERMISSIONS(profile.permissions);
          }
        }
      } catch {
        // Best-effort — ignore; the session is already valid and persisted.
      }
    },
    async authorizeWithTwitch() {
      const token = await AuthorizationService.authorizeWithTwitch();
      this.SET_TWITCH_TOKEN(token);
    },
    loadAuthCodeToState() {
      const bearer = AuthorizationService.loadAuthCookie();
      this.SET_BEARER(bearer);
    },
    async loadBlizzardBtag(bearerToken: string): Promise<"valid" | "invalid" | "error"> {
      // Already in flight — report transient so callers don't treat it as a verified
      // session (the in-flight call owns the real outcome).
      if (this.isLoadingBlizzardBtag) return "error";
      this.SET_IS_LOADING_BLIZZARD_BTAG(true);
      try {
        // Status-aware so a transient backend blip (5xx / network) does NOT log the
        // user out: getProfile collapses every non-200 to null, which previously
        // triggered logout() on any error. Only a DEFINITIVE auth failure (401/403)
        // means the token is stale and should be cleared; on a transient "error" we
        // keep the existing session untouched (battletag fills on a later load).
        const status = await AuthorizationService.validateSession(bearerToken);

        if (status === "invalid") {
          this.logout();
          return "invalid";
        }

        if (status === "error") {
          // Transient — leave the session as-is, don't clear the cookie/state.
          return "error";
        }

        // Valid token — fetch and apply the profile. (getProfile re-hits user-info;
        // null here would only happen on a race where the token just became invalid,
        // in which case we deliberately do nothing rather than log out on ambiguity.)
        const profile = await AuthorizationService.getProfile(bearerToken);
        if (profile) {
          this.SET_PROFILE_NAME(profile.battleTag);
          this.SET_IS_ADMIN(profile.isAdmin);
          if (profile.isAdmin) {
            this.SET_PERMISSIONS(profile.permissions);
          }
          AuthorizationService.saveAuthToken(profile);
        }
        return "valid";
      } finally {
        this.SET_IS_LOADING_BLIZZARD_BTAG(false);
      }
    },
    saveLoginRegion(region: BnetOAuthRegion) {
      AuthorizationService.saveAuthRegion(region);
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
    },
    SET_PERMISSIONS(permissions: string[]): void {
      this.permissions = permissions;
    },
    SET_IS_LOADING_BLIZZARD_BTAG(val: boolean): void {
      this.isLoadingBlizzardBtag = val;
    },
  },
});
