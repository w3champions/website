<template>
  <v-container>
    <v-row>
      <v-col cols="9">
        <chat-window />
      </v-col>
      <v-col cols="3">
        <chat-user-list />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import ChatWindow from "@/components/chat/ChatWindow.vue";
import ChatUserList from "@/components/chat/ChatUserList.vue";

@Component({
  components: { ChatUserList, ChatWindow }
})
export default class HomeView extends Vue {

}
</script>

<style lang="scss" scoped>
.no-padding {
  padding-top: 0;
}
</style>
