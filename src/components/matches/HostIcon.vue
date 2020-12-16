<template>
  <v-tooltip bottom style="white-space: pre-line;">
    <template v-slot:activator="{ on }">
      <span v-on="on">
        <v-img 
          :src="icon"
          :max-height="18"
          :max-width="18"
        ></v-img>
      </span>
    </template>
    <span>{{ tooltip }}</span>
    <table style="width: 100%">
      <tr v-for="playerInfo in host.playerServerInfos" :key="playerInfo.battleTag">
          <td>
            {{stripTag(playerInfo.battleTag)}}
          </td>
          <td>
            {{playerInfo.averagePing}}ms
          </td>
      </tr>
    </table>
  </v-tooltip>
</template>

<script lang="ts">
import { ServerInfo } from "@/store/typings";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class HostIcon extends Vue {
  @Prop({}) host!: ServerInfo;

  get icon(): unknown {
    if (this.host == undefined) {
      return require(`@/assets/icons/hosterror.png`);
    }
    return require(`@/assets/icons/${this.host.provider}.png`);
  }

  get tooltip(): string {
    if (this.host == undefined) {
      return 'Error'
    }
    
    if (this.host.provider == 'BNET') {
      return "Hosted on Battle.net";
    } else {
      return `Hosted on Flo / ${this.host.name}`;
    }
  }

  stripTag(tag: string) {
    if (!tag) {
      return '';
    }

    const hashIndex = tag.indexOf('#');

    if (hashIndex != -1) {
      return tag.substring(0, hashIndex);
    }

    return tag;
  }
}
</script>

<style></style>
