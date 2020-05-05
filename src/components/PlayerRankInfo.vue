<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <span v-on="on">{{ combinedBtag }}</span>
    </template>
    <div
      @click:row="onRowClicked"
      @click.left="openPlayerProfile(playerId.id)"
      @click.middle="openProfileInNewTab(playerId.id)"
      @click.right="openProfileInNewTab(playerId.id)"
    >
      {{ playerId.name }}
    </div>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { PlayerId, Ranking } from "@/store/ranking/types";

@Component({})
export default class PlayerRankInfo extends Vue {
  @Prop() public playerId!: PlayerId;

  get combinedBtag() {
    return `${this.playerId.name}#${this.playerId.battleTag}`;
  }

  public openPlayerProfile(playerName: string) {
    this.$router.push({
      path: this.getPlayerPath(playerName)
    });
  }

  private getPlayerPath(playerName: string) {
    return "/player/" + encodeURIComponent(`${playerName}`);
  }

  public openProfileInNewTab(playerName: string) {
    const path = this.getPlayerPath(playerName);
    window.open(path, "_blank");
  }

  public onRowClicked(ranking: Ranking) {
    this.openPlayerProfile(ranking.player.id);
  }
}
</script>
