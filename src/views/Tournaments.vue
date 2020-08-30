<template>
  <v-container>
    <v-card class="mt-2 pl-2" tile>
      <v-card-title class="search-bar"></v-card-title>
      <div class="bracket-wrapper bracket-player">
        <div class="bracket-scroller">
          <div style="width: 100%;" class="bracket bracket-width-2col-20">
            <div
              v-for="round in tournament.winnerBracketRounds"
              :key="round.round"
            >
              <div
                class="bracket-column bracket-column-matches"
                style="width: 150px;"
              >
                <div style="height: 40px; margin-top: 0px;">
                  <div class="bracket-header">Round {{ round.round }}</div>
                </div>
                <div
                  class="bracket-game"
                  v-for="(match, matchIndex) in round.matches"
                  :key="matchIndex"
                >
                  <div class="icon" style="margin-top: 30px; right: 16px;" />
                  <div
                    v-bind:class="getBracketCellClass(round)"
                    v-for="(player, playerIndex) in match.players"
                    :key="playerIndex"
                  >
                    <div
                      v-bind:class="getClass(player, playerIndex)"
                      style="padding-right: 23px; cursor: pointer;"
                    >
                      &nbsp; &nbsp;
                      <span style="vertical-align: -1px;">
                        {{ player.name }}
                      </span>
                      <div class="bracket-score" style="width: 21px;" />
                    </div>
                  </div>
                </div>
              </div>
              <tournamentRoundConnector
                :round="round.round"
                :totalRounds="tournament.winnerBracketRounds.length"
                :matchesInRound="round.matches.length"
              ></tournamentRoundConnector>
            </div>
            <div style="clear: left;"></div>
          </div>
          <div class="bracket-push" />
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import {
  ITournamentPlayer,
  ITournamentMatch,
  ITournamentRound,
  ITournament,
} from "../store/tournaments/types";
import { ERaceEnum } from "@/store/typings";
import TournamentRoundConnector from "@/components/tournaments/TournamentRoundConnector.vue";
import { matches } from "lodash";

@Component({
  components: {
    TournamentRoundConnector,
  },
})
export default class TournamentsView extends Vue {
  get tournament() {
    const round1: ITournamentMatch[] = [
      {
        players: [
          { name: "Happy", race: ERaceEnum.UNDEAD },
          { name: "DemusliM", race: ERaceEnum.HUMAN },
        ],
      },
      {
        players: [
          { name: "Grubby", race: ERaceEnum.ORC },
          { name: "Vortix", race: ERaceEnum.UNDEAD },
        ],
      },
      {
        players: [
          { name: "Blade", race: ERaceEnum.HUMAN },
          { name: "Wan", race: ERaceEnum.UNDEAD },
        ],
      },
      {
        players: [
          { name: "Xlord", race: ERaceEnum.UNDEAD },
          { name: "Sonik", race: ERaceEnum.NIGHT_ELF },
        ],
      },
    ];

    const round2: ITournamentMatch[] = [
      {
        players: [
          { name: "", race: 0 },
          { name: "", race: 0 },
        ],
      },
      {
        players: [
          { name: "", race: 0 },
          { name: "", race: 0 },
        ],
      },
    ];

    const round3: ITournamentMatch[] = [
      {
        players: [
          { name: "", race: 0 },
          { name: "", race: 0 },
        ],
      },
    ];

    const result: ITournament = {
      winnerBracketRounds: [
        {
          round: 1,
          matches: round1,
        },
        {
          round: 2,
          matches: round2,
        },
        {
          round: 3,
          matches: round3
        }
      ],
    };

    return result;
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

  getBracketCellClass(round: ITournamentRound) {
    return `bracket-cell-r${round.round}`;
  }
}
</script>

<style lang="scss">
.bracket-wrapper {
  min-height: 0.01%;
  pointer-events: auto;
  overflow-x: auto;
  padding-bottom: 15px;
  box-sizing: content-box;
}

.bracket-scroller {
  pointer-events: none;
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

.bracket-cell-r1,
.bracket-cell-r2,
.bracket-cell-r3,
.bracket-cell-r4,
.bracket-cell-r5,
.bracket-cell-r6,
.bracket-cell-r7 {
  position: relative;
}

.bracket-cell-r1 {
  height: 36px;
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

.bracket-game .flag img {
  vertical-align: middle;
  width: 18px;
  height: 12px;
  image-rendering: -webkit-optimize-contrast;
}

.flag img {
  width: 18px;
  height: 12px;
  vertical-align: middle;
  image-rendering: -webkit-optimize-contrast;
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

.bracket-cell-r2 {
  height: 72px;
}

.bracket-cell-r3 {
    height: 144px;
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
</style>
