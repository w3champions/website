<template>
  <v-container>
    <v-card-title>Chat Log</v-card-title>
    <v-card-text>
      <v-row>
        <v-col>
          <v-switch
            v-model="openGameDetail"
            label="Show Game Detail"
            color="primary"
            class="text-medium-emphasis"
          />
        </v-col>
        <v-col>
          <download-replay-icon :gameId="matchId" />
          <span>Download Replay</span>
        </v-col>
      </v-row>
      <v-row v-if="openGameDetail" class="mb-4">
        <match-detail-view :matchId="matchId" :preview-mode="true" />
      </v-row>
      <v-divider class="mb-4" />
      <admin-replay-chat-log-messages :matchId="matchId" />
    </v-card-text>
  </v-container>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, ref } from "vue";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";
import AdminReplayChatLogMessages from "@/components/admin/replays/AdminReplayChatLogMessages.vue";

const MatchDetailView = defineAsyncComponent(
  () => import("@/views/MatchDetail.vue")
);

export default defineComponent({
  name: "AdminReplayChatLog",
  components: {
    DownloadReplayIcon,
    MatchDetailView,
    AdminReplayChatLogMessages,
  },
  props: {
    matchId: {
      type: String,
      required: true,
    },
  },
  setup() {
    const openGameDetail = ref<boolean>(false);

    return {
      openGameDetail,
    };
  },
});
</script>
