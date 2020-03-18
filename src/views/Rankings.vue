<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="12">
        <v-card>
          <v-card-title>
            Rankings
            <v-spacer></v-spacer>
            <v-autocomplete v-if="false"
              v-model="searchModel"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
              :items="searchRanks"
              :loading="isLoading"
              :search-input.sync="search"
              color="white"
              hide-no-data
              hide-selected
              item-text="name"
              item-value="name"
              placeholder="Start typing to Search"
              return-object
            ></v-autocomplete>
          </v-card-title>
          <v-card-text>
            <v-data-table
              class="elevation-1 hide-footer table-row-pointer"
              :headers="headers"
              :items="rankings"
              :options.sync="options"
              :server-items-length="totalPlayers"
              :footer-props="{
                  showFirstLastPage: true,
                }"
              @click:row="onRowClicked"
            >
              <template v-slot:item.matches="{ item }">{{ item.wins + item.losses }}</template>
              <template v-slot:item.level="{ item }">{{ Math.floor(item.level) }}</template>
              <template v-slot:item.levelProgress="{ item }">
                <v-progress-linear :value="(item.level - Math.floor(item.level)) * 100" height="15"></v-progress-linear>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3" v-if="false">
        <v-card>
          <v-card-title>Stats</v-card-title>
          <v-list class="transparent">
            <v-list-item v-for="(stat, index) in stats" :key="index">
              <v-list-item-title>{{stat.name}}</v-list-item-title>
              <v-list-item-subtitle class="text-right">{{stat.value}}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="showProfile" width="1600">
      <v-container class="w3-bg"></v-container>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { Ranking } from "../store/ranking/types";

@Component({})
export default class RankingsView extends Vue {
  public headers = [
    {
      text: "Rank",
      align: "start",
      sortable: false,
      value: "rank",
      width: "25px"
    },
    {
      text: "Player",
      align: "start",
      sortable: false,
      value: "battleTag"
    },
    {
      text: "Wins",
      align: "end",
      sortable: false,
      value: "wins",
      width: "50px"
    },
    {
      text: "Losses",
      align: "end",
      sortable: false,
      value: "losses",
      width: "50px"
    },
    {
      text: "Total",
      align: "end",
      sortable: false,
      value: "matches",
      width: "50px"
    },
    {
      text: "Level",
      align: "end",
      sortable: false,
      value: "level",
      width: "50px"
    },
    {
      text: "Progress",
      align: "end",
      sortable: false,
      value: "levelProgress",
      width: "100px"
    }
  ];
  public stats: any[] = [
    { name: "Total matches", value: 10000 },
    { name: "highest streak", value: 100 },
    { name: "best winrate", value: "Player 1" }
  ];
  public options: any = {
    itemsPerPage: 15
  };
  public selectedPlayer = "";
  public showProfile = false;
  public search = "";
  public searchModel = null;
  public isLoading = false;

  @Watch("options", { deep: true })
  public onOptionsChanged() {
    this.getRankings();
  }

  @Watch("search")
  public onSearchChanged(newValue: string) {
    newValue && newValue !== this.searchModel && this.$store.direct.dispatch.rankings.search(newValue);
  }

  @Watch("searchModel")
  public onSearchSelected(newValue: Ranking) {
    console.log(newValue);
  }

  get rankings(): Ranking[] {
    return this.$store.direct.state.rankings.rankings;
  }

  get playerUrl(): string {
    // return `http://profile.w3champions.com/#${this.selectedPlayer}`;
    return `http://profile.w3champions.com/#Pad#22587`;
  }

  get searchRanks(): Ranking[] {
    return this.$store.direct.state.rankings.searchRanks;
  }

  get totalPlayers(): number {
    return this.$store.direct.state.rankings.totalRanks;
  }

  mounted() {
    this.search = '';
    this.getRankings();
  }

  public getRankings() {
    this.$store.direct.dispatch.rankings.retrieveRankings(this.options);
  }

  public openPlayerProfile(playerName: string) {
    this.selectedPlayer = playerName;
    // this.showProfile = true;
    window.open(this.playerUrl, "_blank");
  }

  public onRowClicked(ranking: Ranking) {
    this.openPlayerProfile(ranking.battleTag);
  }
}
</script>
<style lang="scss" scoped>
.w3-bg {
  min-height: 80%;
  min-width: 80%;
  background: url("../assets/w3champions-profile-bg.png");
}
</style>