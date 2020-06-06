<template>
  <div>
    <v-card class="pt-4" style="height: 630px;">
      <div class="overflow-y-auto">
        <v-list-item
          style="min-height: 25px !important;"
          v-for="user in otherUsers"
          :key="user.battleTag"
          @click="openProfile(user.battleTag)"
        >
          {{ user.name }}
        </v-list-item>
      </div>
    </v-card>
    <br />
    <v-card>
      <v-row class="pa-0 justify-center">
        <v-col class="pa-0 text-center">
          <v-btn v-if="chatApiKey" class="ma-4" @click="copyChatApiKey">
            Copy ApiKey
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class ChatUserList extends Vue {
  get chatApiKey(): string {
    return this.$store.direct.state.chat.apiKey;
  }

  get otherUsers() {
    return this.$store.direct.state.chat.otherUsers;
  }

  public async copyChatApiKey() {
    await this.$store.direct.dispatch.chat.createApiKey();
    await navigator.clipboard.writeText(this.chatApiKey);
  }

  public openProfile(battleTag: string) {
    this.$router.push({ path: `/player/${encodeURIComponent(battleTag)}` });
  }
}
</script>
