<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <div :class="textClass">
        <player-icon :left="left" :race="race" :big="bigRaceIcon" />
        <span>
          <a
            :class="won"
            v-on="on"
            @mouseover="lazyLoadWinrate"
            @click="notClickable ? null : goToPlayer()"
            @click.middle="openProfileInNewTab()"
            @click.right="openProfileInNewTab()"
          >
            {{ nameWithoutBtag }}
            <span class="number-text">({{ currentRating }})</span>
            <span class="number-text" v-if="mmrChange !== 0" :class="won">
              <span v-if="mmrChange > 0">+{{ mmrChange }}</span>
              <span v-else>{{ mmrChange }}</span>
            </span>
          </a>
        </span>
      </div>
    </template>
    <div v-if="winrate">
      <p>{{ battleTag }}</p>
      <p></p>
      Wins:
      <span class="number-text">{{ winrate.wins }}</span>
      | Losses:
      <span class="number-text">{{ winrate.losses }}</span>
      | Total:
      <span class="number-text">{{ winrate.games }}</span>
    </div>
    <div v-else>
      <p>{{ battleTag }}</p>
      <p>Wins: ... | Losses: ... | Total: ...</p>
    </div>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { PlayerInTeam } from "@/store/typings";
import PlayerIcon from "@/components/matches/PlayerIcon.vue";
import { RaceStat } from "@/store/player/types";

@Component({
  components: { PlayerIcon },
})
export default class PlayerMatchInfo extends Vue {
  @Prop() public player!: PlayerInTeam;

  @Prop() public left!: boolean;
  @Prop() public bigRaceIcon!: boolean;
  @Prop() public notClickable!: boolean;
  @Prop() public unfinishedMatch!: boolean;

  public winrate: RaceStat = {} as RaceStat;

  get won() {
    if (this.unfinishedMatch) {
      return "";
    }

    if (Object.prototype.hasOwnProperty.call(this.player, "won")) {
      return this.player.won ? "won" : "lost";
    }

    return "";
  }

  get race() {
    return this.player.race;
  }

  get mmrChange() {
    if (this.player.oldMmr && this.player.currentMmr) {
      return Math.floor(this.player.currentMmr - this.player.oldMmr);
    }

    return 0;
  }

  get currentRating() {
    if (this.unfinishedMatch) {
      return Math.floor(this.player.oldMmr);
    }

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

  private getPlayerPath() {
    return "/player/" + encodeURIComponent(this.player.battleTag);
  }

  public openProfileInNewTab() {
    const path = this.getPlayerPath();
    window.open(path, "_blank");
  }

  private async lazyLoadWinrate() {
    this.winrate = await this.$store.direct.getters.profileService.retrieveWinRate(
      this.player.battleTag,
      this.$store.direct.state.rankings.selectedSeason.id
    );
  }

  public goToPlayer() {
    this.$router
      .push({
        path: "/player/" + encodeURIComponent(this.player.battleTag),
      })
      .catch((err) => {
        return err;
      });
  }
}
</script>

<style lang="scss">
.btag {
  font-size: 10px;
}

.mmr {
  font-size: 18px !important;
}
</style>
