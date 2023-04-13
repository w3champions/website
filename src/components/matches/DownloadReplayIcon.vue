<template>
  <v-tooltip top style="white-space: pre-line">
    <template v-slot:activator="{ on }">
      <span v-on="on">
        <v-btn class="ma-2" icon @click="downloadReplay" outlined>
          <v-icon :max-height="18" :max-width="18">{{ mdiDownload }}</v-icon>
        </v-btn>
      </span>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { API_URL } from "@/main";
import { mdiDownload } from "@mdi/js";
import Vue from "vue";
import { LocaleMessage } from "vue-i18n";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class DownloadReplayIcon extends Vue {
  @Prop({}) gameId!: string;
  public mdiDownload = mdiDownload;

  get tooltip(): LocaleMessage {
    return `${this.$t("components_matches_replayicon.download")}`;
  }

  downloadReplay(): void {
    window.open(`${API_URL}api/replays/${this.gameId}`, "_self");
  }
}
</script>

<style></style>
