<template>
  <div v-if="showBracket" class="black--text">
    <h3 class="mt-3">Bracket</h3>
    <div class="d-flex pa-2" v-bind:style="style">
      <template v-for="(round, roundIndex) in rounds">
        <tournament-round-matches
          :key="`matches-${roundIndex}`"
          :round="round"
          :roundWidth="roundWidth"
          :playerHeight="playerHeight"
          :roundNameHeight="roundNameHeight"
          :verticalSpace="roundDimensions[roundIndex].verticalSpace"
          :marginTop="roundDimensions[roundIndex].marginTop"
        />
        <tournament-round-connectors
          v-if="roundIndex + 1 < rounds.length"
          :key="`connectors-${roundIndex}`"
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
</template>

<script lang="ts">
import _ from "lodash";
import { ETournamentState, ITournament, ITournamentRound } from "@/store/tournaments/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import TournamentRoundMatches from "./TournamentRoundMatches.vue";
import TournamentRoundConnectors from "./TournamentRoundConnectors.vue";

@Component({
  components: {
    TournamentRoundMatches,
    TournamentRoundConnectors,
  },
})
export default class TournamentBracket extends Vue {
  @Prop() public tournament!: ITournament;
  @Prop({ default: 156 }) public roundWidth!: number;
  @Prop({ default: 36 }) public connectorWidth!: number;
  @Prop({ default: 26 }) public verticalSpace!: number;
  @Prop({ default: 25 }) public playerHeight!: number;
  @Prop({ default: 32 }) public roundNameHeight!: number;
  @Prop({ default: 14 }) public fontSize!: number;

  get showBracket() {
    return [
      ETournamentState.STARTED, ETournamentState.SHOW_WINNER, ETournamentState.FINISHED,
    ].includes(this.tournament.state);
  }

  get rounds(): ITournamentRound[] {
    const playerExtraData = _.fromPairs(
      this.tournament.players.map(p => [
        p.battleTag,
        _.pick(p, [ 'countryCode', 'race' ]),
      ])
    );
    for (const round of this.tournament.rounds) {
      for (const series of round.series) {
        if (!series.players) {
          continue;
        }
        for (const player of series.players) {
          _.assign(player, playerExtraData[player.battleTag]);
        }
      }
    }
    return this.tournament.rounds;
  }

  get roundDimensions() {
    const playerHeight = this.playerHeight;
    let verticalSpace = this.verticalSpace;
    let marginTop = 0;
    const dimensions: any[] = [];
    _.times(this.rounds.length, () => {
      dimensions.push({
        verticalSpace,
        marginTop,
      });
      marginTop += verticalSpace / 2 + playerHeight;
      verticalSpace = 2 * (verticalSpace + playerHeight);
    });
    return dimensions;
  }

  get style() {
    return {
      'font-size': `${this.fontSize}px`,
    }
  }
}
</script>
