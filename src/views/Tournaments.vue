<template>
  <v-container class="tournament-page" v-if="selectedTournament.id">
    <v-card class="mt-2 filter-blur">
      <v-card-title class="search-bar">
        <v-row>
          <v-col cols="12" md="5">
            <tournament-select
              :tournaments="tournaments"
              :selectedTournament="tournament"
              @tournamentSelected="tournamentSelected"
            />
            <div>
              <a
                style="font-size: 16px"
                v-bind:href="tournament.matcherinoLink"
              >
                {{ $t("views_tournaments.tourney_donate") }}
              </a>
            </div>
          </v-col>
          <v-col cols="12" md="3">
            <div>
              <v-icon style="margin-right: 5px">mdi-calendar</v-icon>
              {{ startDate }}
            </div>
            <div>
              <v-icon style="margin-right: 5px">mdi-clock</v-icon>
              {{ startTime }}
            </div>
          </v-col>
        </v-row>
      </v-card-title>

      <div class="pl-4 filter-blur tourney-content">
        <div class="mb-2"></div>

        <div v-if="tournament">
          <tournament-match-update
            :tournamentMatch="selectedMatch"
            :isModalOpened="isEditMatchModalOpened"
            @modalClosed="closeModal"
            @saveChanges="updateTournament"
          ></tournament-match-update>
          <div style="min-width: 800px">
            <p
              class="mt-4"
              v-if="
                tournament.winnerBracketRounds && tournament.loserBracketRounds
              "
            >
              {{ $t("views_tournaments.winnersbracket") }}
            </p>
            <tournamentBracket
              @matchSelected="matchSelected"
              :bracketRounds="tournament.winnerBracketRounds"
            ></tournamentBracket>

            <p
              v-if="
                tournament.winnerBracketRounds && tournament.loserBracketRounds
              "
            >
              {{ $t("views_tournaments.losersbracket") }}
            </p>
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
import { Component } from "vue-property-decorator";
import {
  ITournamentMatch,
  ITournament,
} from "@/store/tournaments/types";


import TournamentBracket from "@/components/tournaments/TournamentBracket.vue";
import TournamentRoundConnector from "@/components/tournaments/TournamentRoundConnector.vue";
import TournamentMatchUpdate from "@/components/tournaments/TournamentMatchUpdate.vue";
import TournamentSelect from "@/components/tournaments/TournamentSelect.vue";
import moment from "moment";

@Component({
  components: {
    TournamentSelect,
    TournamentBracket,
    TournamentRoundConnector,
    TournamentMatchUpdate,
  },
})
export default class TournamentsView extends Vue {
  public selectedMatch = {} as ITournamentMatch;
  public isEditMatchModalOpened = false;

  selectedTournament? = {} as ITournament;

  get tournament() {
    return this.tournaments.find((x) => x.id == this.selectedTournament?.id);
  }

  get tournaments() {
    return this.$store.direct.state.tournaments.tournaments;
  }

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  get startDate() {
    return moment(this.selectedTournament?.startsOn).format("DD-MM-YYYY");
  }

  get startTime() {
    return moment(this.selectedTournament?.startsOn).format("HH:mm:ss");
  }

  tournamentSelected(tournament: ITournament) {
    this.selectedTournament = tournament;
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
      await this.$store.direct.dispatch.tournaments.saveTournament(this.tournament);
  }

  async mounted() {
    await this.$store.direct.dispatch.tournaments.retrieveTournaments();
    this.selectedTournament = this.tournaments[0];
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
