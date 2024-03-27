<template>
  <v-container>
    <v-card-title>Chat Log</v-card-title>
    <v-card-text>
      <v-row>
        <v-col align="left">
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
import { Component, Prop, Vue } from "vue-facing-decorator";
import ReplayChatMessage from "@/components/admin/replays/ReplayChatMessage.vue";
import { ReplayChatLog, ReplayMessage } from "@/store/admin/types";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";
import MatchDetailView from "@/views/MatchDetail.vue";
import { useReplayManagementStore } from "@/store/admin/replayManagement/store";

@Component({ components: { ReplayChatMessage, DownloadReplayIcon, MatchDetailView } })
export default class AdminReplayChatLog extends Vue {
  @Prop() matchId!: string;
  log = {} as ReplayChatLog;
  openGameDetail = false;
  private replayManagementStore = useReplayManagementStore();

  get messages(): ReplayMessage[] {
    return this.log.messages;
  }

  getSenderName(message: ReplayMessage): string {
    const name = this.log.players.find((x) => x.id == message.fromPlayer)?.name;
    if (name == undefined) return "UNKNOWN";
    return name;
  }

  getTeam(message: ReplayMessage): number {
    const team = this.log.players.find((x) => x.id == message.fromPlayer)?.team;
    if (team == undefined) return -1;
    return team;
  }

  getPrivateRecipientName(message: ReplayMessage): string | null {
    if (message.scope.id == null) return null;
    const name = this.log.players.find((x) => x.id == message.scope.id)?.name;
    if (name == undefined) return "UNKNOWN";
    return name;
  }

  async mounted(): Promise<void> {
    await this.replayManagementStore.loadChatLog(this.matchId);
    this.log = this.replayManagementStore.chatLog;
  }
}
</script>

<style lang="scss"></style>
