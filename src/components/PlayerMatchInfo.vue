<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <div :class="textClass">
        <player-icon :left="left" :race="race" />
        <div>
          <a
            :class="won"
            v-on="on"
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
        </div>
      </div>
    </template>
    <p>{{ nameWithoutBtag }}#{{ battleTag }}</p>
    <p></p>
    Wins: {{ wins }} | Losses: {{ losses }} | Total:
    {{ games }}
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { PlayerInTeam } from "@/store/typings";
import PlayerIcon from "@/components/PlayerIcon.vue";

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

  get wins() {
    return this.player.wins;
  }

  get race() {
    return this.player.race;
  }

  get losses() {
    return this.player.losses;
  }

  get games() {
    return this.player.games;
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
    return "/player/" + this.nameWithoutBtag + "/" + this.battleTag;
  }

  public openProfileInNewTab() {
    const path = this.getPlayerPath();
    window.open(path, "_blank");
  }

  public goToPlayer() {
    this.$router
      .push({
        path: "/player/" + this.nameWithoutBtag + "/" + this.battleTag
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
