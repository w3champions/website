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
    :footer-props="{ showFirstLastPage: true }"
  >
    <template v-slot:item.id="{ item }">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <v-icon v-on="on" @click="copyId(item)">mdi-content-copy</v-icon>
        </template>
        <span>Id: {{ item.id }}</span>
      </v-tooltip>
    </template>
    <template v-slot:item.map="{ item }">
      <span>{{ $t("mapNames." + item.map) }}</span>
    </template>
    <template v-slot:item.startTime="{ item }">
      <span v-on="on">
        {{
        item.startTime | moment("MMM DD YYYY HH:mm")
        }}
      </span>
    </template>
    <template v-slot:item.duration="{ item }">
      <span>{{ getDuration(item) }}</span>
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
import { Match, DataTableOptions } from "@/store/typings";
import PlayerMatchInfo from "./PlayerMatchInfo.vue";
import moment from "moment";

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

  public options = {
    itemsPerPage: 100
  } as DataTableOptions;

  @Watch("options", { deep: true })
  public onOptionsChanged() {
    this.$emit("pageChanged", this.options.page);
  }

  public getWinner(match: Match) {
    return match.teams[0].players[0];
  }

  public getLoser(match: Match) {
    return match.teams[1].players[0];
  }

  public getDuration(match: Match) {
    if (
      !Object.prototype.hasOwnProperty.call(match, "endTime") ||
      !match.endTime
    ) {
      return "ongoing";
    }

    return moment.utc(moment.duration(match.durationInSeconds, "seconds").asMilliseconds()).format("mm:ss");
  }

  mounted() {
    this.options.itemsPerPage = this.itemsPerPage;
  }

  public copyId(item: Match) {
    navigator.clipboard.writeText(item.id.toString());
  }

  public headers = [
    {
      text: "Id",
      value: "id",
      width: "10px"
    },
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
      width: "150px"
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
