<template>
  <v-container>
    <v-card class="mt-2 search-bar-container" tile>
      <v-card-title class="search-bar">
        <gateway-select @gatewayChanged="onGatewayChanged" />
        <game-mode-select :gameMode="selectedGameMode" @gameModeChanged="onGameModeChanged"></game-mode-select>
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
                <v-list-item v-for="item in ladders" :key="item.id" @click="setLeague(item.id)">
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
                  <span v-if="!isDuplicateName(data.item.player.name)">{{ data.item.player.name }}</span>
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
          <v-btn tile v-on="on" class="ma-4" style="background-color: transparent;">
            <h2 class="pa-0">Season {{ selectedSeason.id }}</h2>
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
              <v-list-item v-for="item in seasons" :key="item.id" @click="selectSeason(item)">
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
              <v-list-item-subtitle class="text-right">{{ stat.value }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { Gateways, League, Ranking, Season } from "@/store/ranking/types";
import { EGameMode } from "@/store/typings";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import GameModeSelect from "@/components/common/GameModeSelect.vue";
import RankingsGrid from "@/components/ladder/RankingsGrid.vue";
import AppConstants from "../constants";

@Component({
  components: {
    LeagueIcon,
    GatewaySelect,
    GameModeSelect,
    RankingsGrid,
  },
})
export default class RankingsView extends Vue {
  public search = "";
  public searchModel = {} as Ranking;
  public isLoading = false;
  public ongoingMatchesMap: any = {};

  @Prop() public season!: number;
  @Prop() public league!: number;
  @Prop() public gateway!: Gateways;
  @Prop() public gamemode!: EGameMode;

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

  get selectedSeason() {
    return this.$store.direct.state.rankings.selectedSeason;
  }

  get seasons() {
    return this.$store.direct.state.rankings.seasons;
  }

  get selectedGameMode() {
    return this.$store.direct.state.rankings.gameMode;
  }

  get selectedLeague(): League {
    if (!this.ladders) return {} as League;

    return (
      this.ladders.filter(
        (l) => l.id == this.$store.direct.state.rankings.league
      )[0] || {}
    );
  }

  get selectedLeagueName(): string {
    return !this.selectedLeague?.name ? "" : this.selectedLeague?.name;
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
    const league = this.$store.direct.state.rankings.ladders?.filter(
      (l) =>
        l.gateway === this.$store.direct.state.gateway &&
        l.gameMode === this.$store.direct.state.rankings.gameMode &&
        l.season === this.$store.direct.state.rankings.selectedSeason.id
    )[0];
    return league?.leagues;
  }

  get searchRanks(): Ranking[] {
    return this.$store.direct.state.rankings.searchRanks;
  }

  public async onGatewayChanged() {
    this.$store.direct.commit.rankings.SET_PAGE(0);
    
    if(this.ladders && this.ladders[0]){
      await this.setLeague(this.ladders[0].id);
    }
  }

  public async onGameModeChanged(gameMode: EGameMode) {
    await this.$store.direct.dispatch.rankings.setGameMode(gameMode);
    if(this.ladders && this.ladders[0]){
      await this.setLeague(this.ladders[0].id);
    }
    

  }

  async mounted() {
    this.search = "";
    if (this.season)
      this.$store.direct.commit.rankings.SET_SELECTED_SEASON({
        id: this.season,
      });
    if (this.league) this.setLeague(this.league);
    if (this.gamemode)
      this.$store.direct.commit.rankings.SET_GAME_MODE(this.gamemode);
    if (this.gateway) this.$store.direct.commit.SET_GATEWAY(this.gateway);

    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    await this.refreshRankings();

    if (this.ladders) {
      await this.setLeague(this.ladders[0].id);
    }

    this._intervalRefreshHandle = setInterval(async () => {
      await this.refreshRankings();
    }, AppConstants.ongoingMatchesRefreshInterval);
  }

  destroyed() {
    clearInterval(this._intervalRefreshHandle);
  }

  public async refreshRankings() {
    await this.loadOngoingMatches();

    await this.getRankings();
    await this.getLadders();
  }

  public async getRankings() {
    await this.$store.direct.dispatch.rankings.retrieveRankings();
  }

  public async getLadders() {
    await this.$store.direct.dispatch.rankings.retrieveLeagueConstellation();
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
    await this.$store.direct.dispatch.rankings.setSeason(season);
    await this.$store.direct.dispatch.rankings.setLeague(0);
  }

  public async setLeague(league: number) {
    await this.$store.direct.dispatch.rankings.setLeague(league);
  }
}
</script>
<style lang="scss" scoped></style>
