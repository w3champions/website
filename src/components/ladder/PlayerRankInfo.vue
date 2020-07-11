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
        <span v-if="clanId">
          [{{ clanId }}]
        </span>
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

@Component({})
export default class PlayerRankInfo extends Vue {
  @Prop() public playerId!: PlayerId;
  @Prop() public clanId!: string;

  public openPlayerProfile(playerId: string) {
    this.$router.push({
      path: this.getPlayerPath(playerId),
    });
  }

  private getPlayerPath(playerId: string) {
    return "/player/" + encodeURIComponent(`${playerId}`);
  }

  public openProfileInNewTab(playerId: string) {
    const path = this.getPlayerPath(playerId);
    window.open(path, "_blank");
  }
}
</script>
