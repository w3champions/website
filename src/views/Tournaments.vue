<template>
  <v-container class="tournament-page">
    <v-card class="mt-2 filter-blur">
      <v-card-title class="search-bar">
        Season 2 Tournament
      </v-card-title>

      <div class="pl-4 filter-blur tourney-content">
        <div class="mb-2">
          <a href="https://matcherino.com/tournaments/31685">
            Donate to Prize Pool
          </a>
        </div>

        <gateway-select />

        <div v-if="tournament">
          <tournament-match-update
            :tournamentMatch="selectedMatch"
            :isModalOpened="isEditMatchModalOpened"
            @modalClosed="closeModal"
            @saveChanges="updateTournament"
          >
          </tournament-match-update>
          <div style="min-width: 800px;">
            <p class="mt-4">Winner bracket</p>
            <tournamentBracket
              @matchSelected="matchSelected"
              :bracketRounds="tournament.winnerBracketRounds"
            ></tournamentBracket>

            <p>Losers bracket</p>
            <tournamentBracket
              @matchSelected="matchSelected"
              :bracketRounds="tournament.loserBracketRounds"
            ></tournamentBracket>
          </div>
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
import TournamentMatchUpdate from "@/components/tournaments/TournamentMatchUpdate.vue";

@Component({
  components: {
    GatewaySelect,
    TournamentBracket,
    TournamentRoundConnector,
    TournamentMatchUpdate
  },
})
export default class TournamentsView extends Vue {
  public selectedMatch = {} as ITournamentMatch;
  public isEditMatchModalOpened = false;

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

  get tournaments() {
    return this.$store.direct.state.tournaments.tournaments;
  }

  get tournamentEU() {
    if (!this.tournaments || this.tournaments.length == 0) {
      return null;
    }

    return this.tournaments[0];
  }

  get tournamentNA() {
    if (!this.tournaments || this.tournaments.length == 1) {
      return null;
    }

    return this.tournaments[1];
  }

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  matchSelected(match: ITournamentMatch) {
    if (this.isAdmin) {
      this.selectedMatch = match;
      this.isEditMatchModalOpened = true;
    }
  }

  closeModal() {
    this.isEditMatchModalOpened = false;
    this.selectedMatch = {} as ITournamentMatch;
  }

  async updateTournament() {
      await this.$store.direct.dispatch.tournaments.saveTournament(this.tournament as any);
  }

  async mounted() {
    await this.$store.direct.dispatch.tournaments.retrieveTournaments();
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
