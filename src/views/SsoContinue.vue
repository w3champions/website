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

            <div v-else-if="errorMessage">
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
import AuthorizationService from "@/services/AuthorizationService";
import { mdiAlertCircle } from "@mdi/js";

export default defineComponent({
  name: "SsoContinueView",
  components: {},
  setup() {
    const { t } = useI18n();
    const route = useRoute();
    const router = useRouter();

    const errorMessage = ref("");
    const jwt = ref("");
    const validatedReturn = ref("");
    const formRef = ref<HTMLFormElement | null>(null);
    const handoffUrl = handoffEndpoint();

    function goHome(): void {
      router.replace({ name: EMainRouteName.HOME });
    }

    async function init(): Promise<void> {
      const returnParam = route.query["return"] as string | undefined;

      if (!returnParam || !isAllowedReturnUrl(returnParam, identificationOrigin())) {
        errorMessage.value = t("views_sso_continue.error_invalid_return");
        return;
      }

      const cookieJwt = AuthorizationService.loadAuthCookie();

      if (cookieJwt) {
        // User is already logged in — submit the handoff form
        jwt.value = cookieJwt;
        validatedReturn.value = returnParam;
        await nextTick();
        formRef.value?.submit();
      } else {
        // User is not logged in — store a PATH (not a full URL) so the post-login
        // router.replace(returnTo) in Login.vue matches this route, then bring it
        // back to /sso-continue to complete the handoff once the cookie is set.
        const selfUrl = `/sso-continue?return=${encodeURIComponent(returnParam)}`;
        window.sessionStorage.setItem("w3-login-return-to", selfUrl);
        window.dispatchEvent(
          new CustomEvent("w3-open-sign-in-dialog", {
            detail: { returnTo: selfUrl },
          }),
        );
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
