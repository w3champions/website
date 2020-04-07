<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <div :class="textClass">
        <player-icon :left="left" :race="player.race" />
        <div>
          <a
            :class="won"
            v-on="on"
            @mouseover="lazyLoadProfile"
            @click="goToPlayer(nameWithoutBtag, battleTag)"
            @click.middle="openProfileInNewTab(nameWithoutBtag, battleTag)"
            @click.right="openProfileInNewTab(nameWithoutBtag, battleTag)"
          >
            {{ nameWithoutBtag }}
            ({{ currentRating }})
            <span v-if="mmrChange !== 0" :class="won">
              <span v-if="mmrChange > 0">+{{ mmrChange }}</span>
              <span v-else>{{ mmrChange }}</span>
            </span>
          </a>
        </div>
      </div>
    </template>
    <div v-if="profile.data">
      <p>{{ nameWithoutBtag }}#{{ btag }}</p>
      <p></p>
      Wins: {{ profile.data.stats.total.wins }} | Losses:
      {{ profile.data.stats.total.losses }} | Total:
      {{ profile.data.stats.total.wins + profile.data.stats.total.losses }}
    </div>
    <div v-else>
      <p>{{ nameWithoutBtag }}#{{ btag }}</p>
      <p>Wins: ... | Losses: ... | Total: ...</p>
    </div>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { PlayerInTeam } from "@/store/typings";
import PlayerIcon from "@/components/PlayerIcon.vue";
import { PlayerProfile } from "@/store/player/types";

@Component({
  components: { PlayerIcon }
})
export default class PlayerMatchInfo extends Vue {
  @Prop() public player!: PlayerInTeam;

  @Prop() public left!: boolean;

  get won() {
    if (Object.prototype.hasOwnProperty.call(this.player, "won")) {
      return this.player.won ? "won" : "lost";
    }

    return "";
  }

  get mmrChange() {
    if (this.player.oldMmr && this.player.currentMmr) {
      return Math.floor(this.player.currentMmr - this.player.oldMmr);
    }

    return 0;
  }

  get currentRating() {
    return Math.floor(this.player.currentMmr);
  }

  get textClass() {
    return this.left ? "text-end" : "text-start";
  }

  get battleTag() {
    return this.player.battleTag;
  }

  get nameWithoutBtag() {
    return this.player.name;
  }

  get btag() {
    return this.player.battleTag;
  }

  public profile = {} as PlayerProfile;

  private async lazyLoadProfile() {
    if (!this.profile.id) {
      this.profile = await this.$store.direct.getters.profileService.retrieveRawProfile(
        this.nameWithoutBtag
      );
    }
  }

  private getPlayerPath(playerName: string, battleTag: string) {
    return "/player/" + playerName + "/" + battleTag;
  }

  public openProfileInNewTab(playerName: string, battleTag: string) {
    const path = this.getPlayerPath(playerName, battleTag);
    window.open(path, "_blank");
  }

  public goToPlayer(playerName: string) {
    const parts = playerName.split("#");

    this.$router
      .push({
        path: "/player/" + parts[0] + "/" + parts[1]
      })
      .catch(err => {
        return err;
      });
  }
}
</script>

<style lang="scss">
.btag {
  font-size: 10px;
}

.spacing-around-mmr-marker {
  padding-right: 18px;
  padding-left: 18px;
}

.won {
  color: green !important;
}

.lost {
  color: red !important;
}

.mmr {
  font-size: 18px !important;
}
</style>
