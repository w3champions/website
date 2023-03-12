<template>
  <v-container>
    <v-card class="mt-2 pb-2 pr-4">
      <v-card-title>Tournaments</v-card-title>
      <v-card-text>
        <div class="mb-4">
          <h3>Upcoming</h3>
          <tournaments-table :tournaments="upcomingTournaments" @click:row="onRowClick" />
        </div>
        <div>
          <h3>Past</h3>
          <tournaments-table :tournaments="tournaments" @click:row="onRowClick" />
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import _ from "lodash";
import { isFuture } from "date-fns";
import TournamentsTable from "@/components/tournaments/TournamentsTable.vue";
import { ITournament } from "@/store/tournaments/types";
import { Component } from "vue-property-decorator";
import { getTournamentUrl } from "@/helpers/url-functions";
import { ETournamentState } from "@/store/tournaments/types";

@Component({ components: { TournamentsTable } })
export default class TournamentsView extends Vue {
  async mounted() {
    await this.$store.direct.dispatch.tournaments.retrieveTournaments();
  }

  get tournaments() {
    return this.$store.direct.state.tournaments.tournaments;
  }

  get upcomingTournaments() {
    return this.tournaments.filter((tournament) => (
      [ETournamentState.INIT, ETournamentState.REGISTRATION].includes(tournament.state)
      && isFuture(tournament.startDateTime)
    ));
  }

  get pastTournaments() {
    return _.difference(this.tournaments, this.upcomingTournaments);
  }

  public onRowClick(item: ITournament) {
    this.$router.push({
      path: getTournamentUrl(item.id),
    });
  }
}
</script>
