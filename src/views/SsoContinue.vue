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
import { handoffEndpoint, identificationOrigin, isAllowedReturnUrl } from "@/helpers/sso";
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
      const selfUrl = `/sso-continue?return=${encodeURIComponent(returnParam)}`;
      window.sessionStorage.setItem(LOGIN_RETURN_TO_KEY, selfUrl);
      window.dispatchEvent(
        new CustomEvent(OPEN_SIGN_IN_DIALOG_EVENT, {
          detail: { returnTo: selfUrl },
        }),
      );
    }

    async function init(): Promise<void> {
      // validateSession() handles its own fetch throw internally (returns "error"),
      // so a transient failure deterministically shows the error card without an
      // unhandled rejection. This outer try/catch is defense in depth for any other
      // unexpected throw, so the error card renders instead of a hung spinner.
      try {
        const returnParam = route.query["return"] as string | undefined;

        if (!returnParam || !isAllowedReturnUrl(returnParam, identificationOrigin())) {
          errorMessage.value = t("views_sso_continue.error_invalid_return");
          return;
        }

        const cookieJwt = AuthorizationService.loadAuthCookie();

        if (!cookieJwt) {
          // No session at all — send the user through the sign-in flow.
          startColdLogin(returnParam);
          return;
        }

        // A W3ChampionsJWT cookie can still be expired or revoked. The id-service
        // handoff validates exp + signature and returns 401, which would strand the
        // user on a 401 error page. Validate the cookie first against the same
        // /api/oauth/user-info endpoint, but status-aware so a transient outage
        // (5xx / network) isn't mistaken for a stale cookie.
        const sessionState = await AuthorizationService.validateSession(cookieJwt);

        if (sessionState === "invalid") {
          // Genuine auth failure (401/403) — the cookie is stale. Clear it the way
          // the app does (store logout deletes the cookie + resets oauth state),
          // then fall through to the cold-login flow.
          oauthStore.logout();
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
