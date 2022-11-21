<template>
  <v-data-table
    :headers="headers"
    :items="tournaments"
    :disable-pagination="true"
    :items-per-page="-1"
    :item-class="itemClass"
    class="elevation-1"
    @click:row="onRowClick"
    :hide-default-footer="true"
  >
    <template #[`item.startDateTime`]="{ item }">
      {{formatDate(item)}}
    </template>
    <template #[`item.state`]="{ item }">
      {{getStateDescription(item)}}
    </template>
    <template #[`item.playerCount`]="{ item }">
      {{item.players.length}}
    </template>
    <template #[`item.winner`]="{ item }">
      {{item.winner ? item.winner.battleTag : "-"}}
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { ITournament } from "@/store/tournaments/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { format } from "date-fns";
import { TournamentStateLabel } from "@/helpers/tournaments"

@Component
export default class TournamentsTable extends Vue {
  @Prop() tournaments!: ITournament[];

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

  public onRowClick(item: ITournament) {
    this.$emit('click:row', item);
  }

  public formatDate(tournament: ITournament) {
    return format(tournament.startDateTime, 'yyyy-MM-dd p');
  }

  public getStateDescription(tournament: ITournament) {
    return TournamentStateLabel[tournament.state];
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
