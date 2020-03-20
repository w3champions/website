<template>
  <v-data-table
    dense
    class="hide-footer"
    :options.sync="options"
    :server-items-length="totalMatches"
    :headers="headers"
    :items="matches"
    no-data-text="no matches found"
    :footer-props="{showFirstLastPage: true}"
  >
    <template v-slot:item.map="{ item }">
      <span>{{ item.map.substr(item.map.lastIndexOf('/') + 1).replace('.w3x', '') }}</span>
    </template>
    <template v-slot:item.startTime="{ item }">
      <span>{{ item.startTime | moment("MMM DD YYYY HH:mm:ss") }}</span>
    </template>
    <template v-slot:item.endTime="{ item }">
      <span v-if="item.endTime">item.endTime - item.startTime</span>
      <span
        v-else-if="!item.endTime && Object.prototype.hasOwnProperty.call(item.players[0], 'won')"
      >completed</span>
      <span v-else>ongoing</span>
    </template>
    <template v-slot:item.players="{ item }">
      <v-row>
        <v-col cols="5.5">
          <player-match-info :player="getWinner(item)" left="true"></player-match-info>
        </v-col>
        <v-col cols="1">VS</v-col>
        <v-col cols="5.5">
          <player-match-info :player="getLoser(item)"></player-match-info>
        </v-col>
      </v-row>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { Match, ERaceEnum } from "../store/typings";
import PlayerMatchInfo from "./PlayerMatchInfo.vue";

@Component({
  components: {
    PlayerMatchInfo
  }
})
export default class MatchesGrid extends Vue {
  @Prop() public value!: Match[];
  @Prop() public totalMatches!: number;
  @Prop() public itemsPerPage!: number;
  @Prop() public alwaysLeftName!: string;

  get matches(): Match[] {
    return this.value;
  }

  public options: any = {
    itemsPerPage: 100
  };

  @Watch("options", { deep: true })
  public onOptionsChanged() {
    this.$emit("pageChanged", this.options.page);
  }

  public getWinner(match: Match) {
    if (this.alwaysLeftName) {
      const players = match.players.filter(
        x => x.battleTag === this.alwaysLeftName
      );

      if (players && players.length > 0) {
        return players[0];
      }
    }

    const winner = match.players.filter(x => x.won === true);

    if (winner && winner.length > 0) {
      return winner[0];
    }

    return match.players[0];
  }

  public getLoser(match: Match) {
    if (this.alwaysLeftName) {
      const players = match.players.filter(
        x => x.battleTag !== this.alwaysLeftName
      );

      if (players && players.length > 0) {
        return players[0];
      }
    }

    const loser = match.players.filter(x => x.won === false);

    if (loser && loser.length > 0) {
      return loser[0];
    }

    return match.players[1];
  }

  mounted() {
    this.options.itemsPerPage = this.itemsPerPage;
  }

  public headers = [
    {
      text: "Id",
      align: "start",
      sortable: false,
      value: "id",
      width: "100px"
    },
    {
      text: "Map",
      align: "start",
      sortable: false,
      value: "map"
    },
    {
      text: "Host",
      align: "start",
      sortable: false,
      value: "host"
    },
    {
      text: "Start Time",
      align: "start",
      sortable: false,
      value: "startTime",
      width: "115px"
    },
    {
      text: "Duration",
      align: "start",
      sortable: false,
      value: "endTime"
    },
    {
      text: "Players",
      align: "center",
      sortable: false,
      value: "players",
      width: "500px"
    }
  ];
}
</script>

<style lang="scss" scoped>
.playerCol {
  max-width: 500px;
}
</style>