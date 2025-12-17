<template>
  <div>
    <v-card-title class="pt-3">
      Launcher Chat
    </v-card-title>
    <v-container class="w3-container-width">
      <v-card>
        <v-container class="mt-5">
          <v-row>
            <v-col cols="6">
              <v-select
                v-model="selectedChatRoom"
                :items="chatRooms"
                label="Select Chat Room"
                variant="outlined"
                color="primary"
                density="compact"
                @update:model-value="getChatHistory"
              />
            </v-col>
          </v-row>
          <div>{{ error }}</div>
          <div v-if="chatHistory?.length === 0">No chat history found</div>
          <v-row v-for="msg in chatHistory" :key="msg.id" no-gutters class="mb-1">
            [{{ new Date(msg.time).toLocaleString() }}] {{ msg.battleTag }}: {{ msg.message }}
          </v-row>
        </v-container>
      </v-card>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import ModerationService from "@/services/admin/ModerationService";
import { LauncherChatMessage } from "@/store/admin/types";
import { useOauthStore } from "@/store/oauth/store";
import { ref } from "vue";

const oauthStore = useOauthStore();
const chatRooms = ref([
  "W3C Lounge",
  "1 vs 1",
  "2 vs 2",
  "4 vs 4",
  "FFA",
  "Legion TD",
  "Survival Chaos",
  "Direct Strike",
  "Warhammer",
  "Castle Fight",
  "Risk Europe",
  "Mini Dota",
]);

const selectedChatRoom = ref<string>();
const chatHistory = ref<LauncherChatMessage[]>();
const error = ref<Error>();

const getChatHistory = async (chatRoom: string) => {
  try {
    chatHistory.value = await ModerationService.getLauncherChat(oauthStore.token, chatRoom);
  } catch(err) {
    const ex = err as Error;
    error.value = ex;
  }
};

</script>
