<template>
  <v-row>
    <v-col cols="1" />
    <v-col cols="7">
      <v-card v-if="chatApiKey" class="pt-4">
        <div class="overflow-y-auto" id="chatBox" style="height: 546px;">
          <v-list-item
            style="min-height: 25px !important;"
            v-for="message in messages"
            :key="message.index"
          >
            {{ message.name }}: {{ message.message }}
          </v-list-item>
        </div>
        <v-text-field
          class="pl-4 pr-4"
          autofocus
          v-model="editChatMessage"
          @keydown.enter="sendMessage"
          :disabled="!chatApiKey"
        />
      </v-card>
      <v-card v-if="!chatApiKey" class="text-center">
        <v-list-item style="height: 600px;">
          Sorry, but you have to be logged in to chat
        </v-list-item>
      </v-card>
    </v-col>
    <v-col cols="3">
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
        <v-btn v-if="chatApiKey" class="ma-4" @click="copyChatApiKey">
          Copy new ApiKey to Clipboard
        </v-btn>
      </v-card>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { HubConnection, HubConnectionBuilder } from "@aspnet/signalr";
import { API_URL } from "@/main";

@Component({})
export default class ChatView extends Vue {
  public connection!: HubConnection;
  public editChatMessage = "Connecting...";

  async mounted() {
    this.connection = new HubConnectionBuilder()
      .withUrl(`${API_URL}chathub`)
      .build();
    await this.connection.start();

    this.connection.on("StartChat", this.pushInitialUsers);
    this.connection.on("ReceiveMessage", this.pushMessage);
    this.connection.on("UserEntered", this.pushUser);
    this.connection.on("UserLeft", this.removeUser);
    this.connection.on("LoginFailed", this.loginFailed);
    this.connection.onclose(this.handleClose);

    if (this.$store.direct.state.oauth.token) {
      await this.$store.direct.dispatch.oauth.loadBlizzardBtag(
        this.$store.direct.state.oauth.token
      );

      await this.$store.direct.dispatch.chat.loadChatApiKey();
      await this.connection.invoke("LoginAs", this.chatApiKey);
    }

    if (this.chatApiKey) {
      this.editChatMessage = "";
    }
  }

  get chatApiKey(): string {
    return this.$store.direct.state.chat.apiKey;
  }

  get messages() {
    return this.$store.direct.state.chat.messages;
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

  public pushMessage(user: string, name: string, message: string) {
    this.$store.direct.commit.chat.PUSH_MESSAGE({
      user,
      name,
      message,
      index: this.messages.length,
    });
  }

  public pushUser(name: string, battleTag: string) {
    this.$store.direct.commit.chat.PUSH_USER({ name, battleTag });
  }

  public pushInitialUsers(users: { name: string; battleTag: string }[]) {
    this.$store.direct.commit.chat.PUSH_USERS(users);
  }

  public async loginFailed() {
    await this.connection.stop();
  }

  public removeUser(battleTag: string) {
    this.$store.direct.commit.chat.POP_USER(battleTag);
  }

  public async sendMessage() {
    await this.connection.invoke(
      "SendMessage",
      this.editChatMessage,
      this.chatApiKey
    );
    const chatBox = this.$el.querySelector("#chatBox");
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
    this.editChatMessage = "";
  }

  private handleClose() {
    this.$store.direct.commit.chat.SET_CHAT_API_KEY("");
  }
}
</script>
