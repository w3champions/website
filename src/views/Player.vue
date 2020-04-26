<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            Profile of
            <span v-if="!loadingProfile" class="playerTag">
              {{ profile.name }}#{{ profile.battleTag }}</span
            >
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
                <v-row>
                  <v-col cols="md-2">
                    <v-card-text style="padding-top: 0 !important;">
                      <player-avatar
                        :wins="this.playerWins"
                        :modeStats="this.profile.gameModeStats"
                        :is-logged-in-player="isLoggedInPlayer"
                      />
                    </v-card-text>
                  </v-col>
                  <v-col cols="md-6">
                    <h4>Statistics by Game Mode</h4>
                    <mode-stats-grid
                      :stats="oneVersusOneGameModeStats"
                    ></mode-stats-grid>
                  </v-col>
                  <v-col cols="md-4">
                    <h4>Statistics by Race</h4>
                    <v-data-table
                      hide-default-footer
                      :headers="raceHeaders"
                      :items="profile.raceStats"
                    >
                      <template v-slot:item.race="{ item }">
                        <span>{{ $t("races." + raceEnums[item.race]) }}</span>
                      </template>
                      <template v-slot:item.wins="{ item }">
                        <span class="won">{{ item.wins }}</span>
                      </template>
                      <template v-slot:item.losses="{ item }">
                        <span class="lost">{{ item.losses }}</span>
                      </template>
                      <template v-slot:item.percentage="{ item }"
                        >{{ (item.winrate * 100).toFixed(1) }}%</template
                      >
                    </v-data-table>
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
                            Wins: {{ data.item.player.totalWins }} | Losses:
                            {{ data.item.player.totalLosses }} | Total:
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
                      Winrate: {{ (opponentWins / matches.length) * 100 }}%
                      VS
                      {{
                        searchModel.player.name +
                          "#" +
                          searchModel.player.battleTag
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
import { Ranking } from "@/store/ranking/types";

@Component({
  components: {
    PlayerAvatar,
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
      this.$store.direct.commit.player.SET_OPPONENT_TAG(newVal.player.id);
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

  get oneVersusOneGameModeStats(): ModeStat[] {
    if (this.profile && this.profile.gameModeStats) {
      return this.profile.gameModeStats.filter(
        g => g.mode === EGameMode.GM_1ON1
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

  public async getMatches(page?: number) {
    await this.$store.direct.dispatch.player.loadMatches(page);
    this.opponentWins = 0;
    if (this.$store.direct.state.player.opponentTag.length) {
      this.opponentWins = this.matches.filter((match: Match) =>
        match.teams.some((team: Team) => {
          return team.players.some(
            (player: PlayerInTeam) => player.id === this.battleTag && player.won
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
