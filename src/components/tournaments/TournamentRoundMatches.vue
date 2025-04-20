<template>
  <div class="bracket-rounds-column" :style>
    <div class="round-name" :style="roundNameStyle">
      {{ round.name }}
    </div>
    <div :style="matchesStyle">
      <template>
        <tournament-series
          v-for="(s, index) in series"
          :key="s.id"
          :series="s"
          :seriesIndex="index"
          :playerHeight
          :verticalSpace
          :roundWidth
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, StyleValue } from "vue";
import { ITournamentRound, ITournamentSeries } from "@/store/tournaments/types";
import TournamentSeries from "./TournamentSeries.vue";

export default defineComponent({
  name: "TournamentRoundMatches",
  components: {
    TournamentSeries,
  },
  props: {
    round: { type: Object as PropType<ITournamentRound>, required: true },
    roundWidth: { type: Number, required: true },
    roundNameHeight: { type: Number, required: true },
    playerHeight: { type: Number, required: true },
    verticalSpace: { type: Number, required: true },
    marginTop: { type: Number, required: true },
  },
  setup(props) {
    const series = computed<ITournamentSeries[]>(() => props.round.series);

    const style = computed<StyleValue>(() => {
      return {
        width: `${props.roundWidth}px`,
      };
    });

    const matchesStyle = computed<StyleValue>(() => {
      return {
        "margin-top": `${props.marginTop + props.playerHeight}px`,
      };
    });

    const roundNameStyle = computed<StyleValue>(() => {
      return {
        height: `${props.roundNameHeight}px`,
      };
    });

    return {
      series,
      style,
      matchesStyle,
      roundNameStyle,
    };
  },
});
</script>

<style lang="scss" scoped>
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
