<template>
  <v-container>
    <v-card-title>Chat Log</v-card-title>
    <v-card-text>
      <v-row>
        <v-col>
          <v-switch v-model="openGameDetail" :label="`Show Game Detail`"></v-switch>
        </v-col>
        <v-col>
          <download-replay-icon :gameId="matchId"></download-replay-icon>
          <span>Download Replay</span>
        </v-col>
      </v-row>
      <v-row v-if="openGameDetail" class="mb-4">
        <match-detail-view :matchId="matchId"></match-detail-view>
      </v-row>
      <v-divider class="mb-4"></v-divider>
      <v-row class="ma-1">
        <replay-chat-message
          v-for="(item, index) in messages"
          :key="index"
          :sentBy="getSenderName(item)"
          :team="getTeam(item)"
          :content="item.content"
          :scope="item.scope.type"
          :sentTo="getPrivateRecipientName(item)"
        ></replay-chat-message>
      </v-row>
    </v-card-text>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import ReplayChatMessage from "@/components/admin/replays/ReplayChatMessage.vue";
import { ReplayChatLog, ReplayMessage } from "@/store/admin/types";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";
import MatchDetailView from "@/views/MatchDetail.vue";
import { useReplayManagementStore } from "@/store/admin/replayManagement/store";

export default defineComponent({
  name: "AdminReplayChatLog",
  components: {
    ReplayChatMessage,
    DownloadReplayIcon,
    MatchDetailView,
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
    const openGameDetail = ref<boolean>(false);

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
      await replayManagementStore.loadChatLog(props.matchId);
      log.value = replayManagementStore.chatLog;
    });

    return {
      openGameDetail,
      messages,
      getSenderName,
      getTeam,
      getPrivateRecipientName,
    };
  },
});
</script>
