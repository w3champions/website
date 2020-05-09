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
import { Component, Prop } from "vue-property-decorator";
import {RaceStat} from "@/store/player/types";

@Component({
  components: {}
})
export default class PlayerStatsRaceVersusRaceOnMapTableCell extends Vue {
  @Prop() public stats!: RaceStat;

  get toWinText() {
    return `${(this.stats.winrate * 100).toFixed(1)}%`;
  }

  get toWinClass() {
    if (this.stats.games == 0) return ""
    if (this.stats.winrate > 0.6) return "won"
    if (this.stats.winrate < 0.4) return "lost"
    return ""
  }

  get winAndLossText() {
    return `(${this.stats.wins}/${this.stats.losses})`;
  }
}
</script>
