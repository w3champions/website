<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            Profile of {{ profile.battleTag }}
          </v-card-title>
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
                <v-row class="mt-4">
                  <v-col cols="12" md="4" lg="3">
                    <v-card-text style="padding-top: 0 !important;">
                      <player-avatar
                        :wins="this.playerWins"
                        :modeStats="gameModesByGateway"
                        :is-logged-in-player="isLoggedInPlayer"
                      />
                    </v-card-text>
                  </v-col>
                  <v-col md="12" lg="9">
                    <v-row>
                      <v-col cols="12" md="4" v-if="gameModesByGateway && gameModesByGateway[0]">
                        <player-league :modeStat="gameModesByGateway[0]"></player-league>
                      </v-col>
                      <v-col cols="12" md="4" v-if="gameModesByGateway && gameModesByGateway[1]">
                        <player-league :modeStat="gameModesByGateway[1]"></player-league>
                      </v-col>
                      <v-col cols="12" md="4" v-if="profile.gameModeStats && gameModesByGateway[2]">
                        <player-league :modeStat="gameModesByGateway[2]"></player-league>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              <v-row>
                <v-col cols="12" md="6">
                  <h4>Stats by race</h4>
                  <v-data-table
                      hide-default-footer
                      :headers="raceHeaders"
                      :items="profile.raceStats"
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
                        ><span class="number-text">{{ (item.winrate * 100).toFixed(1) }}%</span>
                      </template
                      >
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
                style="min-height: 500px"
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
                  Match History
                  <v-spacer />
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
                </v-row>
              </v-card-title>
              <v-card-text v-if="searchModel && searchModel.player">
                <v-row align="center">
                  <v-col cols="12">
                    <span class="won">Wins: {{ opponentWins }}</span>
                    /
                    <span class="lost">
                      Losses: {{ matches.length - opponentWins }}
                    </span>
                    /
                    <span>
                      Winrate: {{((opponentWins / matches.length) * 100).toFixed(1) }}%
                      VS
                      {{
                        searchModel.player.name
                      }}
                    </span>
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
              <player-stats-race-versus-race-on-map
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
import { Component, Prop, Watch } from "vue-property-decorator";
import {
  ModeStat,
  PlayerProfile,
  PlayerStatsRaceOnMapVersusRace,
  RaceWinsOnMap
} from "@/store/player/types";
import {
  EGameMode,
  ERaceEnum,
  Match,
  Team,
  PlayerInTeam
} from "@/store/typings";
import MatchesGrid from "../components/MatchesGrid.vue";
import ModeStatsGrid from "@/components/ModeStatsGrid.vue";
import PlayerStatsRaceVersusRaceOnMap from "@/components/PlayerStatsRaceVersusRaceOnMap.vue";
import PlayerAvatar from "@/components/PlayerAvatar.vue";
import PlayerLeague from "@/components/PlayerLeague.vue";
import { Ranking } from "@/store/ranking/types";

@Component({
  components: {
    PlayerAvatar,
    PlayerLeague,
    PlayerStatsRaceVersusRaceOnMap,
    MatchesGrid,
    ModeStatsGrid
  }
})
export default class PlayerView extends Vue {
  @Prop() public id!: string;

  public raceEnums = ERaceEnum;
  public search = "";
  public searchModel = {} as Ranking;
  public isLoading = false;
  public opponentWins = 0;
  public selectedGateWay = 20;

  public raceHeaders = [
    {
      text: "Race",
      align: "start",
      sortable: false,
      value: "race"
    },
    {
      text: "Wins",
      align: "start",
      sortable: false,
      value: "wins"
    },
    {
      text: "Losses",
      align: "start",
      sortable: false,
      value: "losses"
    },
    {
      text: "Winrate",
      align: "start",
      sortable: false,
      value: "percentage"
    }
  ];

  @Watch("battleTag")
  onBattleTagChanged() {
    this.init();
  }

  @Watch("searchModel")
  public onSearchModelChanged(newVal: Ranking) {
    if (newVal) {
      this.$store.direct.commit.player.SET_OPPONENT_TAG(`${newVal.player.playerIds[0].battleTag}`);
    } else {
      this.$store.direct.commit.player.SET_OPPONENT_TAG("");
    }
    this.getMatches();
  }

  @Watch("search")
  public onSearchChanged(newValue: string) {
    if (newValue && newValue.length > 2) {
      this.$store.direct.dispatch.rankings.search(newValue.toLowerCase());
    } else {
      this.$store.direct.dispatch.rankings.clearSearch();
    }
  }

  get raceWithoutRandom(): RaceWinsOnMap[] {
    if (!this.playerStatsRaceVersusRaceOnMap.raceWinsOnMap) return [];
    return this.playerStatsRaceVersusRaceOnMap.raceWinsOnMap.filter(
      r => r.race !== ERaceEnum.RANDOM
    );
  }

  get playerWins() {
    return this.$store.direct.state.player?.playerProfile?.raceStats ?? [];
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
    if (this.profile && this.profile.gateWayStats) {

      return this.gameModesByGateway.filter(
        g => g.mode === EGameMode.GM_1ON1 || g.mode === EGameMode.GM_2ON2_AT
      );
    }

    return [];
  }

  get loadingProfile(): boolean {
    return this.$store.direct.state.player.loadingProfile;
  }

  get battleTag(): string {
    return this.id;
  }

  onPageChanged(page: number) {
    this.getMatches(page);
  }

  get totalMatches(): number {
    return this.$store.direct.state.player.totalMatches;
  }

  get isLoggedInPlayer(): boolean {
    return this.battleTag.startsWith(this.verifiedBtag);
  }

  get matches(): Match[] {
    return this.$store.direct.state.player.matches;
  }

  get gameModesByGateway(): ModeStat[] {
    if (!this.profile || !this.profile.gateWayStats) {
      return [];
    }

    const gateWayStats = this.profile.gateWayStats.find(x => x.gateWay == this.selectedGateWay);

    return (gateWayStats || {}).gameModeStats || [];
  }

  public async getMatches(page?: number) {
    await this.$store.direct.dispatch.player.loadMatches(page);
    this.opponentWins = 0;
    if (this.$store.direct.state.player.opponentTag.length) {
      this.opponentWins = this.matches.filter((match: Match) =>
        match.teams.some((team: Team) => {
          return team.players.some(
            (player: PlayerInTeam) => player.battleTag === this.battleTag && player.won
          );
        })
      ).length;
    }
  }

  mounted() {
    this.init();
  }

  private async init() {
    this.$store.direct.commit.player.SET_BATTLE_TAG(this.battleTag);
    this.getMatches();

    await this.$store.direct.dispatch.player.loadProfile(this.battleTag);
    await this.$store.direct.dispatch.player.loadPlayerStatsRaceVersusRaceOnMap(
      this.battleTag
    );
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
</style>
