<template>
  <div v-bind:class="`player ${side} ${playerWon ? 'winner' : 'loser'}`" v-bind:style="style">
    <span class="player-name d-flex align-center">
      <span style="padding: 5px; height: 100%;">
        <country-flag-extended
          class="country-flag"
          :location="'RO'"
          :clickable="false"
        />
      </span>
      {{playerName}}
    </span>
    <span class="player-score-box d-flex justify-center align-center">
      <span class="player-score">
        {{playerScore}}
      </span>
    </span>
  </div>
</template>

<script lang="ts">
import { ISeriesPlayer } from "@/store/tournaments/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";

@Component({
  components: {
    CountryFlagExtended,
  }
})
export default class TournamentSeriesPlayer extends Vue {
  @Prop() public side!: 'top' | 'bottom';
  @Prop() public player!: ISeriesPlayer;
  @Prop() public playerHeight!: number;

  get playerWon() {
    return this.player?.won ?? false;
  }

  get playerName() {
    return this.getName(this.player?.battleTag ?? '');
  }

  get playerScore() {
    return this.player?.score ?? '';
  }

  private getName(battleTag: string) {
    return battleTag.split('#')[0];
  }

  get style() {
    let height = this.playerHeight;
    if (this.side === 'bottom') {
      // Subtract 2px to account for the 1px outer border and 1px divider border
      height -= 2;
    }
    return {
      height: `${height}px`,
    }
  }
}
</script>

<style lang="scss">
.player {
  border-color: darkgrey;
  border-style: solid;
  border-width: 0px;
  display: flex;
}
.player.top {
  border-bottom-width: 1px;
}
.player.bottom {
  border-top-width: 1px;
}
.player.winner {
  font-weight: bold;
}
.player-name {
  width: -webkit-fill-available;
  height: 100%;
}
.player-score-box {
  height: 100%;
  width: 32px;
  background: lightgrey;
  border-left: 1px solid darkgrey;
}
.player-score {
  position: relative;
  left: -1px;
}
</style>
