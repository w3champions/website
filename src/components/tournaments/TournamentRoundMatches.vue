<template>
  <div class="bracket-rounds-column" v-bind:style="style">
    <div class="round-name" v-bind:style="roundNameStyle">
      {{ round.name }}
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
import { computed, ComputedRef, defineComponent, PropType, StyleValue } from "vue";
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
    const series: ComputedRef<ITournamentSeries[]> = computed((): ITournamentSeries[] => props.round.series);

    const style: ComputedRef<StyleValue> = computed((): StyleValue => {
      return {
        width: `${props.roundWidth}px`,
      };
    });

    const matchesStyle: ComputedRef<StyleValue> = computed((): StyleValue => {
      return {
        "margin-top": `${props.marginTop + props.playerHeight}px`,
      };
    });

    const roundNameStyle: ComputedRef<StyleValue> = computed((): StyleValue => {
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
