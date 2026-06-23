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
      <v-row v-else-if="timeline.length === 0" class="ma-1">
        <span class="text-medium-emphasis">This match had no chat messages or events.</span>
      </v-row>
      <v-row v-else class="ma-1">
        <template v-for="(item, index) in timeline" :key="index">
          <replay-chat-message
            v-if="item.kind === 'message'"
            :time="item.message.time"
            :sentBy="getSenderName(item.message)"
            :team="getTeam(item.message)"
            :content="item.message.content"
            :scope="item.message.scope.type"
            :sentTo="getPrivateRecipientName(item.message)"
          />
          <replay-game-event-message
            v-else
            :time="item.event.time"
            :type="item.event.type"
            :playerName="getPlayerName(item.event.playerId)"
            :leaveReason="item.event.leaveReason"
          />
        </template>
      </v-row>
    </v-card-text>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import ReplayChatMessage from "@/components/admin/replays/ReplayChatMessage.vue";
import ReplayGameEventMessage from "@/components/admin/replays/ReplayGameEventMessage.vue";
import { ReplayChatLog, ReplayGameEvent, ReplayMessage } from "@/store/admin/types";
import { useReplayManagementStore } from "@/store/admin/replayManagement/store";
import { OPEN_SIGN_IN_DIALOG_EVENT } from "@/constants/sso";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "AdminReplayChatLogMessages",
  components: {
    ReplayChatMessage,
    ReplayGameEventMessage,
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

    type TimelineItem =
      | { kind: "message"; time: number; message: ReplayMessage }
      | { kind: "event"; time: number; event: ReplayGameEvent };

    // Merge chat messages and game events into a single chronological list.
    // Array.sort is stable, so messages and events sharing a timestamp keep insertion order.
    const timeline = computed<TimelineItem[]>(() => {
      const messages: TimelineItem[] = (log.value.messages ?? []).map((m) => ({
        kind: "message",
        time: m.time,
        message: m,
      }));
      const events: TimelineItem[] = (log.value.events ?? []).map((e) => ({
        kind: "event",
        time: e.time,
        event: e,
      }));
      return [...messages, ...events].sort((a, b) => a.time - b.time);
    });

    function getPlayerName(playerId: number): string {
      const name = log.value.players.find((x) => x.id == playerId)?.name;
      if (name == undefined) return "UNKNOWN";
      return name;
    }

    function getSenderName(message: ReplayMessage): string {
      return getPlayerName(message.fromPlayer);
    }

    function getTeam(message: ReplayMessage): number {
      const team = log.value.players.find((x) => x.id == message.fromPlayer)?.team;
      if (team == undefined) return -1;
      return team;
    }

    function getPrivateRecipientName(message: ReplayMessage): string | undefined {
      if (message.scope.id == null) return undefined;
      return getPlayerName(message.scope.id);
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
      timeline,
      getSenderName,
      getTeam,
      getPrivateRecipientName,
      getPlayerName,
      errorMessage,
      showLoginButton,
      promptLogin,
    };
  },
});
</script>
