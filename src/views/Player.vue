<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title class="justify-space-between">
            <span>Profile of {{ profile.battleTag }}</span>
            <div>
              <gate-way-select />
              <v-menu offset-x>
                <template v-slot:activator="{ on }">
                  <v-btn
                    tile
                    v-on="on"
                    class="ma-2"
                    style="background-color: transparent;"
                  >
                    <span class="pa-0">Season {{ selectedSeason.id }}</span>
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
                          <v-list-item-title>
                            Season {{ item.id }}
                          </v-list-item-title>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-menu>
            </div>
          </v-card-title>
          <div class="live-match__container" v-if="ongoingMatch.id" :class="ongoingMatchGameModeClass">
              <div class="live-match__indicator">Live <span class="circle red"></span></div>
              <div class="live-match__team1">
                  <team-match-info
                  :not-clickable="true"
                  :team="getPlayerTeam(ongoingMatch)"
                  :unfinishedMatch="true"
                  left="true"
                  ></team-match-info>
              </div>
              <div class="live-match__vstext">VS</div>
              <div class="live-match__team2">
                <team-match-info
                  :not-clickable="false"
                  :team="getOpponentTeam(ongoingMatch)"
                  :unfinishedMatch="true"
                  right="true"
                ></team-match-info>
              </div>
              <span class="live-match__map">{{$t("mapNames." + ongoingMatch.map)}}</span>
          </div>
          <v-tabs>
            <v-tabs-slider></v-tabs-slider>
            <v-tab class="profileTab" :href="`#tab-profile`">Profile</v-tab>
            <v-tab class="profileTab" :href="`#tab-matches`"
              >Match History</v-tab
            >
            <v-tab class="profileTab" :href="`#tab-statistics`"
              >Statistics</v-tab
            >
            <v-tab-item :value="'tab-profile'">
              <v-card-text v-if="!loadingProfile">
                <v-row class="mt-4 filter-none">
                  <v-col cols="12" md="4" lg="3">
                    <v-card-text style="padding-top: 0 !important;">
                      <player-avatar :is-logged-in-player="isLoggedInPlayer" />
                    </v-card-text>
                  </v-col>
                  <v-col md="12" lg="9">
                    <v-row>
                      <v-col
                        cols="12"
                        md="4"
                        v-if="gameModesByGateway && gameModesByGateway[1]"
                      >
                        <player-league
                          :modeStat="gameModesByGateway[0]"
                        ></player-league>
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                        v-if="gameModesByGateway && gameModesByGateway[1]"
                      >
                        <player-league
                          :modeStat="gameModesByGateway[1]"
                        ></player-league>
                      </v-col>
                      <v-col
                        cols="12"
                        md="4"
                        v-if="profile.gameModeStats && gameModesByGateway[2]"
                      >
                        <player-league
                          :modeStat="gameModesByGateway[2]"
                        ></player-league>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
                <v-row class="filter-none" v-if="selectedSeason.id === 0">
                  <v-card-text class="text-center">
                    This noble person was part of our beta, therefore we hide
                    his buggy stats and thank him for all eternity ;)
                  </v-card-text>
                </v-row>
                <v-row class="filter-none" v-if="selectedSeason.id != 0">
                  <v-col cols="12" md="6">
                    <h4>Stats by race</h4>
                    <v-data-table
                      hide-default-footer
                      :headers="raceHeaders"
                      :items="selectedRaceStats"
                    >
                      <template v-slot:item.race="{ item }">
                        <span>{{ $t("races." + raceEnums[item.race]) }}</span>
                      </template>
                      <template v-slot:item.wins="{ item }">
                        <span class="won number-text">{{ item.wins }}</span>
                      </template>
                      <template v-slot:item.losses="{ item }">
                        <span class="lost number-text">{{ item.losses }}</span>
                      </template>
                      <template v-slot:item.percentage="{ item }"
                        ><span class="number-text"
                          >{{ (item.winrate * 100).toFixed(1) }}%</span
                        >
                      </template>
                    </v-data-table>
                  </v-col>
                  <v-col cols="12" md="6">
                    <h4>Stats by game mode</h4>
                    <mode-stats-grid :stats="supportedGameModes" />
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-text
                v-if="loadingProfile"
                style="min-height: 500px;"
                class="text-center"
              >
                <v-progress-circular
                  style="margin-top: 180px;"
                  :size="50"
                  color="primary"
                  indeterminate
                ></v-progress-circular>
              </v-card-text>
            </v-tab-item>
            <v-tab-item :value="'tab-matches'">
              <v-card-title>
                <v-row align="center">
                  <v-col cols="12" md="5">
                    Match History
                  </v-col>
                  <v-col cols="12" md="5">
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
                      placeholder="Search an opponent"
                      return-object
                    >
                      <template v-slot:item="data">
                        <template v-if="typeof data.item !== 'object'">
                          <v-list-item-content
                            v-text="data.item"
                          ></v-list-item-content>
                        </template>
                        <template v-else>
                          <v-list-item-content>
                            <v-list-item-title>
                              <span
                                v-if="!isDuplicateName(data.item.player.name)"
                                >{{ data.item.player.name }}</span
                              >
                              <span
                                v-if="isDuplicateName(data.item.player.name)"
                                >{{
                                  data.item.player.playerIds
                                    .map((p) => p.battleTag)
                                    .join(" & ")
                                }}</span
                              >
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
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-select
                      class="over-chart-select-box"
                      :items="gameModes"
                      item-text="modeName"
                      item-value="modeId"
                      @change="setSelectedGameModeForSearch"
                      label="Mode"
                      outlined
                    />
                  </v-col>
                </v-row>
              </v-card-title>
              <v-card-text v-if="searchModel && searchModel.player">
                <v-row align="center">
                  <v-col cols="12">
                    <div>vs. {{ searchModel.player.name }}</div>
                    <span class="won">Wins: {{ opponentWins }}</span>
                    /
                    <span class="lost">
                      Losses: {{ matches.length - opponentWins }}
                    </span>
                    <span> ({{ winRateVsOpponent }}%) </span>
                  </v-col>
                </v-row>
              </v-card-text>
              <matches-grid
                v-model="matches"
                :totalMatches="totalMatches"
                @pageChanged="onPageChanged"
                :itemsPerPage="50"
                :alwaysLeftName="battleTag"
                :only-show-enemy="true"
              ></matches-grid>
            </v-tab-item>
            <v-tab-item :value="'tab-statistics'">
              <v-card-title>Statistics</v-card-title>
              <v-row class="filter-none" v-if="selectedSeason.id === 0">
                <v-card-text class="text-center">
                  This noble person was part of our beta, therefore we hide his
                  buggy stats and thank him for all eternity ;)
                </v-card-text>
              </v-row>
              <player-stats-race-versus-race-on-map
                v-if="selectedSeason.id != 0"
                :stats="raceWithoutRandom"
              />
            </v-tab-item>
          </v-tabs>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import Vue from "vue";
  import {Component, Prop, Watch} from "vue-property-decorator";
  import {ModeStat, PlayerProfile, PlayerStatsRaceOnMapVersusRace, RaceWinsOnMap,} from "@/store/player/types";
  import {EGameMode, ERaceEnum, Match, PlayerInTeam, Team,} from "@/store/typings";
  import MatchesGrid from "../components/matches/MatchesGrid.vue";
  import ModeStatsGrid from "@/components/player/ModeStatsGrid.vue";
  import PlayerStatsRaceVersusRaceOnMap from "@/components/player/PlayerStatsRaceVersusRaceOnMap.vue";
  import PlayerAvatar from "@/components/player/PlayerAvatar.vue";
  import PlayerLeague from "@/components/player/PlayerLeague.vue";
  import {Ranking, Season} from "@/store/ranking/types";
  import GateWaySelect from "@/components/ladder/GateWaySelect.vue";
  import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
  import AppConstants from "../constants";

  @Component({
  components: {
    PlayerAvatar,
    PlayerLeague,
    PlayerStatsRaceVersusRaceOnMap,
    MatchesGrid,
    ModeStatsGrid,
    GateWaySelect,
    TeamMatchInfo
  },
})
export default class PlayerView extends Vue {
  @Prop() public id!: string;

  public raceEnums = ERaceEnum;
  public search = "";
  public searchModel = {} as Ranking;
  public isLoading = false;
  public opponentWins = 0;

  public raceHeaders = [
    {
      text: "Race",
      align: "start",
      sortable: false,
      value: "race",
    },
    {
      text: "Wins",
      align: "start",
      sortable: false,
      value: "wins",
    },
    {
      text: "Losses",
      align: "start",
      sortable: false,
      value: "losses",
    },
    {
      text: "Winrate",
      align: "start",
      sortable: false,
      value: "percentage",
    },
  ];

  private _intervalRefreshHandle: any = {};

  @Watch("battleTag")
  onBattleTagChanged() {
    this.init();
  }

  @Watch("searchModel")
  public onSearchModelChanged(newVal: Ranking) {
    if (newVal) {
      this.$store.direct.commit.player.SET_OPPONENT_TAG(
        `${newVal.player.playerIds[0].battleTag}`
      );
    } else {
      this.$store.direct.commit.player.SET_OPPONENT_TAG("");
    }
    this.getMatches();
  }

  @Watch("search")
  public onSearchChanged(newValue: string) {
    if (newValue && newValue.length > 2) {
      this.$store.direct.dispatch.rankings.search({
        searchText: newValue.toLowerCase(),
        gameMode: this.selectedGameModeForSearch,
      });
    } else {
      this.$store.direct.dispatch.rankings.clearSearch();
      this.onSearchModelChanged(null as any);
    }
  }

  public selectedGameModeForSearch = EGameMode.UNDEFINED;

  get raceWithoutRandom(): RaceWinsOnMap[] {
    if (!this.playerStatsRaceVersusRaceOnMap.raceWinsOnMap) return [];
    return this.playerStatsRaceVersusRaceOnMap.raceWinsOnMap.filter(
      (r) => r.race !== ERaceEnum.RANDOM
    );
  }

  get raceStats() {
    return this.$store.direct.state.player.raceStats;
  }

  get gameModeStats() {
    return this.$store.direct.state.player.gameModeStats;
  }

  get selectedRaceStats() {
    if (!this.raceStats) {
      return [];
    }

    return this.raceStats.filter(
      (r) =>
        r.gateWay === this.selectedGateWay &&
        r.season === this.selectedSeason.id
    );
  }

  public selectSeason(season: Season) {
    this.$store.direct.commit.player.SET_SELECTED_SEASON(season);
    this.$store.direct.dispatch.player.loadGameModeStats();
    this.$store.direct.dispatch.player.loadRaceStats();
  }

  get seasons() {
    return this.$store.direct.state.player.playerProfile.participatedInSeasons;
  }

  get profile(): PlayerProfile {
    return this.$store.direct.state.player.playerProfile;
  }

  get verifiedBtag(): string {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }

  get playerStatsRaceVersusRaceOnMap(): PlayerStatsRaceOnMapVersusRace {
    return this.$store.direct.state.player.playerStatsRaceVersusRaceOnMap;
  }

  get searchRanks(): Ranking[] {
    return this.$store.direct.state.rankings.searchRanks;
  }

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at lease 3 letters";
    }

    return "No player found";
  }

  get supportedGameModes(): ModeStat[] {
    if (this.profile && this.gameModeStats) {
      return this.gameModeStats.filter(
        (g) => g.mode === EGameMode.GM_1ON1 || g.mode === EGameMode.GM_2ON2_AT
      );
    }

    return [];
  }

  get loadingProfile(): boolean {
    return this.$store.direct.state.player.loadingProfile;
  }

  get selectedSeason() {
    return this.$store.direct.state.player.selectedSeason;
  }

  get battleTag(): string {
    return this.id;
  }

  onPageChanged(page: number) {
    this.getMatches(page);
  }

  get winRateVsOpponent() {
    if (this.opponentWins == 0) {
      return 0;
    }

    return ((this.opponentWins / this.matches.length) * 100).toFixed(1);
  }

  get totalMatches(): number {
    return this.$store.direct.state.player.totalMatches;
  }

  get isLoggedInPlayer(): boolean {
    if (this.verifiedBtag === "") return false;
    return this.battleTag.startsWith(this.verifiedBtag);
  }

  get matches(): Match[] {
    return this.$store.direct.state.player.matches;
  }

  get selectedGateWay() {
    const gateway = this.$store.direct.state.rankings.gateway;
    return gateway || 20;
  }

  get ongoingMatch() {
    return this.$store.direct.state.player.ongoingMatch;
  }

  get ongoingMatchGameModeClass() {
    if (!this.ongoingMatch.id){
      return "";
    }

    switch(this.ongoingMatch.gameMode) {
      case EGameMode.GM_1ON1: {
        return "one-v-one"
      }
      case EGameMode.GM_2ON2_AT: {
        return "two-v-two-at"
      }
      case EGameMode.GM_4ON4: {
        return "four-v-four"
      }
      case EGameMode.GM_FFA: {
        return "ffa"
      }
    }

    return "";
  }

  public async getMatches(page?: number) {
    await this.$store.direct.dispatch.player.loadMatches({
      page: page,
      gameMode: this.selectedGameModeForSearch,
    });
    this.opponentWins = 0;
    if (this.$store.direct.state.player.opponentTag.length) {
      this.opponentWins = this.matches.filter((match: Match) =>
        match.teams.some((team: Team) => {
          return team.players.some(
            (player: PlayerInTeam) =>
              player.battleTag === this.battleTag && player.won
          );
        })
      ).length;
    }
  }

  public isDuplicateName(name: string) {
    return this.searchRanks.filter((r) => r.player.name === name).length > 1;
  }

  public setSelectedGameModeForSearch(gameMode: EGameMode) {
    this.selectedGameModeForSearch = gameMode;
    this.getMatches();
  }

  get gameModes() {
    return [
      {
        modeName: "All",
        modeId: EGameMode.UNDEFINED,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_1ON1]}`),
        modeId: EGameMode.GM_1ON1,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2_AT]}`),
        modeId: EGameMode.GM_2ON2_AT,
      },
      // {
      //   modeName: "4vs4",
      //   modeId: EGameMode.GM_4ON4
      // },
      // {
      //   modeName: "FFA",
      //   modeId: EGameMode.GM_FFA
      // }
    ];
  }

  public getPlayerTeam(match: Match) {
    if(!match.teams) {
      return {} as Match;
    }

    return match.teams.find((team: Team) =>
      team.players.some(
        (player: PlayerInTeam) => player.battleTag === this.battleTag
      )
    );
  }

  public getOpponentTeam(match: Match) {
    if(!match.teams) {
      return {} as Match;
    }

    return match.teams.find(
      (team: Team) =>
        !team.players.some(
          (player: PlayerInTeam) => player.battleTag === this.battleTag
        )
    );
  }

  async mounted() {
    await this.init();
  }

  private async init() {
    this.$store.direct.commit.player.SET_BATTLE_TAG(this.battleTag);
    this.getMatches();

    await this.$store.direct.dispatch.player.loadProfile(this.battleTag);
    await this.$store.direct.dispatch.player.loadGameModeStats();
    await this.$store.direct.dispatch.player.loadRaceStats();
    await this.$store.direct.dispatch.player.loadPlayerStatsRaceVersusRaceOnMap(
      this.battleTag
    );

    await this.$store.direct.dispatch.player.loadOngoingPlayerMatch(this.battleTag);

    this._intervalRefreshHandle = setInterval(async ()=> {
      await this.$store.direct.dispatch.player.loadOngoingPlayerMatch(this.battleTag);
    }, AppConstants.ongoingMatchesRefreshInterval);

    window.scrollTo(0, 0);
  }

  destroyed() {
    this.$store.direct.commit.player.SET_ONGOING_MATCH({} as Match);
    clearInterval(this._intervalRefreshHandle);
  }
}
</script>

<style lang="scss" scoped>
.profileTab {
  background-color: #f5f5f5;
}

.theme--dark {
  .profileTab {
    background-color: #2f2f2f;
  }
}

.playerTag {
  margin-left: 10px;
  text-transform: none;
}

.live-match__container {
    position: relative;
    max-width: 500px;
    margin: 0 auto;
    height: 40px;

    .live-match__indicator {
      position: absolute;
      left: calc(50% - 13px);
      top: -25px;
      font-size: 13px;
    }

    .live-match__team1 {
      position: absolute;
      left: 0;
      width:45%;
      overflow-x: hidden;
    }

    .live-match__team2 {
      position: absolute;
      right: 0;
      width:45%;
      overflow-x: hidden;
    }

    .live-match__vstext {
      position: absolute;
      left: calc(50% - 10px);
      top: calc(50% - 20px);
    }

    .live-match__map {
      position: absolute;
      top: 28px;
      font-size: 12px;
      left: calc(50% - 60px);
      text-align: center; width:120px
    }

    &.one-v-one {
      .live-match__map {
        top: 28px;
      }
    }
    &.two-v-two-at {
      height: 60px;
      .live-match__map {
        top: 50px;
      }
    }
}
</style>
