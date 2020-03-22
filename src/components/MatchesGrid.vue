<template>
  <v-data-table
    dense
    class="hide-footer"
    :options.sync="options"
    :server-items-length="totalMatches"
    :headers="headers"
    :items="matches"
    item-key="id"
    no-data-text="no matches found"
    :footer-props="{showFirstLastPage: true}"
  >
    <template v-slot:item.map="{ item }">
      <span>{{ $t("mapNames." + mapName(item)) }}</span>
    </template>
    <template v-slot:item.startTime="{ item }">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <span v-on="on">{{ item.startTime | moment("MMM DD YYYY HH:mm") }}</span>
        </template>
        <span>Id: {{ item.id }}</span>
      </v-tooltip>
    </template>
    <template v-slot:item.duration="{ item }">
      <span>{{getDuration(item)}}</span>
    </template>
    <template v-slot:item.players="{ item }">
      <v-row>
        <v-col cols="5">
          <player-match-info :player="getWinner(item)" left="true"></player-match-info>
        </v-col>
        <v-col cols="2">VS</v-col>
        <v-col colsß="5">
          <player-match-info :player="getLoser(item)"></player-match-info>
        </v-col>
      </v-row>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { Match } from "../store/typings";
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

  mapName(item: any) {
    const meinString = item.map
      .substr(item.map.lastIndexOf("/") + 1)
      .replace(".w3x", "")
      .replace("(2)", "")
      .replace("(4)", "")
      .replace("_lv", "");
    return meinString;
  }

  @Watch("options", { deep: true })
  public onOptionsChanged() {
    this.$emit("pageChanged", this.options.page);
  }

  public getWinner(match: Match) {
    if (this.alwaysLeftName) {
      const players = match.players.filter(
        x => x.battleTag.toLowerCase() === this.alwaysLeftName.toLowerCase()
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
        x => x.battleTag.toLowerCase() !== this.alwaysLeftName.toLowerCase()
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

  public getDuration(match: Match) {
    if (
      !Object.prototype.hasOwnProperty.call(match, "endTime") ||
      !match.endTime
    ) {
      return "ongoing";
    }

    let duration = "";
    let delta = Math.abs(match.startTime - match.endTime) / 1000;

    const days = Math.floor(delta / 86400);
    delta -= days * 86400;

    const hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    if (hours) {
      duration += `${hours}h `;
    }

    const minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    if (minutes) {
      duration += `${minutes}m `;
    }

    const seconds = delta % 60;
    if (seconds) {
      duration += `${Math.floor(seconds)}s`;
    }

    return duration;
  }

  mounted() {
    this.options.itemsPerPage = this.itemsPerPage;
  }

  public headers = [
    {
      text: "Players",
      align: "center",
      sortable: false,
      value: "players",
      width: "600px"
    },
    {
      text: "Map",
      align: "start",
      sortable: false,
      value: "map"
    },
    {
      text: "Start Time",
      align: "end",
      sortable: false,
      value: "startTime",
      width: "220px"
    },
    {
      text: "Duration",
      align: "center",
      sortable: false,
      value: "duration",
      width: "150px"
    }
  ];
}
</script>

<style lang="scss" scoped>
.playerCol {
  max-width: 500px;
}
</style>
