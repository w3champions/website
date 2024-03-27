<template>
  <div v-bind:class="`player ${side} ${won ? 'winner' : 'loser'}`" v-bind:style="style">
    <span class="player-slot d-flex align-center" v-bind:class="raceClass" v-bind:style="slotStyle">
      <span class="player-country d-flex justify-center align-center">
        <country-flag-extended
          class="country-flag"
          :location="countryCode"
          :clickable="false"
        />
      </span>
      <span class="player-name">
        {{ name }}
      </span>
    </span>
    <span class="player-score-box d-flex justify-center align-center">
      <span class="player-score">
        {{ score }}
      </span>
    </span>
  </div>
</template>

<script lang="ts">
import isNil from "lodash/isNil";
import { ISeriesPlayer } from "@/store/tournaments/types";
import { Component, Prop, Vue } from "vue-facing-decorator";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import { ERaceEnum } from "@/store/types";

@Component({
  components: {
    CountryFlagExtended,
  },
})
export default class TournamentSeriesPlayer extends Vue {
  @Prop() public side!: "top" | "bottom";
  @Prop() public player!: ISeriesPlayer;
  @Prop() public playerHeight!: number;
  @Prop() public roundWidth!: number;
  @Prop() public seriesFinished!: boolean;
  @Prop() public seriesSpecial!: boolean;
  @Prop() public seriesCanceled!: boolean;

  get won() {
    return this.player?.won ?? false;
  }

  get name() {
    return this.getName(this.player?.battleTag ?? "");
  }

  get countryCode() {
    return this.player?.countryCode;
  }

  get score() {
    if (!this.seriesFinished) {
      return "";
    }
    if (isNil(this.player)) {
      return "";
    }

    let score = "";
    if (!isNil(this.player.score)) {
      score = this.player.score.toString();
    }
    if (!isNil(this.player) && !this.seriesCanceled) {
      score = this.player.won ? "1" : "0";
    }
    if (this.seriesSpecial) {
      score += "*";
    }

    return score;
  }

  get raceClass() {
    if (isNil(this.player)) {
      return "";
    }
    const race = this.player.race;
    return ERaceEnum[race].toLowerCase();
  }

  private getName(battleTag: string) {
    return battleTag.split("#")[0];
  }

  get style() {
    let height = this.playerHeight;
    if (this.side === "bottom") {
      // Subtract 2px to account for the 1px outer border and 1px divider border
      height -= 2;
    }
    return {
      height: `${height}px`,
    };
  }

  get slotStyle() {
    return {
      // subtract box and border width
      "max-width": `${this.roundWidth - 27 - 2}px`,
    };
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
.player-slot {
  width: -webkit-fill-available;
  height: 100%;
}
.player-slot.human {
  background-color: #b8b8f2;
}
.player-slot.orc {
  background-color: #f2b8b8;
}
.player-slot.night_elf {
  background-color: #b8f2b8;
}
.player-slot.undead {
  background-color: #f2b8f2;
}
.player-slot.random {
  background-color: #f2f2b8;
}
.player-country {
  padding: 5px;
  padding-bottom: 1px;
  height: 100%;
  width: 28px;
}
.player-score-box {
  height: 100%;
  min-width: 27px;
  background: lightgrey;
  border-left: 1px solid darkgrey;
}
.player-score {
  position: relative;
  left: -1px;
}
.player-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
