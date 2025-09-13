<template>
  <div class="bracket-series" :style="style">
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
import { computed, defineComponent, PropType, StyleValue } from "vue";
import { ITournamentSeries, ESeriesState, EMatchState, ISeriesPlayer } from "@/store/tournaments/types";
import TournamentSeriesPlayer from "./TournamentSeriesPlayer.vue";

export default defineComponent({
  name: "TournamentSeries",
  components: {
    TournamentSeriesPlayer,
  },
  props: {
    series: { type: Object as PropType<ITournamentSeries>, required: true },
    seriesIndex: { type: Number, required: true },
    playerHeight: { type: Number, required: true },
    verticalSpace: { type: Number, required: true },
    roundWidth: { type: Number, required: true },
  },
  setup(props) {
    const topPlayer = computed<ISeriesPlayer | undefined>(() => props.series.players?.find((p) => p.team === 0));
    const bottomPlayer = computed<ISeriesPlayer | undefined>(() => props.series.players?.find((p) => p.team === 1));
    const seriesFinished = computed<boolean>(() => [ESeriesState.BYE, ESeriesState.CANCELED, ESeriesState.FINISHED].includes(props.series.state));
    const seriesCanceled = computed<boolean>(() => props.series.state === ESeriesState.CANCELED);

    const seriesSpecial = computed<boolean | undefined>(() => {
      return [ESeriesState.BYE, ESeriesState.CANCELED].includes(props.series.state) ||
        props.series.matches?.some((match) => match.state === EMatchState.CANCELED);
    });

    const style = computed<StyleValue>(() => {
      const marginTop = props.seriesIndex === 0 ? 0 : props.verticalSpace;
      return {
        "margin-top": `${marginTop}px`,
        height: `${2 * props.playerHeight}px`,
      };
    });

    const playerStyle = computed<StyleValue>(() => {
      return {
        height: `${props.playerHeight}px`,
      };
    });

    return {
      topPlayer,
      bottomPlayer,
      seriesFinished,
      seriesCanceled,
      seriesSpecial,
      style,
      playerStyle,
    };
  },
});
</script>

<style lang="scss" scoped>
.bracket-series {
  background-color: #fafafa;
  width: 100%;
  border: 1px solid grey;
}
</style>
