<template>
  <v-tooltip top style="white-space: pre-line">
    <template v-slot:activator="{ on }">
      <span v-on="on">
        <v-btn class="ma-2" icon @click="downloadReplay" outlined>
          <v-icon :max-height="18" :max-width="18">mdi-download</v-icon>
        </v-btn>
      </span>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { API_URL } from "@/main";
import Vue from "vue";
import { LocaleMessage } from "vue-i18n";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class DownloadReplayIcon extends Vue {
  @Prop({}) gameId!: string;

  get tooltip(): LocaleMessage {
    return `${this.$t("components_matches_replayicon.download")}`;
  }

  downloadReplay(): void {
    window.open(`${API_URL}api/replays/${this.gameId}`);
  }
}
</script>

<style></style>
