<template>
  <v-container>
    <div v-if="!loaded">
      <v-alert class="ma-4 pa-4" dense outlined type="error">Could not load the Message of the Day</v-alert>
    </div>
    <v-card v-else>
      <div v-if="!loading">
        <v-card-title class="justify-center">Current Message of the Day:</v-card-title>
        <v-card-text class="text-center text-body-1">
          <v-divider class="mb-4"></v-divider>
          {{ motd() }}
          <v-divider class="mt-4"></v-divider>
        </v-card-text>
        <v-card-actions class="ma-3 pa-3">
          <v-textarea outlined counter label="New Motd:" :rules="rules" v-model="newMotd"></v-textarea>
        </v-card-actions>
        <v-card-actions class="pa-3 ma-3 justify-end">
          <v-btn color="primary" class="w3-race-bg--text" @click="confirmNewMotd">Set New Motd</v-btn>
        </v-card-actions>
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { MessageOfTheDay } from "@/store/admin/infoMessages/types";
import { Component, Vue } from "vue-facing-decorator";
import { useInfoMessagesStore } from "@/store/admin/infoMessages/store";

@Component({ components: {} })
export default class AdminMotd extends Vue {
  public loading = true;
  public loaded = false;
  public newMotd = "";
  private infoMessagesStore = useInfoMessagesStore();

  get rules(): unknown {
    return [(value: string) => value.length <= 400 || "Max 400 characters"];
  }

  motd(): string {
    return this.infoMessagesStore.messageOfTheDay.motd;
  }

  async confirmNewMotd(): Promise<void> {
    await this.setMotd(this.newMotd);
    await this.infoMessagesStore.loadMotd();
  }

  async setMotd(value: string): Promise<boolean> {
    return await this.infoMessagesStore.setMotd({ motd: value } as MessageOfTheDay);
  }

  async mounted() {
    this.loaded = await this.infoMessagesStore.loadMotd();
    if (this.motd() === "" || this.motd() === undefined) {
      this.loaded = false;
    }
    this.loading = false;
    this.newMotd = this.motd();
  }
}
</script>

<style lang="scss"></style>
