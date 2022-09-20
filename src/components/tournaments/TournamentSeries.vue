<template>
  <div class="bracket-series" v-bind:style="style">
    <tournament-series-player
      :side="'top'"
      :player="topPlayer"
      :playerHeight="playerHeight"
    />
    <tournament-series-player
      :side="'bottom'"
      :player="bottomPlayer"
      :playerHeight="playerHeight"
    />
  </div>
</template>

<script lang="ts">
import { ITournamentSeries } from "@/store/tournaments/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import TournamentSeriesPlayer from "./TournamentSeriesPlayer.vue";

@Component({
  components: {
    TournamentSeriesPlayer,
  }
})
export default class TournamentSeries extends Vue {
  @Prop() public seriesIndex!: number;
  @Prop() public series!: ITournamentSeries;
  @Prop() public playerHeight!: number;
  @Prop() public verticalSpace!: number;

  get topPlayer() {
    return this.series.players?.find(p => p.team === 0);
  }

  get bottomPlayer() {
    return this.series.players?.find(p => p.team === 1);
  }

  get style() {
    const marginTop = this.seriesIndex === 0 ? 0 : this.verticalSpace;
    return {
      'margin-top': `${marginTop}px`,
      height: `${2 * this.playerHeight}px`,
    }
  }

  get playerStyle() {
    return {
      height: `${this.playerHeight}px`,
    }
  }
}
</script>

<style lang="scss">
.bracket-series {
  background-color: #fafafa;
  width: 100%;
  border: 1px solid grey;
}
</style>
