<template>
  <v-container>
    <v-row>
      <v-col cols="10" offset="1" md="10">
        <v-card>
          <v-card-title>
            Rankings
            <v-spacer></v-spacer>
            <v-autocomplete
              v-model="searchModel"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              clearable
              :items="searchRanks"
              :loading="isLoading"
              :search-input.sync="search"
              :no-data-text="noDataText"
              item-text="battleTag"
              item-value="battleTag"
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
                showFirstLastPage: true
              }"
              @click:row="onRowClicked"
            >
              <template v-slot:body="{ items }">
                <tbody>
                  <tr
                    @click="openPlayerProfile(item.battleTag)"
                    v-for="item in items"
                    :key="item.name"
                    :class="{'searchedItem': item.battleTag === searchModelBattleTag}"
                  >
                    <td>{{item.rank}}</td>
                    <td>{{item.battleTag}}</td>
                    <td class="text-end">{{item.wins}}</td>
                    <td class="text-end">{{item.losses}}</td>
                    <td class="text-end">{{item.wins + item.losses}}</td>
                    <td class="text-end">{{getWinRate(item).toFixed(1)}}%</td>
                    <td>
                      <v-progress-linear
                        :value="(item.level - Math.floor(item.level)) * 100"
                        height="20"
                      >
                        <span
                          class="level"
                          v-if="item.xp > 0"
                        >XP: {{item.xp}} | Level: {{Math.floor(item.level)}}</span>
                        <span class="level" v-else>unranked</span>
                      </v-progress-linear>
                    </td>
                  </tr>
                </tbody>
              </template>
              <!--
              <template v-slot:item.matches="{ item }">
                {{
                item.wins + item.losses
                }}
              </template>
              <template v-slot:item.level="{ item }">
                {{
                Math.floor(item.level)
                }}
              </template>
              <template v-slot:item.levelProgress="{ item }">
                <v-progress-linear :value="(item.level - Math.floor(item.level)) * 100" height="15"></v-progress-linear>
              </template>
              -->
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3" v-if="false">
        <v-card>
          <v-card-title>Stats</v-card-title>
          <v-list class="transparent">
            <v-list-item v-for="(stat, index) in stats" :key="index">
              <v-list-item-title>{{ stat.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-right">
                {{
                stat.value
                }}
              </v-list-item-subtitle>
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
import { DataTableOptions } from "../store/typings";

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
      text: "Percentage",
      align: "end",
      sortable: false,
      width: "50px"
    },
    {
      text: "Level",
      align: "center",
      sortable: false,
      value: "levelProgress",
      width: "200px"
    }
  ];
  public stats = [
    { name: "Total matches", value: 10000 },
    { name: "highest streak", value: 100 },
    { name: "best winrate", value: "Player 1" }
  ];

  public selectedPlayer = "";
  public showProfile = false;
  public search = "";
  public searchModel = {} as Ranking;
  public isLoading = false;

  @Watch("searchModel")
  public onSearchModelChanged(newVal: Ranking) {
    this.goToRank(newVal);
  }

  @Watch("search")
  public onSearchChanged(newValue: string) {
    if (newValue && newValue.length > 2) {
      this.$store.direct.dispatch.rankings.search(newValue.toLowerCase());
    } else {
      this.$store.direct.dispatch.rankings.clearSearch();
    }
  }

  @Watch("searchModel")
  public onSearchSelected(newValue: Ranking) {
    return;
  }

  public options = {
    page: 1,
    itemsPerPage: 15
  } as DataTableOptions;

  @Watch("options", { deep: true })
  onOptionsChanged() {
    this.getRankings();
  }

  get searchModelBattleTag() {
    if (
      !this.searchModel ||
      this.searchModel == null ||
      !this.searchModel.battleTag
    ) {
      return "";
    }

    return this.searchModel.battleTag;
  }

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at lease 3 letters";
    }

    return "No player found";
  }

  get rankings(): Ranking[] {
    return this.$store.direct.state.rankings.rankings;
  }

  get playerUrl(): string {
    return `http://profile.w3champions.com/#${this.selectedPlayer}`;
    //return `http://profile.w3champions.com/#Pad#22587`;
  }

  get searchRanks(): Ranking[] {
    return this.$store.direct.state.rankings.searchRanks;
  }

  get totalPlayers(): number {
    return this.$store.direct.state.rankings.totalRanks;
  }

  mounted() {
    this.search = "";
    this.getRankings();
  }

  public getWinRate(rank: Ranking) {
    const winRate = (rank.wins * 100) / (rank.wins + rank.losses);

    if (isNaN(winRate)) {
      return 0;
    }

    return winRate;
  }

  public getRankings(options?: DataTableOptions) {
    this.$store.direct.dispatch.rankings.retrieveRankings(
      options || this.options
    );
  }

  private skipPageSync = false;

  public async goToRank(rank: Ranking) {
    this.options.page = Math.floor(rank.rank / 15) + 1;
  }

  public openPlayerProfile(playerName: string) {
    this.selectedPlayer = playerName;
    // this.showProfile = true;
    // window.open(this.playerUrl, "_blank");
    // this.$router.push({ name: 'Player', params: { name: playerName } });

    const parts = playerName.split("#");
    /*this.$router.push({
      name: "Player",
      params: { name: parts[0], tag: parts[1] }
    });*/

    console.log("/player/" + parts[0] + "/" + parts[1]);

    this.$router.push({
      path: "/player/" + parts[0] + "/" + parts[1]
    });
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

@keyframes highlistFade {
  from {
    background: lightblue;
  }
  to {
    background: transparent;
  }
}

.searchedItem {
  animation-name: highlistFade;
  animation-duration: 2.5s;
}
</style>
