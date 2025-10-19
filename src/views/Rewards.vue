<template>
  <v-container class="rewards-page">
    <v-row>
      <v-col>
        <!-- Account Information -->
        <v-card class="mb-4">
          <v-card-title>{{ $t("views_rewards.account_info") }}</v-card-title>
          <v-card-text>
            <div v-if="authCode">
              <strong>{{ $t("views_rewards.battlenet_account") }}:</strong> {{ battleTag }}
              <div class="mt-2">
                <strong>{{ $t("views_rewards.patreon_status") }}:</strong>
                <v-chip
                  :color="patreonLinkStatus ? 'success' : 'grey'"
                  small
                  class="ml-2"
                >
                  {{ patreonLinkStatus ? $t("views_rewards.linked") : $t("views_rewards.not_linked") }}
                </v-chip>
              </div>
              <div v-if="patreonEmail" class="mt-2">
                <strong>{{ $t("views_rewards.patreon_email") }}:</strong> {{ patreonEmail }}
              </div>
            </div>
            <div v-else>
              <p>{{ $t("views_rewards.login_required") }}</p>
              <v-btn color="primary" @click="showSignIn = true">
                {{ $t("views_rewards.login_with_battlenet") }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Patreon Linking Section -->
        <v-card v-if="authCode" class="mb-4">
          <v-card-title>{{ $t("views_rewards.patreon_linking") }}</v-card-title>
          <v-card-text>
            <div v-if="!patreonLinkStatus">
              <p>{{ $t("views_rewards.patreon_description") }}</p>
              <v-btn
                :loading="isLinkingPatreon"
                class="mt-2"
                @click="linkWithPatreon"
              >
                <v-icon left>mdi-patreon</v-icon>
                {{ $t("views_rewards.link_with_patreon") }}
              </v-btn>
            </div>
            <div v-else>
              <p>{{ $t("views_rewards.patreon_linked_success") }}</p>
              <v-btn
                color="error"
                text
                :loading="isUnlinkingPatreon"
                class="mt-2"
                @click="unlinkPatreon"
              >
                {{ $t("views_rewards.unlink_patreon") }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Rewards Section -->
        <v-card v-if="authCode">
          <v-card-title>{{ $t("views_rewards.your_rewards") }}</v-card-title>
          <v-card-text>
            <div v-if="isLoadingRewards">
              <v-progress-circular indeterminate color="primary" />
              {{ $t("views_rewards.loading_rewards") }}
            </div>
            <div v-else-if="userRewards.length === 0">
              <p>{{ $t("views_rewards.no_rewards") }}</p>
            </div>
            <v-table v-else>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left" style="width: 30%">{{ $t("views_rewards.reward_name") }}</th>
                    <th class="text-left" style="width: 70%">{{ $t("views_rewards.description") }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="reward in sortedRewards"
                    :key="reward.id"
                  >
                    <td><strong>{{ getRewardName(reward.displayId) }}</strong></td>
                    <td>{{ getRewardDescription(reward.displayId) }}</td>
                  </tr>
                </tbody>
              </template>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Error Messages -->
        <v-alert v-if="errorMessage" type="error" dismissible @input="errorMessage = ''">
          {{ errorMessage }}
        </v-alert>

        <!-- Success Messages -->
        <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = ''">
          {{ successMessage }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Sign In Dialog -->
    <sign-in-dialog v-model="showSignIn" />
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, getCurrentInstance, watch } from "vue";
import { useOauthStore } from "@/store/oauth/store";
import { useRewardsStore } from "@/store/rewards/store";
import SignInDialog from "@/components/common/SignInDialog.vue";
import noop from "lodash/noop";

export default defineComponent({
  name: "RewardsPage",
  components: {
    SignInDialog,
  },
  setup() {
    const instance = getCurrentInstance();
    const oauthStore = useOauthStore();
    const rewardsStore = useRewardsStore();

    const showSignIn = ref(false);
    const errorMessage = ref("");
    const successMessage = ref("");
    const isLinkingPatreon = ref(false);
    const isUnlinkingPatreon = ref(false);

    const authCode = computed(() => oauthStore.token);

    const battleTag = computed({
      get: () => oauthStore.blizzardVerifiedBtag,
      set: noop,
    });

    const patreonLinkStatus = computed(() => rewardsStore.isPatreonLinked);
    const patreonEmail = computed(() => rewardsStore.patreonEmail);
    const userRewards = computed(() => rewardsStore.userRewards);
    const isLoadingRewards = computed(() => rewardsStore.isLoadingRewards);

    async function linkWithPatreon() {
      if (!authCode.value) return;

      isLinkingPatreon.value = true;
      errorMessage.value = "";

      try {
        await rewardsStore.initiatePatreonOAuth();
      } catch (error) {
        const ex = error as Error;
        errorMessage.value = ex.message || "Failed to initiate Patreon linking";
      } finally {
        isLinkingPatreon.value = false;
      }
    }

    async function unlinkPatreon() {
      if (!authCode.value) return;

      isUnlinkingPatreon.value = true;
      errorMessage.value = "";

      try {
        await rewardsStore.unlinkPatreonAccount(authCode.value);
        successMessage.value = "Patreon account unlinked successfully";
      } catch (error) {
        const ex = error as Error;
        errorMessage.value = ex.message || "Failed to unlink Patreon account";
      } finally {
        isUnlinkingPatreon.value = false;
      }
    }

    async function loadRewardsData() {
      if (!authCode.value) return;

      try {
        await rewardsStore.loadPatreonLinkStatus(authCode.value);
        await rewardsStore.loadUserRewards(authCode.value);
      } catch (error) {
        const ex = error as Error;
        errorMessage.value = ex.message || "Failed to load rewards data";
      }
    }

    onMounted(() => {
      if (authCode.value) {
        loadRewardsData();
      }
    });

    // Watch for authCode changes to handle direct page visits
    watch(authCode, (newAuthCode) => {
      if (newAuthCode) {
        loadRewardsData();
      }
    });

    function getRewardName(displayId: string): string {
      const key = `rewards.${displayId}.name`;
      const translated = instance?.proxy?.$t(key) as string;
      // Fallback to displayId if translation not found
      return translated !== key ? translated : displayId;
    }

    function getRewardDescription(displayId: string): string {
      const key = `rewards.${displayId}.description`;
      const translated = instance?.proxy?.$t(key) as string;
      // Return empty string if no translation
      return translated !== key ? translated : "";
    }

    const sortedRewards = computed(() => {
      return userRewards.value.slice().sort((a, b) => {
        const nameA = getRewardName(a.displayId);
        const nameB = getRewardName(b.displayId);
        return nameA.localeCompare(nameB);
      });
    });

    return {
      authCode,
      battleTag,
      patreonLinkStatus,
      patreonEmail,
      userRewards,
      isLoadingRewards,
      showSignIn,
      errorMessage,
      successMessage,
      isLinkingPatreon,
      isUnlinkingPatreon,
      linkWithPatreon,
      unlinkPatreon,
      sortedRewards,
      getRewardName,
      getRewardDescription,
    };
  },
});
</script>

<style lang="scss" scoped>
.rewards-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
