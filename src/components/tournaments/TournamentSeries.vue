<template>
  <div class="bracket-series" v-bind:style="style">
    <tournament-series-player
      :side="'top'"
      :player="topPlayer"
      :playerHeight="playerHeight"
      :seriesCanceled="seriesCanceled"
      :seriesFinished="seriesFinished"
      :seriesSpecial="seriesSpecial"
      :roundWidth="roundWidth"
    />
    <tournament-series-player
      :side="'bottom'"
      :player="bottomPlayer"
      :playerHeight="playerHeight"
      :seriesCanceled="seriesCanceled"
      :seriesFinished="seriesFinished"
      :seriesSpecial="seriesSpecial"
      :roundWidth="roundWidth"
    />
  </div>
</template>

<script lang="ts">
import { ITournamentSeries, ESeriesState, EMatchState } from "@/store/tournaments/types";
import { Component, Prop, Vue } from "vue-facing-decorator";
import TournamentSeriesPlayer from "./TournamentSeriesPlayer.vue";

@Component({
  components: {
    TournamentSeriesPlayer,
  },
})
export default class TournamentSeries extends Vue {
  @Prop() public seriesIndex!: number;
  @Prop() public series!: ITournamentSeries;
  @Prop() public playerHeight!: number;
  @Prop() public verticalSpace!: number;
  @Prop() public roundWidth!: number;

  get topPlayer() {
    return this.series.players?.find((p) => p.team === 0);
  }

  get bottomPlayer() {
    return this.series.players?.find((p) => p.team === 1);
  }

  get seriesFinished() {
    return [ESeriesState.BYE, ESeriesState.CANCELED, ESeriesState.FINISHED].includes(this.series.state);
  }

  get seriesCanceled() {
    return this.series.state === ESeriesState.CANCELED;
  }

  get seriesSpecial() {
    return [ESeriesState.BYE, ESeriesState.CANCELED].includes(this.series.state) ||
      this.series.matches?.some((match) => match.state === EMatchState.CANCELED);
  }

  get style() {
    const marginTop = this.seriesIndex === 0 ? 0 : this.verticalSpace;
    return {
      "margin-top": `${marginTop}px`,
      height: `${2 * this.playerHeight}px`,
    };
  }

  get playerStyle() {
    return {
      height: `${this.playerHeight}px`,
    };
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
