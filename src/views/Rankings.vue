<template>
  <v-container>
    <v-card class="mt-2 search-bar-container" tile>
      <v-card-title class="search-bar">
        <gate-way-select />
        <v-menu offset-x>
          <template v-slot:activator="{ on }">
            <v-btn tile v-on="on" style="background-color: transparent;"
              ><v-icon style="margin-right: 5px;">mdi-controller-classic</v-icon
              >{{ gameMode }}</v-btn
            >
          </template>
          <v-card>
            <v-card-text>
              <v-list>
                <v-list-item-content>
                  <v-list-item-title>Select a gamemode:</v-list-item-title>
                </v-list-item-content>
              </v-list>
              <v-divider></v-divider>
              <v-list dense>
                <v-list-item
                  v-for="mode in gameModes"
                  :key="mode.gameMode"
                  @click="selectGameMode(mode.gameMode)"
                >
                  <v-list-item-content>
                    <v-list-item-title>{{ mode.modeName }}</v-list-item-title>
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
              {{ selectedLeagueName }}
              {{
                selectedLeague.division !== 0 ? selectedLeague.division : null
              }}
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
                      {{ item.name }}
                      {{ item.division !== 0 ? item.division : null }}
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
          item-value="player.id"
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
                  <span v-if="!isDuplicateName(data.item.player.name)">{{
                    data.item.player.name
                  }}</span>
                  <span v-if="isDuplicateName(data.item.player.name)">{{
                    data.item.player.playerIds
                      .map((p) => p.battleTag)
                      .join(" & ")
                  }}</span>
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
      <v-menu offset-x>
        <template v-slot:activator="{ on }">
          <v-btn
            tile
            v-on="on"
            class="ma-4"
            style="background-color: transparent;"
          >
            <h2 class="pa-0">Season {{ currentSeason.id }}</h2>
            <v-icon class="ml-4">mdi-chevron-right</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-card-text>
            <v-list>
              <v-list-item-content>
                <v-list-item-title>Previous seasons:</v-list-item-title>
              </v-list-item-content>
            </v-list>
            <v-list dense>
              <v-list-item
                v-for="item in seasons"
                :key="item.id"
                @click="selectSeason(item)"
              >
                <v-list-item-content>
                  <v-list-item-title> Season {{ item.id }} </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-menu>
      <v-card-text>
        <div class="custom-table-wrapper elevation-1">
          <table class="custom-table">
            <thead>
              <tr>
                <td
                  v-for="header in headers"
                  :key="header.text"
                  v-bind:style="{ width: header.width }"
                >
                  {{ header.text }}
                </td>
              </tr>
            </thead>
            <tbody>
              <tr
                :id="`listitem_${item.rankNumber}`"
                v-for="item in rankings"
                :key="item.player.id"
                :class="{
                  searchedItem: item.player.id === searchModelBattleTag,
                }"
              >
                <td class="number-text">{{ item.rankNumber }}.</td>
                <td>
                  <span
                    v-for="playerId in item.player.playerIds"
                    :key="playerId.battleTag"
                  >
                    <player-rank-info :player-id="playerId" />
                    <span
                      v-if="
                        item.player.playerIds.indexOf(playerId) !==
                        item.player.playerIds.length - 1
                      "
                    >
                      &
                    </span>
                  </span>
                  <span style="position:relative" v-if="isCurrentlyLive(item.player.playerIds)">
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <span
                            style="display: inline;"
                            class="pointer"
                            v-on="on"
                          >
                              <div class="circle red filter-blur"></div>
                          </span>
                        </template>
                        <div>
                          Now playing
                        </div>
                      </v-tooltip>
                  </span>
                </td>
                <td class="number-text text-end won">{{ item.player.wins }}</td>
                <td class="number-text text-end lost">
                  {{ item.player.losses }}
                </td>
                <td class="number-text text-end">{{ item.player.games }}</td>
                <td class="number-text text-end">
                  {{ (item.player.winrate * 100).toFixed(1) }}%
                </td>
                <td class="number-text text-end">{{ item.player.mmr }}</td>
                <td class="number-text text-end">{{ item.rankingPoints }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>
    </v-card>
    <v-row>
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
import { League, Ranking, Season, PlayerId } from "@/store/ranking/types";
import { DataTableOptions, EGameMode } from "@/store/typings";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import PlayerMatchInfo from "@/components/matches/PlayerMatchInfo.vue";
import PlayerRankInfo from "@/components/ladder/PlayerRankInfo.vue";
import GateWaySelect from "@/components/ladder/GateWaySelect.vue";

@Component({
  components: { PlayerRankInfo, PlayerMatchInfo, LeagueIcon, GateWaySelect },
})
export default class RankingsView extends Vue {
  public headers = [
    {
      text: "Rank",
      align: "start",
      sortable: false,
      width: "25px",
    },
    {
      text: "Player",
      align: "start",
      sortable: false,
    },
    {
      text: "Wins",
      align: "end",
      sortable: false,
      width: "50px",
    },
    {
      text: "Losses",
      align: "end",
      sortable: false,
      width: "50px",
    },
    {
      text: "Total",
      align: "end",
      sortable: false,
      width: "50px",
    },
    {
      text: "Winrate",
      align: "end",
      sortable: false,
      width: "50px",
    },
    {
      text: "MMR",
      align: "end",
      sortable: false,
      width: "25px",
    },
    {
      text: "RP",
      align: "end",
      sortable: false,
      width: "25px",
    },
  ];

  public search = "";
  public searchModel = {} as Ranking;
  public isLoading = false;
  private _ongoingMatchesMap: any = {};

  @Watch("searchModel")
  public onSearchModelChanged(newVal: Ranking) {
    this.goToRank(newVal);
  }

  @Watch("search")
  public onSearchChanged(newValue: string) {
    if (newValue && newValue.length > 2) {
      this.$store.direct.dispatch.rankings.search({
        searchText: newValue.toLowerCase(),
        gameMode: this.selectedGameMode,
      });
    } else {
      this.$store.direct.dispatch.rankings.clearSearch();
    }
  }

  public isDuplicateName(name: string) {
    return this.searchRanks.filter((r) => r.player.name === name).length > 1;
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
          behavior: "smooth",
        });
      }
    }, 200);
  }

  public options = {
    page: 1,
    itemsPerPage: this.selectedLeagueMaxParticipantCount,
  } as DataTableOptions;

  @Watch("options", { deep: true })
  onOptionsChanged(options: DataTableOptions) {
    this.getRankings(options);
  }

  get currentSeason() {
    return this.$store.direct.state.rankings.selectedSeason;
  }

  get seasons() {
    return this.$store.direct.state.rankings.seasons;
  }

  get gameMode() {
    const gameMode = this.$store.direct.state.rankings.gameMode;
    return this.gameModes.filter((g) => g.gameMode == gameMode)[0].modeName;
  }

  get selectedGameMode() {
    return this.$store.direct.state.rankings.gameMode;
  }

  get selectedLeague(): League {
    const league = this.$store.direct.state.rankings.league;
    const gw = this.$store.direct.state.rankings.gateway;
    const gameMode = this.$store.direct.state.rankings.gameMode;
    const season = this.$store.direct.state.rankings.selectedSeason;
    const ladder = this.$store.direct.state.rankings.ladders.filter(
      (l) =>
        l.gateway == gw && l.gameMode === gameMode && l.season === season.id
    )[0];
    if (!ladder) return {} as League;

    return ladder.leagues.filter((l) => l.id == league)[0] || {};
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
    const gateway = this.$store.direct.state.rankings.gateway;
    const gameMode = this.$store.direct.state.rankings.gameMode;
    const league = this.$store.direct.state.rankings.ladders.filter(
      (l) =>
        l.gateway === gateway &&
        l.gameMode === gameMode &&
        l.season === this.currentSeason.id
    )[0];
    return league?.leagues;
  }

  get searchRanks(): Ranking[] {
    return this.$store.direct.state.rankings.searchRanks;
  }

  async mounted() {
    this.search = "";
    this.options.page = this.$store.direct.state.rankings.page + 1;

    await this.$store.direct.dispatch.matches.loadAllOngoingMatches();

    this._ongoingMatchesMap = {};
    this.$store.direct.state.matches.allOngoingMatches.forEach(x => {
      x.teams.forEach(t => {
        t.players.forEach(p => {
          const playerTag = p.battleTag;
          this._ongoingMatchesMap[playerTag] = t.players.map(y => y.battleTag);
        });
      });
      
    });

    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    await this.getRankings();
    await this.getLadders();
  }

  public getRankings(options?: DataTableOptions) {
    this.$store.direct.dispatch.rankings.retrieveRankings(options);
  }

  public getLadders() {
    this.$store.direct.dispatch.rankings.retrieveLeagueConstellation();
  }

  public async selectSeason(season: Season) {
    this.$store.direct.dispatch.rankings.setSeason(season);
  }

  public setLeague(league: number) {
    this.$store.direct.dispatch.rankings.setLeague(league);
  }

  public selectGameMode(gameMode: EGameMode) {
    this.$store.direct.dispatch.rankings.setGameMode(gameMode);
    this.$store.direct.dispatch.rankings.setLeague(0);
  }

  public isCurrentlyLive(playerIds: PlayerId[]) {
    if (!this._ongoingMatchesMap) {
      return false;
    }

    const firstPlayer = playerIds[0].battleTag;
    const foundByFirstPlayer = this._ongoingMatchesMap[firstPlayer] as string[];
    if (foundByFirstPlayer) {

      let allMatch = true;
      playerIds.forEach(p => {
        allMatch = allMatch && foundByFirstPlayer.includes(p.battleTag);
      });

      return allMatch;
    }

    return false;
  }

  get gameModes() {
    return [
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_1ON1]}`),
        gameMode: EGameMode.GM_1ON1,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2_AT]}`),
        gameMode: EGameMode.GM_2ON2_AT,
      },
    ];
  }
}
</script>
<style lang="scss" scoped>
.theme--light {
  tr.searchedItem,
  tr.searchedItem:hover {
    background-color: lightblue !important;
  }
}
.theme--dark {
  tr.searchedItem,
  tr.searchedItem:hover {
    background-color: #310e6f !important;
  }
}

.red {
  left: 10px;
}
</style>
