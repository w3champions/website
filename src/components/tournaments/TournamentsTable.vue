<template>
  <v-data-table
    class="elevation-1"
    :headers="headers"
    :items="tournaments"
    :disable-pagination="true"
    :items-per-page="-1"
    :row-props="itemStyle"
    :hide-default-footer="true"
    :header-props="{
      class: 'font-weight-bold',
    }"
    @click:row="onRowClick"
  >
    <template v-slot:[`item.startDateTime`]="{ item }">
      {{ formatDate(item) }}
    </template>
    <template v-slot:[`item.state`]="{ item }">
      {{ getStateDescription(item) }}
    </template>
    <template v-slot:[`item.playerCount`]="{ item }">
      {{ item.players.length }}
    </template>
    <template v-slot:[`item.winner`]="{ item }">
      {{ item.winner ? item.winner.battleTag : "-" }}
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { defineComponent, StyleValue } from "vue";
import { ITournament } from "@/store/tournaments/types";
import { TournamentStateLabel } from "@/helpers/tournaments";
import { formatDateToDateWeekday } from "@/helpers/date-functions";
import { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "TournamentsTable",
  components: {},
  props: {
    tournaments: {
      type: Array<ITournament>,
      required: true,
    },
  },
  setup(_props, context) {
    const formatDate = (tournament: ITournament): string => formatDateToDateWeekday(tournament.startDateTime);
    const getStateDescription = (tournament: ITournament): string => TournamentStateLabel[tournament.state];

    function onRowClick(item: ITournament) {
      context.emit("click:row", item);
    }

    const itemStyle = (): StyleValue => {
      return {
        cursor: "pointer",
      };
    };

    const headers: DataTableHeader[] = [
            {
        title: "Tournament Name",
        value: "name",
        sortable: true,
      },
      {
        title: "Date / Time",
        value: "startDateTime",
        sortable: true,
      },
      {
        title: "Status",
        value: "state",
        sortable: true,
      },
      {
        title: "Player Count",
        value: "playerCount",
        sortable: true,
      },
      {
        title: "Winner",
        value: "winner",
        sortable: true,
      },
    ];

    return {
      formatDate,
      getStateDescription,
      onRowClick,
      itemStyle,
      headers,
    };
  },
});
</script>

<style lang="scss" scoped>
.tournament-row {
  cursor: pointer;
}
</style>
