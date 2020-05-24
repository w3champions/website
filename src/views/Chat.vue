<template>
  <v-row>
    <v-col cols="1"/>
    <v-col cols="7">
      <v-card v-if="isLoggedIn" class="pt-4">
        <div class="overflow-y-auto" id="chatBox" style="height: 546px">
          <v-list-item style="min-height: 25px !important;" v-for="message in messages" :key="message.index">
            {{ message.name }}: {{ message.message }}
          </v-list-item>
        </div>
        <v-text-field class="pl-4 pr-4" autofocus v-model="editChatMessage" @keydown.enter="sendMessage" :disabled="canNotSend" />
      </v-card>
      <v-card v-if="!isLoggedIn" class="text-center">
        <v-list-item style="height: 600px">
          Sorry, but you have to be logged in to chat
        </v-list-item>
      </v-card>
    </v-col>
    <v-col cols="3">
      <v-card class="pt-4" style="height: 630px">
        <div class="overflow-y-auto">
          <v-list-item style="min-height: 25px !important;" v-for="user in users" :key="user.battleTag" @click="openProfile(user.battleTag)">
            {{ user.name }}
          </v-list-item>
        </div>
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
  public editChatMessage = "connecting...";
  public canNotSend = true;
  public isLoggedIn = false;
  public messages = [] as { user: string, name: string, message: string, index: number }[]
  public users = [] as { name: string, battleTag: string }[]


  async mounted() {
    this.connection = new HubConnectionBuilder().withUrl(`${API_URL}chathub`).build()
    await this.connection.start();

    this.connection.on("StartChat", this.pushInitialUsers);
    this.connection.on("ReceiveMessage", this.pushMessage);
    this.connection.on("UserEntered", this.pushUser);
    this.connection.on("UserLeft", this.removeUser);
    this.connection.on("LoginFailed", this.loginFailed);
    this.connection.onclose(this.handleClose);

    await this.connection.invoke("LoginAs", this.authCode);

    this.canNotSend = false
    this.editChatMessage = ""
  }

  get authCode(): string {
    return this.$store.direct.state.oauth.token;
  }

  public openProfile(battleTag: string) {
    this.$router.push({ path: `/player/${encodeURIComponent(battleTag)}` });
  }

  public pushMessage(user: string, name:string, message: string) {
    this.messages.push({ user, name, message, index: this.messages.length })
  }

  public pushUser(name: string, battleTag: string) {
    this.users.push({ name, battleTag })
  }

  public pushInitialUsers(users: {name: string, battleTag: string}[]) {
    this.users = users;
    this.isLoggedIn = true;
  }

  public async loginFailed() {
    this.editChatMessage = "Sorry, you need to be logged in to be able to chat";
    await this.connection.stop();
  }

  public removeUser(battleTag: string) {
    this.users = this.users.filter(u => u.battleTag !== battleTag);
  }

  public async sendMessage() {
    await this.connection.invoke("SendMessage", this.editChatMessage, this.authCode);
    const chatBox = this.$el.querySelector("#chatBox");
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
    this.editChatMessage = "";
  }

  private handleClose() {
    this.canNotSend = true;
    this.isLoggedIn = false;
  }
}
</script>
