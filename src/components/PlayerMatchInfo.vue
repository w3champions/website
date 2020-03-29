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
            @click="goToPlayer(name)"
            @click.middle="openProfileInNewTab(name)"
            @click.right="openProfileInNewTab(name)"
          >
            {{ nameWithoutBtag }}
            <span v-if="mmrChange !== 0" :class="won">
              ({{ currentRating }})
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
import { ERaceEnum, Mmr } from "@/store/typings";
import PlayerIcon from "@/components/PlayerIcon.vue";
import { PlayerProfile } from "../store/player/types";

@Component({
  components: { PlayerIcon }
})
export default class PlayerMatchInfo extends Vue {
  @Prop() public player!: {
    battleTag: string;
    race: ERaceEnum;
    won?: boolean;
    mmr: Mmr;
    updatedMmr: Mmr;
  };

  @Prop() public left!: boolean;

  get won() {
    if (Object.prototype.hasOwnProperty.call(this.player, "won")) {
      return this.player.won ? "won" : "lost";
    }

    return "";
  }

  get mmrChange() {
    if (this.player.mmr && this.player.updatedMmr) {
      return Math.floor(this.player.updatedMmr.rating - this.player.mmr.rating);
    }

    return 0;
  }

  get currentRating() {
    return Math.floor(this.player.mmr.rating);
  }

  get textClass() {
    return this.left ? "text-end" : "text-start";
  }

  get name() {
    return this.player.battleTag;
  }

  get nameWithoutBtag() {
    return this.name.split("#")[0];
  }

  get btag() {
    return this.name.split("#")[1];
  }

  public profile = {} as PlayerProfile;

  private async lazyLoadProfile() {
    if (!this.profile.account) {
      this.profile = await this.$store.direct.getters.profileService.retrieveRawProfile(
        this.name
      );
    }
  }

  private getPlayerPath(playerName: string) {
    const parts = playerName.split("#");

    return "/player/" + parts[0] + "/" + parts[1];
  }

  public openProfileInNewTab(playerName: string) {
    const path = this.getPlayerPath(playerName);
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
