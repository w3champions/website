<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <span
        class="pointer"
        @click="onRowClicked"
        @click.left="openPlayerProfile(playerId.battleTag)"
        @click.middle="openProfileInNewTab(playerId.battleTag)"
        @click.right="openProfileInNewTab(playerId.battleTag)"
        v-on="on"
      >
        {{ playerId.name }}
      </span>
    </template>
    <div>
      {{ playerId.battleTag }}
    </div>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { PlayerId } from "@/store/ranking/types";

@Component({})
export default class PlayerRankInfo extends Vue {
  @Prop() public playerId!: PlayerId;

  public openPlayerProfile(playerId: string) {
    this.$router.push({
      path: this.getPlayerPath(playerId)
    });
  }

  private getPlayerPath(playerId: string) {
    return "/player/" + encodeURIComponent(`${playerId}`);
  }

  public openProfileInNewTab(playerId: string) {
    const path = this.getPlayerPath(playerId);
    window.open(path, "_blank");
  }

  public onRowClicked() {
    this.openPlayerProfile(this.playerId.battleTag);
  }
}
</script>
