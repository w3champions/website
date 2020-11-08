<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <div
        style="display: inline;"
        class="pointer"
        @click.left="openPlayerProfile(playerId.battleTag)"
        @click.middle="openProfileInNewTab(playerId.battleTag)"
        v-on="on"
      >
        {{ playerId.name }}
      </div>
    </template>
    <div>
      <span>
        {{ playerId.battleTag }}
      </span>
    </div>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { PlayerId } from "@/store/ranking/types";
import { ERaceEnum } from "@/store/typings";
import { getProfileUrl } from '@/helpers/url-functions';

@Component({})
export default class PlayerRankInfo extends Vue {
  @Prop() public playerId!: PlayerId;
  @Prop() public clanId!: string;

  public openPlayerProfile(playerId: string) {
    this.$router.push({
      path: getProfileUrl(playerId),
    });
  }

  public openProfileInNewTab(playerId: string) {
    const path = getProfileUrl(playerId);
    window.open(path, "_blank");
  }
}
</script>
