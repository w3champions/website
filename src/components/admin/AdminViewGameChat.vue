<template>
  <div>
    <v-card-title>
      View Game Chat
    </v-card-title>
    <v-container>
      <v-card>
        <v-container class="mt-5">
          <v-row>
            <v-col></v-col>
            <v-col cols="6" align="center">
              <v-text-field v-model="matchId" solo outlined clearable placeholder="Game ID" autofocus></v-text-field>
            </v-col>
            <v-col>
              <v-dialog v-model="dialog" width="1500">
                >
                <template v-slot:activator="{ on }">
                  <v-btn x-large v-on="on" class="primary w3-race-bg--text" @click="openConfirmation">Load</v-btn>
                </template>

                <v-card>
                  <v-container>
                    <v-card-subtitle>Is this the game you are looking for?</v-card-subtitle>

                    <v-card-actions>
                      <v-spacer />
                      <v-btn x-large color="primary w3-race-bg--text" @click="accept">Accept</v-btn>
                      <v-btn x-large color="error w3-race-bg--text" @click="dialog = false">Cancel</v-btn>
                      <v-spacer />
                    </v-card-actions>
                    <match-detail-view :matchId="matchId"></match-detail-view>
                  </v-container>
                </v-card>
              </v-dialog>
            </v-col>
            <v-col></v-col>
          </v-row>
        </v-container>

        <admin-replay-chat-log v-if="acceptedGame" :matchId="matchId"></admin-replay-chat-log>
      </v-card>
    </v-container>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import MatchDetailView from "@/views/MatchDetail.vue";
import AdminReplayChatLog from "@/components/admin/replays/AdminReplayChatLog.vue";

export default defineComponent({
  name: "AdminViewGameChat",
  components: {
    AdminReplayChatLog,
    MatchDetailView,
  },
  setup() {
    const matchId = ref<string>("");
    const dialog = ref<boolean>(false);
    const acceptedGame = ref<boolean>(false);

    async function openConfirmation(): Promise<void> {
      dialog.value = true;
    }

    function accept(): void {
      dialog.value = false;
      acceptedGame.value = true;
    }

    return {
      matchId,
      dialog,
      openConfirmation,
      accept,
      acceptedGame,
    };
  },
});
</script>
