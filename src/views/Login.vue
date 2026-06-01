<template>
  <v-container class="w3-container-width">
    <v-card class="text-center">
      <template v-if="!errorMessage">
        <v-progress-circular
          :size="100"
          color="primary"
          indeterminate
          class="loader"
        >
          <div class="inner-text">{{ $t("views_login.loggingyouin") }}</div>
        </v-progress-circular>
      </template>

      <template v-else>
        <v-card-text role="alert" aria-live="assertive">
          <v-icon color="error" size="100" class="mb-4">
            {{ mdiAlertCircle }}
          </v-icon>
          <h2 class="mb-2">{{ $t("views_login.error_title") }}</h2>
          <p>{{ errorMessage }}</p>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn variant="outlined" @click="goHome">
            {{ $t("views_login.error_cta") }}
          </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-container>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { getProfileUrl } from "@/helpers/url-functions";
import { isAllowedReturnUrl, identificationOrigin } from "@/helpers/sso";
import { LOGIN_RETURN_TO_KEY } from "@/constants/sso";
import { useOauthStore } from "@/store/oauth/store";
import { useRouter, useRoute } from "vue-router";
import { EMainRouteName } from "@/router/types";
import { mdiAlertCircle } from "@mdi/js";

type IdServiceErrorCode =
  | "MISSING_WARCRAFT_3"
  | "MISSING_PLAYABLE_TITLES_SCOPE"
  | "UNSUPPORTED_VERSION"
  | "PLAYABLE_TITLES_API_FAILED";

const ERROR_CODE_MAP: Record<IdServiceErrorCode, string> = {
  MISSING_WARCRAFT_3: "views_login.error_missing_warcraft3",
  MISSING_PLAYABLE_TITLES_SCOPE: "views_login.error_missing_playable_titles_scope",
  UNSUPPORTED_VERSION: "views_login.error_unsupported_version",
  PLAYABLE_TITLES_API_FAILED: "views_login.error_playable_titles_api_failed",
};

export default defineComponent({
  name: "LoginView",
  components: {},
  props: {
    code: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const router = useRouter();
    const route = useRoute();
    const oauthStore = useOauthStore();

    const errorMessage = ref("");

    const account = computed<string>(() => oauthStore.blizzardVerifiedBtag);

    function goHome(): void {
      router.replace({ name: EMainRouteName.HOME });
    }

    function openPlayerProfile(): void {
      router.push({
        path: getProfileUrl(account.value) + "?freshLogin=true",
      });
    }

    // Best-effort retry of the profile load, only when it didn't already load (so it's
    // not a duplicate fetch in the normal case). authorizeWithCode's profile load is
    // best-effort, so a transient failure can leave blizzardVerifiedBtag/isAdmin/
    // permissions unset; this gives any in-SPA destination one more chance to hydrate.
    // loadBlizzardBtag is status-aware (round-10): it won't throw or logout on a
    // transient error, so this never blocks or fails the redirect.
    async function ensureProfileLoaded(): Promise<void> {
      if (!account.value) {
        await oauthStore.loadBlizzardBtag(oauthStore.token);
      }
    }

    async function openRequestedReturnPath(): Promise<void> {
      const returnTo = window.sessionStorage.getItem(LOGIN_RETURN_TO_KEY);
      if (returnTo) {
        window.sessionStorage.removeItem(LOGIN_RETURN_TO_KEY);
        if (isAllowedReturnUrl(returnTo, identificationOrigin())) {
          // External IdP handoff: a full page navigation that reloads the app, so
          // App's bootstrap reruns and hydrates there. No hydration needed here.
          window.location.href = returnTo;
          return;
        }
        // Internal SPA route (admin pages, /sso-continue, …): App's bootstrap already
        // ran on /login and won't rerun after this router.replace, so the destination
        // would render unhydrated (blank admin page) on a transient profile failure.
        // Hydrate first. (/sso-continue only needs the cookie, so the extra best-effort
        // load is harmless and doesn't block or loop the handoff.)
        await ensureProfileLoaded();
        router.replace(returnTo);
        return;
      }

      // Default destination is the player profile, whose URL NEEDS the battletag.
      // Hydrate, then redirect — or fall back to home rather than a broken /player/
      // URL (getProfileUrl("") -> /player/) if the battletag is still missing.
      await ensureProfileLoaded();

      if (account.value) {
        openPlayerProfile();
        return;
      }

      // Still no battletag (persistent transient failure). The user IS logged in
      // (cookie persisted); land on home instead of a broken /player/ URL. The
      // battletag hydrates later via App's status-aware bootstrap on navigation.
      // replace() (matching goHome) so the login callback isn't left in history.
      router.replace({ name: EMainRouteName.HOME });
    }

    function mapErrorCode(rawCode: string): void {
      const upper = rawCode.trim().toUpperCase();
      if (upper === "BNET_CANCELLED") {
        errorMessage.value = t("views_login.error_bnet_cancelled");
        return;
      }
      // Intentional generic fallback: unmapped codes (e.g. the IdP's UNKNOWN_ERROR,
      // a "GENERIC" sentinel, or any future/renamed code) resolve to error_generic.
      const i18nKey = ERROR_CODE_MAP[upper as IdServiceErrorCode];
      errorMessage.value = i18nKey ? t(i18nKey) : t("views_login.error_generic");
    }

    async function init(): Promise<void> {
      // Handle Battle.net cancel or OAuth error passed as query param
      const queryError = route.query.error as string | undefined;
      if (queryError) {
        // The login was cancelled/failed, so the SSO continuation is abandoned. Drop
        // any saved return path so it can't hijack a later unrelated login (only a
        // successful login should consume it, via openRequestedReturnPath()).
        window.sessionStorage.removeItem(LOGIN_RETURN_TO_KEY);
        mapErrorCode("BNET_CANCELLED");
        return;
      }

      try {
        // A resolved authorizeWithCode means the code exchange succeeded and the
        // cookie was persisted — the login IS successful. The profile load inside it
        // is best-effort, so a transient profile/validation blip does NOT fail the
        // login. Redirect unconditionally on success; only a genuine EXCHANGE failure
        // (authorize() throwing) lands in the catch below. openRequestedReturnPath
        // handles the two destinations' real needs (SSO return = cookie only; default
        // player profile = battletag, retried + safe home fallback).
        await oauthStore.authorizeWithCode(props.code);
        await openRequestedReturnPath();
      } catch (error: unknown) {
        // Login failed (id-service error code or generic). As above, clear the saved
        // return path so the abandoned SSO continuation can't redirect a future login.
        window.sessionStorage.removeItem(LOGIN_RETURN_TO_KEY);
        const rawCode = error instanceof Error ? error.message.trim() : "";
        mapErrorCode(rawCode || "GENERIC");
      }
    }

    onMounted((): void => {
      init();
    });

    return {
      errorMessage,
      mdiAlertCircle,
      goHome,
    };
  },
});
</script>

<style lang="scss" scoped>
.inner-text {
  margin: 20px;
  text-align: center;
}

.loader {
  margin: 180px auto;
}
</style>
