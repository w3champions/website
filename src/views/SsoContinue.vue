<template>
  <v-container>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" md="6">
        <v-card class="text-center pt-1 pb-2">
          <v-card-text>
            <div v-if="!errorMessage && !jwt">
              <v-progress-circular
                :size="100"
                color="primary"
                indeterminate
                class="mb-4"
              />
              <p>{{ $t("views_sso_continue.submitting") }}</p>
            </div>

            <div v-else-if="errorMessage" role="alert" aria-live="assertive">
              <v-icon color="error" size="100" class="mb-4">
                {{ mdiAlertCircle }}
              </v-icon>
              <h2 class="mb-2">{{ $t("views_sso_continue.error_title") }}</h2>
              <p>{{ errorMessage }}</p>
            </div>
          </v-card-text>

          <v-card-actions v-if="errorMessage" class="justify-center">
            <v-btn variant="outlined" @click="goHome">
              {{ $t("views_sso_continue.error_cta") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Hidden POST form submitted programmatically once jwt + validatedReturn are ready -->
    <form
      v-if="jwt && validatedReturn"
      ref="formRef"
      method="POST"
      :action="handoffUrl"
      style="display: none"
    >
      <input type="hidden" name="jwt" :value="jwt" />
      <input type="hidden" name="return" :value="validatedReturn" />
    </form>
  </v-container>
</template>
<script lang="ts">
import { defineComponent, nextTick, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { EMainRouteName } from "@/router/types";
import { handoffEndpoint, identificationOrigin, isAllowedReturnUrl, isJwtExpired } from "@/helpers/sso";
import { LOGIN_RETURN_TO_KEY, OPEN_SIGN_IN_DIALOG_EVENT } from "@/constants/sso";
import { useOauthStore } from "@/store/oauth/store";
import AuthorizationService from "@/services/AuthorizationService";
import { mdiAlertCircle } from "@mdi/js";

export default defineComponent({
  name: "SsoContinueView",
  components: {},
  setup() {
    const { t } = useI18n();
    const route = useRoute();
    const router = useRouter();
    const oauthStore = useOauthStore();

    const errorMessage = ref("");
    const jwt = ref("");
    const validatedReturn = ref("");
    const formRef = ref<HTMLFormElement | null>(null);
    const handoffUrl = handoffEndpoint();

    function goHome(): void {
      router.replace({ name: EMainRouteName.HOME });
    }

    // Bring the user through the Battle.net sign-in flow, then back to
    // /sso-continue to complete the handoff once a fresh cookie is set. Store a
    // PATH (not a full URL) so the post-login router.replace(returnTo) in
    // Login.vue matches this route. Shared by the "no cookie" and the
    // "stale cookie" cases so the cold-login branch isn't duplicated.
    function startColdLogin(returnParam: string): void {
      // Always clear the session first: logout() deletes any (stale) cookie AND
      // resets the in-memory oauth store token. App.vue renders <sign-in-dialog>
      // only under v-if="!authCode", so a leftover store token (e.g. cookie cleared
      // in another tab but token still in memory) would keep the dialog unmounted
      // and the OPEN_SIGN_IN_DIALOG_EVENT would flip showSignInDialog on nothing.
      // Clearing it makes authCode falsy so the dialog mounts and actually opens.
      // logout() is synchronous, so this preserves the expired-path's sync clear.
      oauthStore.logout();

      const selfUrl = `/sso-continue?return=${encodeURIComponent(returnParam)}`;
      window.sessionStorage.setItem(LOGIN_RETURN_TO_KEY, selfUrl);
      window.dispatchEvent(
        new CustomEvent(OPEN_SIGN_IN_DIALOG_EVENT, {
          detail: { returnTo: selfUrl },
        }),
      );
    }

    async function init(): Promise<void> {
      // The first part of this function MUST stay synchronous (no await before the
      // expired-cookie clear). Vue mounts children before parents, so this
      // SsoContinue onMounted runs BEFORE App.vue's onMounted auth bootstrap
      // (loadAuthCodeToState / loadBlizzardBtag). If we awaited before clearing an
      // expired cookie, control would yield back to the event loop and App's
      // bootstrap could read the stale cookie and — because /api/oauth/user-info
      // accepts expired JWTs (200) — re-save it and unmount the sign-in dialog we
      // just opened. Clearing the expired cookie synchronously here means App's
      // later onMounted sees no cookie, so it never restores the stale token.
      //
      // validateSession() handles its own fetch throw internally (returns "error"),
      // so a transient failure deterministically shows the error card without an
      // unhandled rejection. This outer try/catch is defense in depth for any other
      // unexpected throw (incl. a sync throw), so the error card renders instead of
      // a hung spinner.
      try {
        const returnParam = route.query["return"] as string | undefined;

        if (!returnParam || !isAllowedReturnUrl(returnParam, identificationOrigin())) {
          errorMessage.value = t("views_sso_continue.error_invalid_return");
          return;
        }

        const cookieJwt = AuthorizationService.loadAuthCookie();

        if (!cookieJwt) {
          // No session at all — send the user through the sign-in flow (sync).
          startColdLogin(returnParam);
          return;
        }

        if (isJwtExpired(cookieJwt)) {
          // Expired cookie (the most common stale case). Handle it SYNCHRONOUSLY —
          // before any await. startColdLogin() calls oauthStore.logout() first
          // (deletes the cookie + resets oauth state, all sync), so App.vue's later
          // onMounted can't read the stale cookie back.
          startColdLogin(returnParam);
          return;
        }

        // Cookie present and not yet expired. Only now is it safe to await: this is
        // the normal logged-in case where App's bootstrap restoring the cookie is
        // correct. Confirm the signature/validity against /api/oauth/user-info,
        // status-aware so a transient outage (5xx / network) isn't mistaken for a
        // stale cookie. (validateSession re-checks exp too — harmless belt-and-braces.)
        const sessionState = await AuthorizationService.validateSession(cookieJwt);

        if (sessionState === "invalid") {
          // Genuine auth failure (401/403, e.g. revoked/forged) — the cookie is
          // stale. startColdLogin() clears it (logout deletes the cookie + resets
          // oauth state), then opens the sign-in flow.
          startColdLogin(returnParam);
          return;
        }

        if (sessionState === "error") {
          // Transient failure (5xx / network / CORS) — do NOT clear the cookie or
          // start a login loop. Show the error card so the user can retry with
          // their session intact.
          errorMessage.value = t("views_sso_continue.error_generic");
          return;
        }

        // Valid session — submit the handoff form.
        jwt.value = cookieJwt;
        validatedReturn.value = returnParam;
        await nextTick();
        if (!formRef.value) {
          // The hidden form should exist once jwt + validatedReturn are set; if it
          // is somehow missing (future regression), surface an error instead of
          // silently doing nothing.
          errorMessage.value = t("views_sso_continue.error_invalid_return");
          return;
        }
        formRef.value.submit();
      } catch (e) {
        // Unexpected thrown exception (validateSession already absorbs fetch throws).
        // Surface the generic error card so the user isn't stuck on the spinner.
        console.error("[sso-continue] init failed", e);
        errorMessage.value = t("views_sso_continue.error_generic");
      }
    }

    onMounted((): void => {
      init();
    });

    return {
      errorMessage,
      jwt,
      validatedReturn,
      formRef,
      handoffUrl,
      mdiAlertCircle,
      goHome,
    };
  },
});
</script>

<style lang="scss" scoped>
.fill-height {
  min-height: 50vh;
}
</style>
