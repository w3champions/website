<template>
  <v-row>
    <v-col cols="1"/>
    <v-col cols="7">
      <v-card>
        <div class="overflow-y-auto" style="height: 600px" id="chatBox">
          <v-list-item style="min-height: 25px !important;" v-for="message in messages" :key="message.index">
            {{ message.user }}: {{ message.message }}
          </v-list-item>
        </div>
        <v-text-field autofocus v-model="editChatMessage" @keydown.enter="sendMessage" :disabled="canNotSend" />
      </v-card>
    </v-col>
    <v-col cols="3">
      <v-card>
        <div class="overflow-y-auto" style="height: 600px">
          <v-list-item style="min-height: 25px !important;" v-for="user in users" :key="user.battleTag">
            {{ user.user }}
          </v-list-item>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import {HubConnection, HubConnectionBuilder} from "@aspnet/signalr";
import {API_URL} from "@/main";

@Component({})
export default class ChatView extends Vue {
  public connection!: HubConnection;
  public editChatMessage = "connecting...";
  public canNotSend = true;
  public messages = [] as { user: string, message: string, index: number }[]
  public users = [] as { name: string, battleTag: string }[]


  async mounted() {
    this.connection = new HubConnectionBuilder().withUrl(`${API_URL}chathub`).build()
    await this.connection.start();
    this.canNotSend = false
    this.editChatMessage = ""

    this.connection.on("StartChat", this.pushUsers);
    this.connection.on("ReceiveMessage", this.pushMessage);
    this.connection.on("UserEntered", this.pushUser);
    this.connection.on("UserLeft", this.removeUser);
    this.connection.onclose(this.handleClose);
  }

  get authCode(): string {
    return this.$store.direct.state.oauth.token;
  }

  public pushMessage(user: string, message: string) {
    this.messages.push({ user, message, index: this.messages.length })
  }

  public pushUser(name: string, battleTag: string) {
    this.users.push({ name, battleTag })
  }

  public pushUsers(users: {name: string, battleTag: string}[]) {
    this.users = users;
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
    this.editChatMessage = "connecting..."
  }
}
</script>
