<template>
  <div v-bind:class="`player ${side} ${won ? 'winner' : 'loser'}`" v-bind:style="style">
    <span class="player-name d-flex align-center" v-bind:class="raceClass">
      <span class="player-country">
        <country-flag-extended
          class="country-flag"
          :location="countryCode"
          :clickable="false"
        />
      </span>
      {{name}}
    </span>
    <span class="player-score-box d-flex justify-center align-center">
      <span class="player-score">
        {{score}}
      </span>
    </span>
  </div>
</template>

<script lang="ts">
import { ISeriesPlayer } from "@/store/tournaments/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import { ERaceEnum } from "@/store/typings";

@Component({
  components: {
    CountryFlagExtended,
  }
})
export default class TournamentSeriesPlayer extends Vue {
  @Prop() public side!: 'top' | 'bottom';
  @Prop() public player!: ISeriesPlayer;
  @Prop() public playerHeight!: number;

  get won() {
    return this.player?.won ?? false;
  }

  get name() {
    return this.getName(this.player?.battleTag ?? '');
  }

  get countryCode() {
    return this.player?.countryCode;
  }

  get score() {
    return this.player?.score ?? '';
  }

  get raceClass() {
    const race = this.player?.race;
    return ERaceEnum[race].toLowerCase();
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
.player-name.human {
  background-color: #b8b8f2;
}
.player-name.orc {
  background-color: #f2b8b8;
}
.player-name.night_elf {
  background-color: #b8f2b8;
}
.player-name.undead {
  background-color: #f2b8f2;
}
.player-country {
  padding: 5px;
  height: 100%;
  width: 28px;
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
