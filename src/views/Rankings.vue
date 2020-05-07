<template>
  <v-container>
    <v-card class="mt-2" tile>
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
        <v-menu offset-x>
          <template v-slot:activator="{ on }">
            <v-btn tile v-on="on" style="background-color: transparent;">
              <league-icon :league="selectedLeageueOrder" />
              {{ selectedLeagueName }} {{ getDivision(selectedLeague.id) }}
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <v-list>
                <v-list-item-content>
                  <v-list-item-title>Select a league:</v-list-item-title>
                </v-list-item-content>
              </v-list>
              <v-divider></v-divider>
              <v-list dense>
                <v-list-item
                  v-for="item in ladders"
                  :key="item.id"
                  @click="setLeague(item.id)"
                >
                  <v-list-item-content>
                    <v-list-item-title>
                      <league-icon :league="item.order" />
                      {{ item.name }} {{ getDivision(item.id) }}
                    </v-list-item-title>
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
          item-text="player.name"
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
                  {{ data.item.player.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  Wins: {{ data.item.player.wins }} | Losses:
                  {{ data.item.player.losses }} | Total:
                  {{ data.item.player.games }}
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
          :mobile-breakpoint="400"
          hide-default-footer
        >
          <template v-slot:body="{ items }">
            <tbody>
              <tr
                :id="`listitem_${item.rankNumber}`"
                v-for="item in items"
                :key="item.player.id"
                :class="{
                  searchedItem: item.player.id === searchModelBattleTag
                }"
              >
                <td class="number-text">{{ item.rankNumber }}.</td>
                <td>
                  <div v-for="playerId in item.player.playerIds" :key="playerId.battleTag">
                    <player-rank-info :player-id="playerId" />
                  </div>
                </td>
                <td class="number-text text-end won">{{ item.player.wins }}</td>
                <td class="number-text text-end lost">{{ item.player.losses }}</td>
                <td class="number-text text-end">{{ item.player.games }}</td>
                <td class="number-text text-end">
                  {{ (item.player.winrate * 100).toFixed(1) }}%
                </td>
                <td class="number-text text-end">{{ item.player.mmr }}</td>
                <td class="number-text text-end">{{ item.rankingPoints }}</td>
              </tr>
            </tbody>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
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
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { Ranking, Gateways, League } from "@/store/ranking/types";
import { DataTableOptions } from "@/store/typings";
import LeagueIcon from "@/components/LeagueIcon.vue";
import PlayerMatchInfo from "@/components/PlayerMatchInfo.vue";
import PlayerRankInfo from "@/components/PlayerRankInfo.vue";

@Component({
  components: {PlayerRankInfo, PlayerMatchInfo, LeagueIcon }
})
export default class RankingsView extends Vue {
  public headers = [
    {
      text: "Rank",
      align: "start",
      sortable: false,
      width: "25px"
    },
    {
      text: "Player",
      align: "start",
      sortable: false
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
      text: "MMR",
      align: "end",
      sortable: false,
      width: "25px"
    },
    {
      text: "Rating",
      align: "end",
      sortable: false,
      width: "25px"
    }
  ];

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

  public async goToRank(rank: Ranking) {
    if (!rank) return;
    this.setLeague(rank.league);

    setTimeout(() => {
      const listItemOfPlayer = document.getElementById(
        `listitem_${rank.rankNumber}`
      );

      if (!listItemOfPlayer) return;

      const offset =
        listItemOfPlayer.offsetHeight +
        listItemOfPlayer.offsetTop +
        200 -
        window.screenTop;
      if (offset > window.innerHeight) {
        window.scrollTo({
          top: offset - window.innerHeight + 150,
          behavior: "smooth"
        });
      }

    }, 150)
  }

  public options = {
    page: 1,
    itemsPerPage: this.selectedLeagueMaxParticipantCount
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

  getDivision(division: number): string {
    if (division == 0 || division == 1) return "";

    return (((division + 4) % 6) + 1).toString();
  }

  get selectedLeague(): League {
    const league = this.$store.direct.state.rankings.league;
    const gw = this.$store.direct.state.rankings.gateway;
    const ladder = this.$store.direct.state.rankings.ladders.filter(
      l => l.gateway == gw
    )[0];
    if (!ladder) return {} as League;

    const foundLeague = ladder.leagues.filter(l => l.id == league)[0] || {};
    return foundLeague;
  }

  get selectedLeagueName(): string {
    return !this.selectedLeague?.name ? "" : this.selectedLeague?.name;
  }

  get selectedLeagueMaxParticipantCount(): number {
    return !this.selectedLeague?.maxParticipantCount
      ? 0
      : this.selectedLeague?.maxParticipantCount;
  }

  get selectedLeageueOrder(): number {
    return !this.selectedLeague?.order ? 0 : this.selectedLeague?.order;
  }

  get searchModelBattleTag() {
    if (!this.searchModel || !this.searchModel.player) {
      return "";
    }

    return this.searchModel.player.id;
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

  get ladders(): League[] {
    const gw = this.$store.direct.state.rankings.gateway;
    const league = this.$store.direct.state.rankings.ladders.filter(
      l => l.gateway === gw
    )[0];
    return league?.leagues;
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
    this.getLadders();
  }

  public getRankings(options?: DataTableOptions) {
    this.$store.direct.dispatch.rankings.retrieveRankings(options);
  }

  public getLadders() {
    this.$store.direct.dispatch.rankings.retrieveLeagueConstellation();
  }

  public setGateway(gateway: Gateways) {
    this.$store.direct.dispatch.rankings.setGateway(gateway);
    this.$store.direct.dispatch.rankings.setLeague(0);
  }

  public setLeague(league: number) {
    this.$store.direct.dispatch.rankings.setLeague(league);
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
.theme--light {
  .searchedItem {
    background-color: lightblue;
  }
}
.theme--dark {
  .searchedItem {
    background-color: #310e6f;
  }
}
</style>
