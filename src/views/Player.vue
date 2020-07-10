<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title class="justify-space-between">
            <div style="position-relative">
              <span>Profile of {{ profile.battleTag }}</span>
            </div>
            <div>
              <gateway-select @gatewayChanged="gatewayChanged" />
              <v-menu offset-x>
                <template v-slot:activator="{ on }">
                  <v-btn tile v-on="on" class="ma-2" style="background-color: transparent;">
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
                          <v-list-item-title>Season {{ item.id }}</v-list-item-title>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-menu>
            </div>
          </v-card-title>
          <div
            class="live-match__container"
            v-if="ongoingMatch.id"
            :class="ongoingMatchGameModeClass"
          >
            <div class="live-match__indicator">
              Live
              <span class="circle red blinker"></span>
              <span class="live-match__duration">{{ getDuration(ongoingMatch) }}'</span>
            </div>
            <div v-if="!isOngoingMatchFFA">
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
            </div>
            <div v-if="isOngoingMatchFFA" class="live-match__ffa">Playing FFA</div>
            <span class="live-match__map">{{ $t("mapNames." + ongoingMatch.map) }}</span>
          </div>
          <v-tabs v-model="tabsModel">
            <v-tabs-slider></v-tabs-slider>
            <v-tab class="profileTab" :href="`#tab-profile`">Profile</v-tab>
            <v-tab class="profileTab" :href="`#tab-matches`">Match History</v-tab>
            <v-tab class="profileTab" :href="`#tab-at-teams`">Teams</v-tab>
            <v-tab class="profileTab" :href="`#tab-statistics`">Statistics</v-tab>
            <v-tab class="profileTab" :href="`#tab-clan`">Clan</v-tab>
            <v-tabs-items v-model="tabsModel" touchless>
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
                        <v-col cols="12" md="4"  v-for="gameModeStat in topGameModeStats" :key="gameModeStat.gameMode">
                          <player-league :modeStat="gameModeStat"></player-league>
                        </v-col>
                      </v-row>
                      <v-row class="filter-none" v-if="selectedSeason.id === 0">
                        <v-card-text class="text-center">
                          This noble person was part of our beta, therefore we
                          hide his buggy stats and thank him for all eternity ;)
                        </v-card-text>
                      </v-row>
                      <v-row class="filter-none" v-if="selectedSeason.id !== 0">
                        <v-col cols="12" md="4">
                          <h4>Stats by race</h4>
                          <v-data-table
                            hide-default-footer
                            :headers="raceHeaders"
                            :items="selectedRaceStats"
                          >
                            <template v-slot:item.race="{ item }">
                              <span><race-icon v-bind:race="item.race" /></span>
                            </template>
                            <template v-slot:item.wins="{ item }">
                              <span class="number-text">
                                <span class="won">{{ item.wins }}</span>
                                -
                                <span
                                  class="lost"
                                >{{ item.losses }}</span>
                                <span style="float: right">({{ (item.winrate * 100).toFixed(1) }}%)</span>
                              </span>
                            </template>
                          </v-data-table>
                        </v-col>
                        <v-col cols="12" md="6">
                          <h4>Stats by game mode</h4>
                          <mode-stats-grid :stats="gameModeStats" />
                        </v-col>
                      </v-row>
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-card-text v-if="loadingProfile" style="min-height: 500px;" class="text-center">
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
                    <v-col cols="12" md="5">Match History</v-col>
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
                            <v-list-item-content v-text="data.item"></v-list-item-content>
                          </template>
                          <template v-else>
                            <v-list-item-content>
                              <v-list-item-title>
                                <span
                                  v-if="!isDuplicateName(data.item.player.name)"
                                >{{ data.item.player.name }}</span>
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
                    </v-col>
                    <v-col cols="12" md="2" class="pb-0">
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
                      <span
                        class="lost"
                      >Losses: {{ totalMatchesAgainstOpponent - opponentWins }}</span>
                      <span>({{ winRateVsOpponent }}%)</span>
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
                    This noble person was part of our beta, therefore we hide
                    his buggy stats and thank him for all eternity ;)
                  </v-card-text>
                </v-row>
                <v-row>
                  <v-col cols="md-3">
                    <v-card-text>
                      <v-select
                        :items="patches"
                        item-text="patchVersion"
                        item-value="patch"
                        v-model="selectedPatch"
                        @change="setSelectedPatch"
                        label="Select Patch"
                        outlined
                      />
                    </v-card-text>
                  </v-col>
                  <v-col cols="md-9">
                    <player-stats-race-versus-race-on-map
                      v-if="selectedSeason.id !== 0"
                      :stats="raceWithoutRandom"
                    />
                  </v-col>
                </v-row>
              </v-tab-item>
              <v-tab-item :value="'tab-at-teams'">
                <v-card-title>Teams</v-card-title>
                <br />
                <v-card-text>
                  <v-row>
                    <v-col
                      cols="12"
                      md="3"
                      v-for="atPartner in gameModeStatsAt"
                      :key="atPartner.id"
                    >
                      <player-league :mode-stat="atPartner" :show-at-partner="true" />
                      <br />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-tab-item>
              <v-tab-item :value="'tab-clan'">
                <clan-overview />
              </v-tab-item>
            </v-tabs-items>
          </v-tabs>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import {
  PlayerProfile,
  PlayerStatsRaceOnMapVersusRace,
  RaceWinsOnMap,
  ModeStat,
} from "@/store/player/types";
import {
  EGameMode,
  ERaceEnum,
  Match,
  PlayerInTeam,
  Team,
} from "@/store/typings";

import MatchesGrid from "../components/matches/MatchesGrid.vue";
import ModeStatsGrid from "@/components/player/ModeStatsGrid.vue";
import PlayerStatsRaceVersusRaceOnMap from "@/components/player/PlayerStatsRaceVersusRaceOnMap.vue";
import PlayerAvatar from "@/components/player/PlayerAvatar.vue";
import PlayerLeague from "@/components/player/PlayerLeague.vue";
import { Ranking, Season } from "@/store/ranking/types";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import AppConstants from "../constants";
import ClanOverview from "@/components/clans/ClanOverview.vue";
import RaceIcon from "@/components/player/RaceIcon.vue";

import * as _ from 'lodash';

@Component({
  components: {
    RaceIcon,
    ClanOverview,
    PlayerAvatar,
    PlayerLeague,
    PlayerStatsRaceVersusRaceOnMap,
    MatchesGrid,
    ModeStatsGrid,
    GatewaySelect,
    TeamMatchInfo,
  },
})
export default class PlayerView extends Vue {
  @Prop() public id!: string;

  public search = "";
  public selectedPatch = "All";
  public searchModel = {} as Ranking;
  public isLoading = false;
  public opponentWins = 0;
  public tabsModel = {}

  public raceHeaders = [
    {
      text: "Race",
      align: "start",
      sortable: false,
      value: "race",
    },
    {
      text: "Win/Loss",
      align: "start",
      sortable: false,
      value: "wins",
    },
  ];

  private _intervalRefreshHandle: any = {};
  public isLoadingMatches = false;

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

  get patches() {
    if (
      !this.playerStatsRaceVersusRaceOnMap ||
      !this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch
    ) {
      return [];
    }
    let patches = ["All"];

    Object.keys(
      this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch
    ).map((p) => patches.push(p));

    return patches;
  }

  public selectedGameModeForSearch = EGameMode.UNDEFINED;

  get raceWithoutRandom(): RaceWinsOnMap[] {
    if (
      !this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch ||
      !(
        this.selectedPatch in
        this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch
      )
    ) {
      return [];
    }

    return this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch[
      this.selectedPatch
    ].filter((r: any) => r.race !== ERaceEnum.RANDOM);
  }

  get gameModeStatsAt() {
    const atStats = this.gameModeStats.filter(
      (m) => m.gameMode === EGameMode.GM_2ON2_AT && m.rank !== 0
    );

    const atStatsUnranked = this.gameModeStats.filter(
      (m) => m.gameMode === EGameMode.GM_2ON2_AT && m.rank === 0
    );

    return [
      ...atStats.sort(
        (a, b) => a.leagueId * 1000 + a.rank - (b.leagueId * 1000 + b.rank)
      ),
      ...atStatsUnranked,
    ];
  }

  get topGameModeStats() {
    if (!this.gameModeStats) {
      return [];
    }

    const bestModesMap: { [gameMode: number] : ModeStat; } = {}

    this.gameModeStats.forEach(x => {
      const foundMode = bestModesMap[x.gameMode];

      if (foundMode) {
        // if league is better
        if (foundMode.leagueId > x.leagueId) {
          bestModesMap[x.gameMode] = x;
        }

        // if same league but rank is better
        if (foundMode.leagueId == x.leagueId && foundMode.rank > x.rank) {
          bestModesMap[x.gameMode] = x;
        }
      } else {
        bestModesMap[x.gameMode] = x;
      }
    });

    let result: ModeStat[] = [];
    for (const key in bestModesMap) {
      const gameModeStat = bestModesMap[key]
      result.push(gameModeStat);
    }

    const sortByLeagueFun = (x: ModeStat) => {
      if (x.rank === 0) {
              return 100000; // Push at the end of sorting
          }
        return x.leagueId;
    };

    const sortByRankFun = (x: ModeStat) => {
      if (x.rank === 0) {
              return 100000; // Push at the end of sorting
          }
        return x.rank;
    };

    result = _.orderBy(result, [sortByLeagueFun, sortByRankFun], ['asc', 'asc']);

    return _.take(result, 3);
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
        r.gateWay === this.$store.direct.state.gateway &&
        r.season === this.selectedSeason.id
    );
  }

  public selectSeason(season: Season) {
    this.$store.direct.commit.player.SET_SELECTED_SEASON(season);
    this.getMatches();
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

  get ongoingMatch() {
    return this.$store.direct.state.player.ongoingMatch;
  }

  get isOngoingMatchFFA() {
    return this.ongoingMatch && this.ongoingMatch.gameMode == EGameMode.GM_FFA;
  }

  get ongoingMatchGameModeClass() {
    if (!this.ongoingMatch.id) {
      return "";
    }

    switch (this.ongoingMatch.gameMode) {
      case EGameMode.GM_1ON1: {
        return "one-v-one";
      }
      case EGameMode.GM_2ON2_AT:
      case EGameMode.GM_2ON2: {
        return "two-v-two-at";
      }
      case EGameMode.GM_4ON4: {
        return "four-v-four";
      }
      case EGameMode.GM_FFA: {
        return "ffa";
      }
    }

    return "";
  }

  public setSelectedPatch(patch: string) {
    this.selectedPatch = patch;
  }

  public async getMatches(page?: number) {
    if (this.isLoadingMatches) {
      return;
    }

    this.isLoadingMatches = true;

    await this.$store.direct.dispatch.player.loadMatches({
      page: page,
      gameMode: this.selectedGameModeForSearch,
    });
    this.opponentWins = 0;
    if (this.$store.direct.state.player.opponentTag.length) {
      this.opponentWins = this.matches.filter((match: Match) =>
        match.teams.some((team: Team) => {
          const playerHasWin = team.players.some(
            (player: PlayerInTeam) =>
              player.battleTag === this.battleTag && player.won
          );

          const otherTeams = match.teams.filter((x) => x != team);

          const opponentIsOnTheOtherTeam = otherTeams.some((otherTeam) => {
            return otherTeam.players.some(
              (player: PlayerInTeam) =>
                player.battleTag === this.$store.direct.state.player.opponentTag
            );
          });

          return playerHasWin && opponentIsOnTheOtherTeam;
        })
      ).length;
    }

    this.isLoadingMatches = false;
  }

  public isDuplicateName(name: string) {
    return this.searchRanks.filter((r) => r.player.name === name).length > 1;
  }

  public setSelectedGameModeForSearch(gameMode: EGameMode) {
    this.selectedGameModeForSearch = gameMode;
    this.getMatches();
  }

  get totalMatchesAgainstOpponent() {
    const opponentTag = this.$store.direct.state.player.opponentTag;
    if (!opponentTag || !this.matches) {
      return 0;
    }

    const totalMatchesAgainstOpponent = this.matches.filter((match: Match) =>
      match.teams.some((team: Team) => {
        const playerTeamMatch = team.players.some(
          (player: PlayerInTeam) => player.battleTag === this.battleTag
        );

        const otherTeams = match.teams.filter((x) => x != team);

        const opponentIsOnTheOtherTeam = otherTeams.some((otherTeam) => {
          return otherTeam.players.some(
            (player: PlayerInTeam) =>
              player.battleTag === this.$store.direct.state.player.opponentTag
          );
        });

        return playerTeamMatch && opponentIsOnTheOtherTeam;
      })
    ).length;

    return totalMatchesAgainstOpponent;
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
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2]}`),
        modeId: EGameMode.GM_2ON2,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2_AT]}`),
        modeId: EGameMode.GM_2ON2_AT,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_4ON4]}`),
        modeId: EGameMode.GM_4ON4,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_FFA]}`),
        modeId: EGameMode.GM_FFA,
      },
    ];
  }

  public getDuration(match: Match) {
    var today = new Date();
    var diffMs =
      today.getTime() - new Date(match.startTime.toString()).getTime(); // milliseconds between now & Christmas
    var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

    return diffMins;
  }

  public getPlayerTeam(match: Match) {
    if (!match.teams) {
      return {} as Match;
    }

    return match.teams.find((team: Team) =>
      team.players.some(
        (player: PlayerInTeam) => player.battleTag === this.battleTag
      )
    );
  }

  public getOpponentTeam(match: Match) {
    if (!match.teams) {
      return {} as Match;
    }

    return match.teams.find(
      (team: Team) =>
        !team.players.some(
          (player: PlayerInTeam) => player.battleTag === this.battleTag
        )
    );
  }

  public gatewayChanged() {
    this.$store.direct.dispatch.player.reloadPlayer();
  }

  async mounted() {
    await this.init();
  }

  private async init() {
    this.$store.direct.commit.player.SET_BATTLE_TAG(this.battleTag);

    await this.$store.direct.dispatch.player.loadProfile(this.battleTag);
    this.getMatches();
    await this.$store.direct.dispatch.player.loadGameModeStats();
    await this.$store.direct.dispatch.player.loadRaceStats();
    await this.$store.direct.dispatch.player.loadPlayerStatsRaceVersusRaceOnMap(
      this.battleTag
    );

    await this.$store.direct.dispatch.player.loadOngoingPlayerMatch(
      this.battleTag
    );

    this._intervalRefreshHandle = setInterval(async () => {
      await this.$store.direct.dispatch.player.loadOngoingPlayerMatch(
        this.battleTag
      );
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
  height: 44px;

  .live-match__indicator {
    position: absolute;
    left: calc(50% - 28px);
    top: -25px;
    font-size: 13px;
  }

  .live-match__team1 {
    position: absolute;
    left: 0;
    width: 45%;
    overflow-x: hidden;
  }

  .live-match__team2 {
    position: absolute;
    right: 0;
    width: 45%;
    overflow-x: hidden;
  }

  .live-match__vstext {
    position: absolute;
    left: calc(50% - 10px);
    top: calc(50% - 20px);
  }

  .live-match__ffa {
    position: absolute;
    left: calc(50% - 41px);
  }

  .live-match__map {
    position: absolute;
    top: 28px;
    font-size: 12px;
    left: calc(50% - 60px);
    text-align: center;
    width: 120px;
  }

  .live-match__duration {
    position: absolute;
    left: 44px;
  }

  &.one-v-one {
    .live-match__map {
      top: 33px;
    }
  }
  &.two-v-two-at {
    height: 67px;
    .live-match__map {
      top: 65px;
    }
  }
  &.four-v-four {
    height: 135px;
    .live-match__map {
      top: 130px;
    }
  }
}
</style>
