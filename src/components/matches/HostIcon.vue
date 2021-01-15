<template>
  <v-tooltip bottom style="white-space: pre-line">
    <template v-slot:activator="{ on }">
      <span v-on="on">
        <v-img :src="icon" :max-height="18" :max-width="18"></v-img>
      </span>
    </template>
    <span>{{ tooltip }}</span>
    <table style="width: 100%">
      <tr
        v-for="playerInfo in host.playerServerInfos"
        :key="playerInfo.battleTag"
      >
        <td>
          {{ stripTag(playerInfo.battleTag) }}
        </td>
        <td>{{ playerInfo.averagePing }}ms</td>
      </tr>
    </table>
  </v-tooltip>
</template>

<script lang="ts">
import { getAsset } from "@/helpers/url-functions";
import { ServerInfo } from "@/store/typings";
import Vue from "vue";
import { LocaleMessage } from "vue-i18n";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class HostIcon extends Vue {
  @Prop({}) host!: ServerInfo;

  get icon(): unknown {
    if (this.host == undefined) {
      return getAsset(`icons/hosterror.png`);
    }
    return getAsset(`icons/${this.host.provider}.png`);
  }

  get tooltip(): LocaleMessage {
    if (this.host == undefined) {
      return this.$t("components_matches_hosticon.error");
    }

    if (this.host.provider == "BNET") {
      return this.$t("components_matches_hosticon.hostedonbnet");
    } else {
      return `${this.$t("components_matches_hosticon.hostedonflo")} / ${
        this.host.name
      }`;
    }
  }

  stripTag(tag: string): string {
    if (!tag) {
      return "";
    }

    const hashIndex = tag.indexOf("#");

    if (hashIndex != -1) {
      return tag.substring(0, hashIndex);
    }

    return tag;
  }
}
</script>

<style></style>
