<template>
  <v-container>
    <v-card-title class="d-flex align-center ga-3">
      <span>Chat Log</span>
      <v-tooltip
        v-if="!loading && timeline.length > 0"
        location="top"
        content-class="w3-tooltip elevation-1"
        max-width="300"
      >
        <template v-slot:activator="{ props }">
          <div
            v-bind="props"
            class="d-flex align-center ga-2 font-friz-medium text-body-2 ml-6"
          >
            <span class="text-uppercase" :class="showRealTime ? 'text-grey' : `text-${gameTimeColor}`">Game time</span>
            <v-switch
              v-model="showRealTime"
              density="compact"
              hide-details
              :color="realTimeColor"
              :base-color="gameTimeColor"
              class="flex-grow-0"
            />
            <span class="text-uppercase" :class="showRealTime ? `text-${realTimeColor}` : 'text-grey'">Real time</span>
          </div>
        </template>
        <span>
          In-game time freezes while the game is paused; real time keeps advancing.
          The two differ by the total time the game spent paused.
        </span>
      </v-tooltip>
    </v-card-title>
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
            :gameTime="item.message.gameTime"
            :sentBy="getSenderName(item.message)"
            :team="getTeam(item.message)"
            :content="item.message.content"
            :scope="item.message.scope.type"
            :sentTo="getPrivateRecipientName(item.message)"
          />
          <replay-game-event-message
            v-else
            :time="item.event.time"
            :gameTime="item.event.gameTime"
            :type="item.event.type"
            :playerName="getPlayerName(item.event.playerId)"
            :leaveReason="item.event.leaveReason"
            :pauseDurationMs="resumeDurationFor(item.event)"
          />
        </template>
      </v-row>
    </v-card-text>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, provide, ref } from "vue";
import ReplayChatMessage from "@/components/admin/replays/ReplayChatMessage.vue";
import ReplayGameEventMessage from "@/components/admin/replays/ReplayGameEventMessage.vue";
import { GAME_TIME_COLOR, REAL_TIME_COLOR, REPLAY_SHOW_REAL_TIME } from "@/components/admin/replays/replayTime";
import { EReplayGameEventType, ReplayChatLog, ReplayGameEvent, ReplayMessage } from "@/store/admin/types";
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

    // Toggle (switch at the top) shared with every ReplayLogTime via inject.
    const showRealTime = ref(false);
    provide(REPLAY_SHOW_REAL_TIME, showRealTime);

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

    // Real-time duration of each resume's pause: resume.time - matching pause.time.
    // Events arrive ordered by time, so the matching pause is the most recent one.
    const resumeDurations = computed<Map<ReplayGameEvent, number>>(() => {
      const durations = new Map<ReplayGameEvent, number>();
      let lastPause: ReplayGameEvent | null = null;
      for (const event of log.value.events ?? []) {
        if (event.type === EReplayGameEventType.PAUSE) {
          lastPause = event;
        } else if (event.type === EReplayGameEventType.RESUME) {
          if (lastPause) durations.set(event, event.time - lastPause.time);
          lastPause = null;
        }
      }
      return durations;
    });

    function resumeDurationFor(event: ReplayGameEvent): number | undefined {
      return resumeDurations.value.get(event);
    }

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
      showRealTime,
      resumeDurationFor,
      gameTimeColor: GAME_TIME_COLOR,
      realTimeColor: REAL_TIME_COLOR,
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
