<template>
  <v-container>
    <v-card>
      <v-container class="mt-5">
        <v-row>
          <v-col></v-col>
          <v-col cols="6" align="center">
            <v-text-field v-model="textInput" solo outlined clearable label="Game ID"></v-text-field>
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
                    <v-btn x-large color="primary w3-race-bg--text" @click="acceptButton">Accept</v-btn>
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
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import MatchDetailView from "@/views/MatchDetail.vue";
import AdminReplayChatLog from "@/components/admin/replays/AdminReplayChatLog.vue";
import { ReplayChatLog } from "@/store/admin/types";

@Component({ components: { AdminReplayChatLog, MatchDetailView } })
export default class AdminViewGameChat extends Vue {
  textInput = "";
  loaded = false;
  dialog = false;
  acceptedGame = false;
  logs = {} as ReplayChatLog;

  async openConfirmation(): Promise<void> {
    this.dialog = true;
  }

  get matchId(): string {
    return this.textInput;
  }

  acceptButton(): void {
    this.dialog = false;
    this.acceptedGame = true;
  }
}
</script>

<style lang="scss"></style>
