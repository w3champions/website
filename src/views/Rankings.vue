<template>
  <v-container>
    <v-card class="mt-2 search-bar-container" tile>
      <v-card-title class="search-bar">
        <gate-way-select @gatewayChanged="gatewayChanged" />
        <v-menu offset-x>
          <template v-slot:activator="{ on }">
            <v-btn tile v-on="on" style="background-color: transparent;">
              <v-icon style="margin-right: 5px;">mdi-controller-classic</v-icon>
              {{ gameMode }}
            </v-btn>
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
                  <span v-if="!isDuplicateName(data.item.player.name)">
                    {{ data.item.player.name }}
                  </span>
                  <span v-if="isDuplicateName(data.item.player.name)">
                    {{
                      data.item.player.playerIds
                        .map((p) => p.battleTag)
                        .join(" & ")
                    }}
                  </span>
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
                  <v-list-item-title>Season {{ item.id }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-menu>
      <v-card-text>
        <rankings-grid
          :rankings="rankings"
          :ongoingMatches="ongoingMatchesMap"
          :selectedRank="searchModel"
        ></rankings-grid>
      </v-card-text>
    </v-card>
    <v-row>
      <v-col cols="12" md="3" v-if="false">
        <v-card tile>
          <v-card-title>Stats</v-card-title>
          <v-list class="transparent">
            <v-list-item v-for="(stat, index) in stats" :key="index">
              <v-list-item-title>{{ stat.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-right">
                {{ stat.value }}
              </v-list-item-subtitle>
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
import { League, PlayerId, Ranking, Season } from "@/store/ranking/types";
import { DataTableOptions, EGameMode, ERaceEnum } from "@/store/typings";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import GateWaySelect from "@/components/ladder/GateWaySelect.vue";
import RankingsGrid from "@/components/ladder/RankingsGrid.vue";
import AppConstants from "../constants";
import GatewaysService from "../services/GatewaysService";

@Component({
  components: {
    LeagueIcon,
    GateWaySelect,
    RankingsGrid,
  },
})
export default class RankingsView extends Vue {
  public search = "";
  public searchModel = {} as Ranking;
  public isLoading = false;
  public ongoingMatchesMap: any = {};

  private _intervalRefreshHandle: any = {};

  @Watch("searchModel")
  public onSearchModelChanged(rank: Ranking) {
    if (!rank) return;
    this.setLeague(rank.league);
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
    const gw = this.$store.direct.state.gateway;
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
    const gameMode = this.$store.direct.state.rankings.gameMode;
    const league = this.$store.direct.state.rankings.ladders.filter(
      (l) =>
        l.gateway === this.$store.direct.state.gateway &&
        l.gameMode === gameMode &&
        l.season === this.currentSeason.id
    )[0];
    return league?.leagues;
  }

  get searchRanks(): Ranking[] {
    return this.$store.direct.state.rankings.searchRanks;
  }

  gatewayChanged() {
    this.$store.direct.commit.rankings.SET_PAGE(0);
    this.$store.direct.dispatch.rankings.setLeague(0);
  }

  async mounted() {
    this.search = "";

    await this.refreshRankings();

    this._intervalRefreshHandle = setInterval(async () => {
      await this.refreshRankings();
    }, AppConstants.ongoingMatchesRefreshInterval);
  }

  destroyed() {
    clearInterval(this._intervalRefreshHandle);
  }

  public async refreshRankings() {
    await this.loadOngoingMatches();

    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    await this.getRankings();
    await this.getLadders();
  }

  public getRankings() {
    this.$store.direct.dispatch.rankings.retrieveRankings();
  }

  public getLadders() {
    this.$store.direct.dispatch.rankings.retrieveLeagueConstellation();
  }

  public async loadOngoingMatches() {
    await this.$store.direct.dispatch.matches.loadAllOngoingMatches();

    this.ongoingMatchesMap = {};
    this.$store.direct.state.matches.allOngoingMatches.forEach((x) => {
      x.teams.forEach((t) => {
        t.players.forEach((p) => {
          const playerTag = p.battleTag;
          const opponentTeams = x.teams.filter((et) => et != t);
          const opponents = opponentTeams.flatMap((ot) => {
            return ot.players.map((y) => y.battleTag);
          });

          this.ongoingMatchesMap[playerTag] = {
            players: t.players.map((y) => y.battleTag),
            opponents: opponents,
          };
        });
      });
    });
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
<style lang="scss" scoped></style>
