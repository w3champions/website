<template>
  <div class="bracket-wrapper bracket-player">
    <div class="bracket-scroller">
      <div
        style="width: 100%;"
        class="bracket bracket-width-2col-20"
        v-if="bracketRoundsWithDimensions"
      >
        <template v-for="(round, roundIndex) in bracketRounds">
          <div
            :key="round.round"
            class="bracket-column bracket-column-matches"
            style="width: 150px;"
          >
            <div
              style="margin-top: 0px;"
              v-bind:style="`height: ${round.dimensions.headerHeight}px`"
            >
              <div class="bracket-header">{{ round.name }}</div>
            </div>
            <div
              @click="matchSelected(match)"
              class="bracket-game"
              v-for="(match, matchIndex) in round.matches"
              :key="matchIndex"
            >
              <div
                class="bracket-cell"
                v-bind:style="`height: ${round.dimensions.cellHeight}px;`"
                v-for="(player, playerIndex) in match.players"
                :key="playerIndex"
              >
                <div
                  v-bind:class="getClass(player, playerIndex)"
                  style="padding-right: 23px; cursor: pointer;"
                >
                  <div
                    class="country-flag__container"
                  >
                    <country-flag-extended
                      class="country-flag"
                      :location="player.countryCode"
                      size="small"
                    />
                  </div>
                  <span style="vertical-align: -1px; padding-left:3px">
                    {{ player.name }}
                  </span>
                  <div class="bracket-score" style="width: 21px;" >{{ player.score }}</div>
                </div>
              </div>
            </div>
          </div>
          <tournamentRoundConnector
            :key="`conn${round.round}`"
            :round="round"
            :prevRound="bracketRounds[roundIndex - 1]"
            :totalRounds="totalRounds"
            :matchesInRound="round.matches.length"
          ></tournamentRoundConnector>
        </template>
        <div style="clear: left;"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import {
  ITournamentPlayer,
  ITournamentMatch,
  ITournamentRound,
  ITournament,
  ConnectionType,
} from "../../store/tournaments/types";
import { ERaceEnum } from "@/store/typings";
import TournamentRoundConnector from "@/components/tournaments/TournamentRoundConnector.vue";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";

@Component({
  components: {
    TournamentRoundConnector,
    CountryFlagExtended,
  },
})
export default class TournamentBracket extends Vue {
  @Prop() bracketRounds!: ITournamentRound[];

  get totalRounds() {
    if (!this.bracketRounds) {
      return 0;
    }

    return this.bracketRounds.length;
  }

  get bracketRoundsWithDimensions() {
    for (let index = 0; index < this.bracketRounds.length; index++) {
      const round = this.bracketRounds[index];
      const prevRound = this.bracketRounds[index - 1];

      round.dimensions = round.dimensions || ({} as any);

      if (round.dimensions) {
        round.dimensions.headerHeight = this.calculateHeaderHeight(
          round,
          prevRound
        );
        round.dimensions.cellHeight = this.calculateCellHeight(
          round,
          prevRound
        );
      }
    }

    return this.bracketRounds;
  }

  getClass(player: ITournamentPlayer, index: number) {
    return {
      "bracket-player-top": index == 0,
      "bracket-player-bottom": index == 1,
      "bracket-human": player.race == ERaceEnum.HUMAN,
      "bracket-orc": player.race == ERaceEnum.ORC,
      "bracket-ud": player.race == ERaceEnum.UNDEAD,
      "bracket-elf": player.race == ERaceEnum.NIGHT_ELF,
    };
  }

  private matchSelected(match: ITournamentMatch) {
    this.$emit("matchSelected", match);
  }

  private calculateCellHeight(
    round: ITournamentRound,
    prevRound: ITournamentRound
  ) {
    let previousHeight = 18;
    let multiplier = 2;

    if (prevRound) {
      previousHeight = prevRound?.dimensions?.cellHeight || 18;

      if (
        prevRound.connectionType == ConnectionType.StraightOpen ||
        prevRound.connectionType == ConnectionType.StraightOpenDown
      ) {
        multiplier = 1;
      }
    }

    return previousHeight * multiplier;
  }

  private calculateHeaderHeight(
    round: ITournamentRound,
    prevRound: ITournamentRound
  ) {
    let height = 40;
    if ((prevRound || round).connectionType === ConnectionType.StraightOpen) {
      height = 64 - (round.round - 1) * 12;
    }

    if (
      prevRound &&
      prevRound.connectionType === ConnectionType.StraightOpenDown
    ) {
      height = (prevRound.dimensions?.headerHeight || 0) + 12;
    }

    return height;
  }
}
</script>

<style lang="scss">
.bracket-wrapper {
  min-height: 0.01%;
  pointer-events: auto;
  padding-bottom: 15px;
  box-sizing: content-box;
}

.bracket {
  font-size: 11px;
  color: #000000;
  background: transparent;
  display: table;
  -webkit-transform-origin: left top 0;
  transform-origin: left top 0;
}

.bracket-column {
  float: left;
  position: relative;
}

.bracket-header {
  border-radius: 2px;
  border: 1px solid #aaaaaa;
  padding: 2px 0 2px 0;
  position: relative;
  left: 0;
  right: 0;
  line-height: 18px;
  margin-bottom: 20px;
  text-align: center;
  background: #ebebeb;
}

.bracket-game {
  position: relative;
}

.bracket-game .icon,
.table-battleroyale-results .icon,
.match-row-icon {
  cursor: pointer;
  height: 12px;
  width: 12px;
  background-image: url(data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cdefs%3E%3Cstyle%3E.c%7Bfill%3A%23616161%7D.i%7Bfill%3A%23fff%7D%3C%2Fstyle%3E%3C%2Fdefs%3E%3Ccircle%20class%3D%22c%22%20cx%3D%226%22%20cy%3D%226%22%20r%3D%226%22%2F%3E%3Cpolygon%20class%3D%22i%22%20points%3D%224%205%204%206%205%206%205%209%204%209%204%2010%208%2010%208%209%207%209%207%202%205%202%205%204%207%204%207%205%204%205%22%2F%3E%3C%2Fsvg%3E);
  background-size: contain;
  background-repeat: no-repeat;
  background-color: transparent;
  z-index: 500;
  position: absolute;
  image-rendering: -webkit-optimize-contrast;
}

.bracket-cell,
.bracket-cell-r1,
.bracket-cell-r2,
.bracket-cell-r3,
.bracket-cell-r4,
.bracket-cell-r5,
.bracket-cell-r6,
.bracket-cell-r7 {
  position: relative;
}

.bracket-team-top,
.bracket-team-bottom,
.bracket-player-top,
.bracket-player-bottom,
.bracket-team-middle,
.bracket-player-middle,
.bracket-team-inner,
.bracket-player-inner {
  border-radius: 0 0 2px 2px;
  border: solid #aaaaaa 1px;
  position: absolute;
  padding: 1px;
  min-height: 20px;
  line-height: 18px;
  background: #f2f2f2;
  left: 0;
  right: 0;
}

.match-row,
.bracket-hover,
.grouptableslot,
.matchlistslot,
.bracket-team-top,
.bracket-team-bottom,
.bracket-team-middle,
.bracket-team-inner,
.bracket-player-top,
.bracket-player-bottom,
.bracket-player-middle,
.bracket-player-inner {
  transition: 0.5s;
}

.bracket-team-top,
.bracket-player-top {
  bottom: 0;
  border-radius: 2px 2px 0 0;
}

.bracket-score {
  text-align: center;
  background: #ebebeb;
  border-left: 1px solid #aaaaaa;
  position: absolute;
  line-height: 22px;
  right: 0;
  top: 0;
  bottom: 0;
}

.wiki-warcraft .bracket-popup-wrapper.bracket-popup-player {
  width: 320px;
}

.bracket-popup-wrapper {
  box-sizing: border-box;
  display: none;
  position: fixed;
  transform: translateZ(0);
  z-index: 1000;
  font-weight: normal;
  white-space: normal;
  font-size: 12px;
}

.bracket-elf {
  background: rgb(184, 242, 184);
}

.bracket-human {
  background: rgb(184, 184, 242);
}

.bracket-orc {
  background: rgb(242, 184, 184);
}

.bracket-ud {
  background: rgb(242, 184, 242);
}

.bracket-wrapper .country-flag__container {
  position: relative;
  width: 15px;
  height: 10px;
  display: inline-block;
}

.bracket-wrapper .country-flag {
  position: absolute;
}
</style>
