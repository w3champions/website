<template>
  <v-data-table
    :headers="headers"
    :items="tournaments"
    :disable-pagination="true"
    :items-per-page="-1"
    :item-style="itemStyle"
    class="elevation-1"
    @click:row="onRowClick"
    :hide-default-footer="true"
  >
    <template #[`item.startDateTime`]="{ item }">
      {{ formatDate(item) }}
    </template>
    <template #[`item.state`]="{ item }">
      {{ getStateDescription(item) }}
    </template>
    <template #[`item.playerCount`]="{ item }">
      {{ item.players.length }}
    </template>
    <template #[`item.winner`]="{ item }">
      {{ item.winner ? item.winner.battleTag : "-" }}
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { defineComponent, StyleValue } from "vue";
import { ITournament } from "@/store/tournaments/types";
import { TournamentStateLabel } from "@/helpers/tournaments";
import { formatDateToDateWeekday } from "@/helpers/date-functions";

interface TournamentsTableHeader {
  text: string;
  value: string;
}

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

    const headers: TournamentsTableHeader[] = [
      {
        text: "Tournament Name",
        value: "name",
      },
      {
        text: "Date / Time",
        value: "startDateTime",
      },
      {
        text: "Status",
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
