<template>
  <div v-if="showBracket" class="text-black">
    <h3 class="mt-3">Bracket</h3>
    <div class="d-flex pa-2" v-bind:style="style">
      <div v-for="(round, roundIndex) in rounds" :key="`matches-${roundIndex}`" class="d-flex">
        <template>
          <tournament-round-matches
            :round="round"
            :roundWidth="roundWidth"
            :playerHeight="playerHeight"
            :roundNameHeight="roundNameHeight"
            :verticalSpace="roundDimensions[roundIndex].verticalSpace"
            :marginTop="roundDimensions[roundIndex].marginTop"
          />
          <tournament-round-connectors
            v-if="roundIndex + 1 < rounds.length"
            :seriesCount="round.series.length"
            :connectorWidth="connectorWidth"
            :playerHeight="playerHeight"
            :roundNameHeight="roundNameHeight"
            :verticalSpace="roundDimensions[roundIndex].verticalSpace"
            :marginTop="roundDimensions[roundIndex].marginTop"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, PropType, StyleValue } from "vue";
import assign from "lodash/assign";
import fromPairs from "lodash/fromPairs";
import pick from "lodash/pick";
import times from "lodash/times";
import { ETournamentState, ITournament, ITournamentRound, BracketDimensions } from "@/store/tournaments/types";
import TournamentRoundMatches from "./TournamentRoundMatches.vue";
import TournamentRoundConnectors from "./TournamentRoundConnectors.vue";

export default defineComponent({
  name: "TournamentBracket",
  components: {
    TournamentRoundMatches,
    TournamentRoundConnectors,
  },
  props: {
    tournament: { type: Object as PropType<ITournament>, required: true },
    roundWidth: { type: Number, required: false, default: 156 },
    connectorWidth: { type: Number, required: false, default: 36 },
    verticalSpace: { type: Number, required: false, default: 26 },
    playerHeight: { type: Number, required: false, default: 25 },
    roundNameHeight: { type: Number, required: false, default: 32 },
    fontSize: { type: Number, required: false, default: 14 },
  },
  setup(props) {
    const style: ComputedRef<StyleValue> = computed((): StyleValue => {
      return {
        "font-size": `${props.fontSize}px`,
      };
    });

    const showBracket: ComputedRef<boolean> = computed((): boolean => {
      return [
        ETournamentState.STARTED, ETournamentState.SHOW_WINNER, ETournamentState.FINISHED,
      ].includes(props.tournament.state);
    });

    const rounds: ComputedRef<ITournamentRound[]> = computed((): ITournamentRound[] => {
      const playerExtraData = fromPairs(
        props.tournament.players.map((p) => [
          p.battleTag,
          pick(p, [ "countryCode", "race" ]),
        ])
      );
      for (const round of props.tournament.rounds) {
        for (const series of round.series) {
          if (!series.players) {
            continue;
          }
          for (const player of series.players) {
            assign(player, playerExtraData[player.battleTag]);
          }
        }
      }
      return props.tournament.rounds;
    });

    const roundDimensions: ComputedRef<BracketDimensions[]> = computed((): BracketDimensions[] => {
      const playerHeight = props.playerHeight;
      let verticalSpace = props.verticalSpace;
      let marginTop = 0;
      const dimensions: BracketDimensions[] = [];
      times(rounds.value.length, () => {
        dimensions.push({
          verticalSpace,
          marginTop,
        });
        marginTop += verticalSpace / 2 + playerHeight;
        verticalSpace = 2 * (verticalSpace + playerHeight);
      });
      return dimensions;
    });

    return {
      showBracket,
      rounds,
      roundDimensions,
      style,
    };
  },
});
</script>

<style lang="scss" scoped>
.xoxo {
  display: flex;
}
</style>