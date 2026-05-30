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
      // getProfile() returns null on a 4xx (handled below as a stale cookie), but its
      // underlying fetch can THROW on a network/DNS/CORS failure. Catch any thrown
      // error so the error card renders instead of leaving the spinner hung with an
      // unhandled rejection. The internal early-returns (allowlist reject, cold-login)
      // don't throw, so they keep their existing behaviour.
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
        // user on a 401 error page. Validate the cookie first using the SAME check the
        // app uses on startup (getProfile → null on invalid; the oauth store logs out
        // on null). Only submit the handoff for a confirmed-valid cookie.
        const profile = await AuthorizationService.getProfile(cookieJwt);

        if (!profile) {
          // Stale cookie — clear it the way the app does (store logout deletes the
          // cookie + resets oauth state), then fall through to the cold-login flow.
          oauthStore.logout();
          startColdLogin(returnParam);
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
        // Genuine thrown exception (e.g. getProfile's fetch failed on network/CORS).
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
