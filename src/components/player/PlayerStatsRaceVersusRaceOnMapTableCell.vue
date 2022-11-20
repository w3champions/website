<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <td v-on="on" class="number-text" :class="toWinClass">
        {{ toWinText }}
      </td>
    </template>
    <div>
      {{ winAndLossText }}
    </div>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import _ from "lodash";
import { Component, Prop } from "vue-property-decorator";
import { RaceWinLoss } from "@/store/overallStats/types";
import { ERaceEnum } from "@/store/typings";

@Component({
  components: {},
})
export default class PlayerStatsRaceVersusRaceOnMapTableCell extends Vue {
  @Prop() public stats!: RaceWinLoss;
  @Prop() public compareRace!: ERaceEnum;
  @Prop() public winThreshold!: number;
  @Prop() public lossThreshold!: number;

  get toWinText() {
    if (this.isComparingSameRace || this.stats.games == 0) {
      return "-";
    }

    return `${(this.stats.winrate * 100).toFixed(1)}%`;
  }

  get toWinClass() {
    const classes: string[] = [];

    if (this.stats.games == 0 || this.isComparingSameRace) {
      classes.push("stats-empty");
      return classes;
    }

    if (this.stats.winrate > (this.winThreshold || 0.6)) {
      classes.push("won");
    }
    if (this.stats.winrate < (this.lossThreshold || 0.4)) {
      classes.push("lost");
    }

    return classes;
  }

  get winAndLossText() {
    return `(${this.stats.wins}/${this.stats.losses})`;
  }

  get isComparingSameRace() {
    // We must explicitly check nil here because compareRace could be RANDOM and !0 is true
    if (_.isNil(this.compareRace) || !this.stats) {
      return false;
    }

    return this.stats.race === this.compareRace;
  }
}
</script>

<style lang="scss" scoped>
.stats-empty {
  padding-left: 30px;
}
</style>
