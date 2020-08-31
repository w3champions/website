<template>
  <v-container>
    <v-card class="mt-2 filter-blur" tile>
      <v-card-title class="search-bar">
        Season 2 Europe W3Champions Tournament
      </v-card-title>
      <div class="pl-4 filter-blur">
        <p>Winner bracket</p>
        <tournamentBracket
          :bracketRounds="tournament.winnerBracketRounds"
        ></tournamentBracket>

        <p>Losers bracket</p>
        <tournamentBracket
          :bracketRounds="tournament.loserBracketRounds"
        ></tournamentBracket>
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
  ConnectionType,
} from "../store/tournaments/types";
import { ERaceEnum } from "@/store/typings";

import TournamentBracket from "@/components/tournaments/TournamentBracket.vue";
import TournamentRoundConnector from "@/components/tournaments/TournamentRoundConnector.vue";

@Component({
  components: {
    TournamentBracket,
    TournamentRoundConnector,
  },
})
export default class TournamentsView extends Vue {
  get tournament() {
    const round1: ITournamentMatch[] = [
      {
        players: [
          { name: "Vortix", race: ERaceEnum.UNDEAD },
          { name: "Sonik", race: ERaceEnum.NIGHT_ELF },
        ],
      },
      {
        players: [
          { name: "Grubby", race: ERaceEnum.ORC },
          { name: "Blade", race: ERaceEnum.HUMAN },
        ],
      },
      {
        players: [
          { name: "DeMusliM", race: ERaceEnum.HUMAN },
          { name: "Wan", race: ERaceEnum.UNDEAD },
        ],
      },
      {
        players: [
          { name: "Happy", race: ERaceEnum.UNDEAD },
          { name: "Xlord", race: ERaceEnum.UNDEAD },
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

    const final: ITournamentMatch[] = [
      {
        players: [
          { name: "", race: 0 },
          { name: "", race: 0 },
        ],
      },
    ];

    const loserRound1: ITournamentMatch[] = [
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

    const loserRound2: ITournamentMatch[] = [
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

    const loserRound3: ITournamentMatch[] = [
      {
        players: [
          { name: "", race: 0 },
          { name: "", race: 0 },
        ],
      },
    ];

    const loserRound4: ITournamentMatch[] = [
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
          name: 'Round of 8',
          round: 1,
          matches: round1,
        },
        {
          name: 'Round of 4',
          round: 2,
          matches: round2,
        },
        {
          name: 'Semi final',
          round: 3,
          matches: round3,
          connectionType: ConnectionType.StraightOpenDown
        },
        {
          name: 'Final',
          round: 4,
          matches: final,
        },
      ],
      loserBracketRounds: [
        {
          name: 'Losers R1',
          round: 1,
          matches: loserRound1,
          connectionType: ConnectionType.StraightOpen
        },
        {
          name: 'Losers R2',
          round: 2,
          matches: loserRound2,
        },
        {
          name: 'Losers R3',
          round: 3,
          matches: loserRound3,
          connectionType: ConnectionType.StraightOpen
        },
        {
          name: 'Losers Final',
          round: 4,
          matches: loserRound4
        }
      ]
    };

    return result;
  }
}
</script>

<style lang="scss">
.container {
  box-sizing: content-box;
}
</style>
