<template>
  <div class="bracket-rounds-column" v-bind:style="style">
    <div class="round-name" v-bind:style="roundNameStyle">
      {{round.name}}
    </div>
    <div v-bind:style="matchesStyle">
      <template v-for="(s, index) in series">
        <tournament-series
          :series="s"
          :seriesIndex="index"
          :playerHeight="playerHeight"
          :verticalSpace="verticalSpace"
          :roundWidth="roundWidth"
          v-bind:key="s.id"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { ITournamentRound, ITournamentSeries } from "@/store/tournaments/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import TournamentSeries from "./TournamentSeries.vue";

@Component({
  components: {
    TournamentSeries,
  },
})
export default class TournamentRoundMatches extends Vue {
  @Prop() public round!: ITournamentRound;
  @Prop() public roundWidth!: number;
  @Prop() public roundNameHeight!: number;
  @Prop() public playerHeight!: number;
  @Prop() public verticalSpace!: number;
  @Prop() public marginTop!: number;

  get series(): ITournamentSeries[] {
    return this.round.series;
  }

  get style() {
    return {
      width: `${this.roundWidth}px`,
    }
  }

  get matchesStyle() {
    return {
      'margin-top': `${this.marginTop + this.playerHeight}px`,
    }
  }

  get roundNameStyle() {
    return {
      height: `${this.roundNameHeight}px`,
    }
  }
}
</script>

<style lang="scss">
.bracket-rounds-column {
  width: 100%;
}
.round-name {
  background-color: #fafafa;
  border: 1px solid grey;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
