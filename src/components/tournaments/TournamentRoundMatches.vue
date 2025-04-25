<template>
  <div class="bracket-rounds-column" v-bind:style="style">
    <div class="round-name" v-bind:style="roundNameStyle">
      {{ round.name }}
    </div>
    <div v-bind:style="matchesStyle">
      <template>
        <tournament-series
          v-for="(s, index) in series"
          v-bind:key="s.id"
          :series="s"
          :seriesIndex="index"
          :playerHeight="playerHeight"
          :verticalSpace="verticalSpace"
          :roundWidth="roundWidth"
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
