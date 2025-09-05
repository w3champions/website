<template>
  <v-container class="patreon-callback">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" md="6">
        <v-card class="text-center">
          <v-card-title class="justify-center">
            {{ $t("views_patreon_callback.title") }}
          </v-card-title>

          <v-card-text>
            <div v-if="isProcessing">
              <v-progress-circular
                :size="100"
                color="primary"
                indeterminate
                class="mb-4"
              />
              <p>{{ $t("views_patreon_callback.processing") }}</p>
            </div>

            <div v-else-if="isSuccess">
              <v-icon color="success" size="100" class="mb-4">
                mdi-check-circle
              </v-icon>
              <h2 class="mb-2">{{ $t("views_patreon_callback.success_title") }}</h2>
              <p>{{ $t("views_patreon_callback.success_message") }}</p>
              <div v-if="patreonEmail" class="mt-2">
                <strong>{{ $t("views_patreon_callback.linked_email") }}:</strong> {{ patreonEmail }}
              </div>
            </div>

            <div v-else-if="errorMessage">
              <v-icon color="error" size="100" class="mb-4">
                mdi-alert-circle
              </v-icon>
              <h2 class="mb-2">{{ $t("views_patreon_callback.error_title") }}</h2>
              <p>{{ errorMessage }}</p>
            </div>
          </v-card-text>

          <v-card-actions class="justify-center">
            <v-btn
              :disabled="isProcessing"
              @click="goToRewards"
            >
              {{ $t("views_patreon_callback.go_to_rewards") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router/composables";
import { useOauthStore } from "@/store/oauth/store";
import { useRewardsStore } from "@/store/rewards/store";

export default defineComponent({
  name: "PatreonCallback",
  setup() {
    const router = useRouter();
    const route = useRoute();
    const oauthStore = useOauthStore();
    const rewardsStore = useRewardsStore();

    const isProcessing = ref(true);
    const isSuccess = ref(false);
    const errorMessage = ref("");
    const patreonEmail = ref("");

    const authCode = computed(() => oauthStore.token);

    async function processCallback() {
      try {
        // Ensure auth token is loaded from cookies
        await oauthStore.loadAuthCodeToState();
        
        // Check if user is authenticated
        if (!authCode.value) {
          throw new Error("User not authenticated. Please log in first.");
        }

        // Extract code and state from URL parameters
        const code = route.query.code as string;
        const state = route.query.state as string;
        const error = route.query.error as string;

        // Check for OAuth error
        if (error) {
          throw new Error(`Patreon OAuth error: ${error}`);
        }

        // Validate required parameters
        if (!code) {
          throw new Error("Authorization code not found in callback URL");
        }

        if (!state) {
          throw new Error("State parameter not found in callback URL");
        }

        // Validate state parameter
        const storedState = localStorage.getItem("patreon_oauth_state");
        if (!storedState || storedState !== state) {
          throw new Error("Invalid state parameter - possible CSRF attack");
        }

        // Clear the stored state
        localStorage.removeItem("patreon_oauth_state");

        // Complete the OAuth flow
        const linkResult = await rewardsStore.completePatreonOAuth(code, state, authCode.value);

        isSuccess.value = true;
        patreonEmail.value = linkResult.patreonEmail || "";

        // Reload rewards data after successful linking
        await rewardsStore.loadUserRewards(authCode.value);

      } catch (error: any) {
        console.error("Patreon callback error:", error);
        errorMessage.value = error.message || "An unexpected error occurred";
        isSuccess.value = false;
      } finally {
        isProcessing.value = false;
      }
    }

    function goToRewards() {
      router.push({ name: "Rewards" });
    }

    onMounted(() => {
      processCallback();
    });

    return {
      isProcessing,
      isSuccess,
      errorMessage,
      patreonEmail,
      goToRewards,
    };
  },
});
</script>

<style lang="scss" scoped>
.patreon-callback {
  min-height: 100vh;
}

.fill-height {
  min-height: 50vh;
}
</style>