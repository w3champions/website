<template>
  <v-container class="tournament-page">
    <v-card class="mt-2 filter-blur">
      <v-card-title class="search-bar">
        Season 2 Tournament
      </v-card-title>
      <div class="pl-4 filter-blur tourney-content">
        <gateway-select />

        <div style="min-width: 800px;">
          <p class="mt-4">Winner bracket</p>
          <tournamentBracket
            :bracketRounds="tournament.winnerBracketRounds"
          ></tournamentBracket>

          <p>Losers bracket</p>
          <tournamentBracket
            :bracketRounds="tournament.loserBracketRounds"
          ></tournamentBracket>
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
  ConnectionType,
} from "../store/tournaments/types";
import { ERaceEnum, EGameMode } from "@/store/typings";

import { Gateways } from "@/store/ranking/types";

import GatewaySelect from "@/components/common/GatewaySelect.vue";
import TournamentBracket from "@/components/tournaments/TournamentBracket.vue";
import TournamentRoundConnector from "@/components/tournaments/TournamentRoundConnector.vue";

@Component({
  components: {
    GatewaySelect,
    TournamentBracket,
    TournamentRoundConnector,
  },
})
export default class TournamentsView extends Vue {
  get gateway() {
    return this.$store.direct.state.gateway;
  }

  get tournament() {
    if (this.gateway == Gateways.Europe) {
      return this.tournamentEU;
    } else {
      return this.tournamentNA;
    }
  }

  get tournamentEU() {
    const round1: ITournamentMatch[] = [
      {
        players: [
          { name: "VortiX", race: ERaceEnum.UNDEAD, countryCode: 'ES' },
          { name: "Sonik", race: ERaceEnum.NIGHT_ELF, countryCode: 'UA' },
        ],
      },
      {
        players: [
          { name: "Grubby", race: ERaceEnum.ORC, countryCode: 'NL' },
          { name: "Blade", race: ERaceEnum.HUMAN, countryCode: 'MD' },
        ],
      },
      {
        players: [
          { name: "DeMusliM", race: ERaceEnum.HUMAN, countryCode: 'UK' },
          { name: "WaN", race: ERaceEnum.UNDEAD, countryCode: 'DE' },
        ],
      },
      {
        players: [
          { name: "Happy", race: ERaceEnum.UNDEAD, countryCode: 'RU' },
          { name: "XlorD", race: ERaceEnum.UNDEAD, countryCode: 'DE' },
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
          name: "Round of 8",
          round: 1,
          matches: round1,
        },
        {
          name: "Round of 4",
          round: 2,
          matches: round2,
        },
        {
          name: "Semi final",
          round: 3,
          matches: round3,
          connectionType: ConnectionType.StraightOpenDown,
        },
        {
          name: "Final",
          round: 4,
          matches: final,
        },
      ],
      loserBracketRounds: [
        {
          name: "Losers R1",
          round: 1,
          matches: loserRound1,
          connectionType: ConnectionType.StraightOpen,
        },
        {
          name: "Losers R2",
          round: 2,
          matches: loserRound2,
        },
        {
          name: "Losers R3",
          round: 3,
          matches: loserRound3,
          connectionType: ConnectionType.StraightOpen,
        },
        {
          name: "Losers Final",
          round: 4,
          matches: loserRound4,
        },
      ],
    };

    return result;
  }

  get tournamentNA() {
    const round1: ITournamentMatch[] = [
      {
        players: [
          { name: "SaysO", race: ERaceEnum.UNDEAD, countryCode: 'NZ' },
          { name: "Kingdeuce", race: ERaceEnum.UNDEAD, countryCode: 'CA' },
        ],
      },
      {
        players: [
          { name: "Hitman", race: ERaceEnum.ORC, countryCode: 'US' },
          { name: "AccCreate", race: ERaceEnum.NIGHT_ELF, countryCode: 'US'  },
        ],
      },
      {
        players: [
          { name: "CrunCher", race: ERaceEnum.HUMAN, countryCode: 'US'  },
          { name: "hailua", race: ERaceEnum.HUMAN, countryCode: 'US'  },
        ],
      },
      {
        players: [
          { name: "iNSUPERABLE", race: ERaceEnum.UNDEAD, countryCode: 'CA'  },
          { name: "Ark", race: ERaceEnum.NIGHT_ELF, countryCode: 'US'  },
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
          name: "Round of 8",
          round: 1,
          matches: round1,
        },
        {
          name: "Round of 4",
          round: 2,
          matches: round2,
        },
        {
          name: "Semi final",
          round: 3,
          matches: round3,
          connectionType: ConnectionType.StraightOpenDown,
        },
        {
          name: "Final",
          round: 4,
          matches: final,
        },
      ],
      loserBracketRounds: [
        {
          name: "Losers R1",
          round: 1,
          matches: loserRound1,
          connectionType: ConnectionType.StraightOpen,
        },
        {
          name: "Losers R2",
          round: 2,
          matches: loserRound2,
        },
        {
          name: "Losers R3",
          round: 3,
          matches: loserRound3,
          connectionType: ConnectionType.StraightOpen,
        },
        {
          name: "Losers Final",
          round: 4,
          matches: loserRound4,
        },
      ],
    };

    return result;
  }
}
</script>

<style lang="scss">
.tournament-page {
  box-sizing: content-box;
}

.tourney-content {
  overflow-x: auto;
}
</style>
