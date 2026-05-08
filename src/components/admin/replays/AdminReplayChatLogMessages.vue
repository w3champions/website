<template>
  <v-container>
    <v-card-title>Chat Log</v-card-title>
    <v-card-text>
      <v-row v-if="loading" justify="center" class="ma-1">
        <v-progress-circular indeterminate />
      </v-row>
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
    const log = ref<ReplayChatLog>({} as ReplayChatLog);
    const loading = ref(false);

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

    onMounted(async (): Promise<void> => {
      loading.value = true;
      await replayManagementStore.loadChatLog(props.matchId);
      log.value = replayManagementStore.chatLog;
      loading.value = false;
    });

    return {
      loading,
      messages,
      getSenderName,
      getTeam,
      getPrivateRecipientName,
    };
  },
});
</script>
