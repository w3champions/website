<template>
  <v-container>
    <v-card-title>Chat Log</v-card-title>
    <v-card-text>
      <v-row v-if="loading" justify="center" class="ma-1">
        <v-progress-circular indeterminate />
      </v-row>
      <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="ma-1">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2">
          <span>{{ errorMessage }}</span>
          <v-btn v-if="showLoginButton" variant="text" @click="promptLogin">
            Log in again
          </v-btn>
        </div>
      </v-alert>
      <v-row v-else-if="!messages || messages.length === 0" class="ma-1">
        <span class="text-medium-emphasis">This match had no chat messages.</span>
      </v-row>
      <v-row v-else class="ma-1">
        <replay-chat-message
          v-for="(item, index) in messages"
          :key="index"
          :time="item.time"
          :sentBy="getSenderName(item)"
          :team="getTeam(item)"
          :content="item.content"
          :scope="item.scope.type"
          :sentTo="getPrivateRecipientName(item)"
        />
      </v-row>
    </v-card-text>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import ReplayChatMessage from "@/components/admin/replays/ReplayChatMessage.vue";
import { ReplayChatLog, ReplayMessage } from "@/store/admin/types";
import { useReplayManagementStore } from "@/store/admin/replayManagement/store";
import { OPEN_SIGN_IN_DIALOG_EVENT } from "@/constants/sso";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "AdminReplayChatLogMessages",
  components: {
    ReplayChatMessage,
  },
  props: {
    matchId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const replayManagementStore = useReplayManagementStore();
    const route = useRoute();
    const log = ref<ReplayChatLog>({} as ReplayChatLog);
    const loading = ref(false);
    const errorMessage = ref<string>("");
    const showLoginButton = ref(false);

    const messages = computed<ReplayMessage[]>(() => log.value.messages);

    function getSenderName(message: ReplayMessage): string {
      const name = log.value.players.find((x) => x.id == message.fromPlayer)?.name;
      if (name == undefined) return "UNKNOWN";
      return name;
    }

    function getTeam(message: ReplayMessage): number {
      const team = log.value.players.find((x) => x.id == message.fromPlayer)?.team;
      if (team == undefined) return -1;
      return team;
    }

    function getPrivateRecipientName(message: ReplayMessage): string | undefined {
      if (message.scope.id == null) return undefined;
      const name = log.value.players.find((x) => x.id == message.scope.id)?.name;
      if (name == undefined) return "UNKNOWN";
      return name;
    }

    function promptLogin(): void {
      window.dispatchEvent(new CustomEvent(OPEN_SIGN_IN_DIALOG_EVENT, {
        detail: {
          returnTo: route.fullPath,
        },
      }));
    }

    function handleLoadError(error: unknown): void {
      const status = typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: number }).status
        : undefined;

      if (status === 401) {
        showLoginButton.value = true;
        promptLogin();
        errorMessage.value = "Your session expired while loading the chat log. Please log in again.";
        return;
      }

      errorMessage.value = "We could not load the chat log right now. Please try again.";
    }

    onMounted(async (): Promise<void> => {
      loading.value = true;
      errorMessage.value = "";
      showLoginButton.value = false;

      try {
        await replayManagementStore.loadChatLog(props.matchId);
        log.value = replayManagementStore.chatLog;
      } catch (error) {
        handleLoadError(error);
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      messages,
      getSenderName,
      getTeam,
      getPrivateRecipientName,
      errorMessage,
      showLoginButton,
      promptLogin,
    };
  },
});
</script>
