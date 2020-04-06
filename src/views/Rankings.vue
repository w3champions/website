<template>
  <v-container>
    <v-row>
      <v-col cols="10" offset="1" md="10">
        <v-card tile>
          <v-card-title>
            <v-menu offset-x>
              <template v-slot:activator="{ on }">
                <v-btn tile v-on="on" style="background-color: transparent;"
                  ><v-icon style="margin-right: 5px;">mdi-earth</v-icon>Rankings
                  for Gateway: {{ gateway }}</v-btn
                >
              </template>
              <v-card>
                <v-card-text>
                  <v-list>
                    <v-list-item-content>
                      <v-list-item-title>Select a gateway:</v-list-item-title>
                    </v-list-item-content>
                  </v-list>
                  <v-divider></v-divider>
                  <v-list dense>
                    <v-list-item @click="selectEurope">
                      <v-list-item-content>
                        <v-list-item-title>Europe</v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item @click="selectAmerica">
                      <v-list-item-content>
                        <v-list-item-title>Americas</v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-menu>
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
            >
              <template v-slot:item="data">
                <template v-if="typeof data.item !== 'object'">
                  <v-list-item-content v-text="data.item"></v-list-item-content>
                </template>
                <template v-else>
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ data.item.battleTag }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Wins: {{ data.item.wins }} | Losses:
                      {{ data.item.losses }} | Total:
                      {{ data.item.wins + data.item.losses }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </template>
              </template>
            </v-autocomplete>
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
                    @click.left="openPlayerProfile(item.id)"
                    @click.middle="openProfileInNewTab(item.id)"
                    @click.right="openProfileInNewTab(item.id)"
                    v-for="item in items"
                    :key="item.name"
                    :class="{
                      searchedItem: item.id === searchModelBattleTag
                    }"
                  >
                    <td>
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <span v-on="on">{{
                            item.name
                          }}</span>
                        </template>
                        <div>{{ item.id }}</div>
                      </v-tooltip>
                    </td>
                    <td class="text-end won">{{ item.totalWins }}</td>
                    <td class="text-end lost">{{ item.totalLosses }}</td>
                    <td class="text-end">{{ item.games }}</td>
                    <td class="text-end">
                      {{ (item.winrate * 100).toFixed(1) }}%
                    </td>
                    <td class="text-end">{{ item.mmr }}</td>
                  </tr>
                </tbody>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3" v-if="false">
        <v-card tile>
          <v-card-title>Stats</v-card-title>
          <v-list class="transparent">
            <v-list-item v-for="(stat, index) in stats" :key="index">
              <v-list-item-title>{{ stat.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-right">{{
                stat.value
              }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { Ranking, Gateways } from "../store/ranking/types";
import { DataTableOptions } from "../store/typings";

@Component({
  components: {
  }
})
export default class RankingsView extends Vue {
  public headers = [
    {
      text: "Player",
      align: "start",
      sortable: false,
    },
    {
      text: "Wins",
      align: "end",
      sortable: false,
      width: "50px"
    },
    {
      text: "Losses",
      align: "end",
      sortable: false,
      width: "50px"
    },
    {
      text: "Total",
      align: "end",
      sortable: false,
      width: "50px"
    },
    {
      text: "Winrate",
      align: "end",
      sortable: false,
      width: "50px"
    },
    {
      text: "Rating",
      align: "end",
      sortable: false,
      width: "25px"
    }
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

  public options = {
    page: 1,
    itemsPerPage: 15
  } as DataTableOptions;

  @Watch("options", { deep: true })
  onOptionsChanged(options: DataTableOptions) {
    this.getRankings(options);
  }

  get gateway(): string {
    if (this.$store.direct.state.rankings.gateway === Gateways.America) {
      return "America";
    } else if (this.$store.direct.state.rankings.gateway === Gateways.Europe) {
      return "Europe";
    } else if (this.$store.direct.state.rankings.gateway === Gateways.Asia) {
      return "Asia";
    } else {
      return "unknown";
    }
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

  get searchRanks(): Ranking[] {
    return this.$store.direct.state.rankings.searchRanks;
  }

  get totalPlayers(): number {
    return this.$store.direct.state.rankings.totalRanks;
  }

  mounted() {
    this.search = "";
    this.options.page = this.$store.direct.state.rankings.page + 1;
    this.getRankings();
  }

  public getWinRate(rank: Ranking) {
    return rank.winrate * 100;
  }

  public getRankings(options?: DataTableOptions) {
    this.$store.direct.dispatch.rankings.retrieveRankings(options);
  }

  public async goToRank(rank: Ranking) {
    const isPrevSite = rank.mmr % 15 === 0 && rank.mmr > 15;
    this.options.page = Math.floor(rank.mmr / 15 + (isPrevSite ? 0 : 1));
  }

  public openPlayerProfile(playerName: string) {
    this.$router.push({
      path: this.getPlayerPath(playerName)
    });
  }

  private getPlayerPath(playerName: string) {
    const parts = playerName.split("#");

    return "/player/" + parts[0] + "/" + parts[1];
  }

  public openProfileInNewTab(playerName: string) {
    const path = this.getPlayerPath(playerName);
    window.open(path, "_blank");
  }

  public onRowClicked(ranking: Ranking) {
    this.openPlayerProfile(ranking.battleTag);
  }

  public setGateway(gateway: Gateways) {
    this.$store.direct.dispatch.rankings.setGateway(gateway);
  }

  public selectEurope() {
    this.setGateway(Gateways.Europe);
  }

  public selectAmerica() {
    this.setGateway(Gateways.America);
  }
}
</script>
<style lang="scss" scoped>
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
