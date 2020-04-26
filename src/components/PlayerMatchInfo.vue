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
            @click="goToPlayer()"
            @click.middle="openProfileInNewTab()"
            @click.right="openProfileInNewTab()"
          >
            {{ nameWithoutBtag }}
            ({{ currentRating }})
            <span v-if="mmrChange !== 0" :class="won">
              <span v-if="mmrChange > 0">+{{ mmrChange }}</span>
              <span v-else>{{ mmrChange }}</span>
            </span>
          </a>
        </span>
      </div>
    </template>
    <div v-if="winrate">
      <p>{{ nameWithoutBtag }}#{{ battleTag }}</p>
      <p></p>
      Wins: {{ winrate.wins }} | Losses: {{ winrate.losses }} | Total:
      {{ winrate.games }}
    </div>
    <div v-else>
      <p>{{ nameWithoutBtag }}#{{ battleTag }}</p>
      <p>Wins: ... | Losses: ... | Total: ...</p>
    </div>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { PlayerInTeam } from "@/store/typings";
import PlayerIcon from "@/components/PlayerIcon.vue";
import {RaceStat} from "@/store/player/types";

@Component({
  components: { PlayerIcon }
})
export default class PlayerMatchInfo extends Vue {
  @Prop() public player!: PlayerInTeam;

  @Prop() public left!: boolean;
  @Prop() public bigRaceIcon!: boolean;

  public winrate: RaceStat = {} as RaceStat;

  get won() {
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
    return "/player/" + this.player.id;
  }

  public openProfileInNewTab() {
    const path = this.getPlayerPath();
    window.open(path, "_blank");
  }

  private async lazyLoadWinrate() {
    this.winrate = await this.$store.direct.getters.profileService.retrieveWinRate(
      this.player.id
    );
  }

  public goToPlayer() {
    this.$router
      .push({
        path: "/player/" + encodeURIComponent(this.player.id)
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

.mmr {
  font-size: 18px !important;
}
</style>
