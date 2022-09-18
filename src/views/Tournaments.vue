<template>
  <v-container>
    <v-card class="mt-2">
      <v-card-title>
        Tournaments
      </v-card-title>
      <div class="pl-4">
        <v-data-table
        :headers="headers"
        :items="tournaments"
        :items-per-page="10"
        :item-class="itemClass"
        :server-items-length="3"
        class="elevation-1"
        @click:row="onRowClick"
      >
        <template #[`item.startDateTime`]>
          Date
        </template>
        <template #[`item.state`]>
          Name
        </template>
        <template #[`item.playerCount`]="{ item }">
          {{item.players.length}}
        </template>
        <template #[`item.winner`]="{ item }">
          {{item.winner.battleTag}}
        </template>
      </v-data-table>
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { ITournament } from "@/store/tournaments/types";
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { getTournamentUrl } from "@/helpers/url-functions";

@Component
export default class TournamentsView extends Vue {
  get headers() {
    return [
      {
        text: "Tournament Name",
        align: "start",
        value: "name",
      },
      {
        text: "Date / Time",
        align: "start",
        value: "startDateTime",
      },
      {
        text: "Status",
        align: "start",
        value: "state",
      },
      {
        text: "Player Count",
        value: "playerCount",
      },
      {
        text: "Winner",
        value: "winner",
      },
    ];
  }

  get tournaments() {
    console.log(this.$store.direct.state.tournaments.tournaments);
    return this.$store.direct.state.tournaments.tournaments;
  }

  public onRowClick(item: ITournament) {
    this.$router.push({
      path: getTournamentUrl(item.id),
    });
  }

  public itemClass(item: ITournament) {
    return 'tournament-row';
  }
}
</script>

<style lang="scss">
  .tournament-row {
    cursor: pointer;
  }
</style>
