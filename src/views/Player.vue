<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title class="justify-space-between">
            <div
              style="display: flex; flex-direction: row; align-items: center;"
            >
              <span>Profile of {{ profile.battleTag }}</span>
              <div
                style="display: flex; flex-direction: row; margin-left: 25px;"
              >
                <SeasonBadge
                  v-for="season in seasonsWithoutCurrentOne"
                  :season="season"
                  :key="season.id"
                  :on-click="selectSeason"
                />
              </div>
            </div>
            <div>
              <gateway-select @gatewayChanged="gatewayChanged" />
              <v-menu offset-x>
                <template v-slot:activator="{ on }">
                  <v-btn
                    tile
                    v-on="on"
                    class="ma-2"
                    style="background-color: transparent;"
                  >
                    <span class="pa-0" v-if="selectedSeason">
                      Season {{ selectedSeason.id }}
                    </span>
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
          <div
            class="live-match__container"
            v-if="ongoingMatch.id"
            :class="ongoingMatchGameModeClass"
          >
            <div class="live-match__indicator">
              Live
              <span class="circle red blinker"></span>
              <span class="live-match__duration">
                {{ getDuration(ongoingMatch) }}'
              </span>
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
            <div v-if="isOngoingMatchFFA" class="live-match__ffa">
              Playing FFA
            </div>
            <span class="live-match__map">
              {{ $t("mapNames." + ongoingMatch.map) }}
            </span>
          </div>
          <v-tabs v-model="tabsModel">
            <v-tabs-slider></v-tabs-slider>
            <v-tab
              class="profileTab"
              :to="`/player/${encodeURIComponent(this.battleTag)}`"
            >
              Profile
            </v-tab>
            <v-tab
              class="profileTab"
              :to="`/player/${encodeURIComponent(this.battleTag)}/matches`"
            >
              Match History
            </v-tab>
            <v-tab
              class="profileTab"
              :to="`/player/${encodeURIComponent(this.battleTag)}/at-teams`"
            >
              Teams
            </v-tab>
            <v-tab
              class="profileTab"
              :to="`/player/${encodeURIComponent(this.battleTag)}/statistics`"
            >
              Statistics
            </v-tab>
            <v-tab
              class="profileTab"
              :to="`/player/${encodeURIComponent(this.battleTag)}/clan`"
            >
              Clan
            </v-tab>
          </v-tabs>
          <router-view></router-view>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { PlayerProfile } from "@/store/player/types";
import { EGameMode, Match, PlayerInTeam, Team } from "@/store/typings";

import MatchesGrid from "../components/matches/MatchesGrid.vue";
import ModeStatsGrid from "@/components/player/ModeStatsGrid.vue";
import PlayerStatsRaceVersusRaceOnMap from "@/components/player/PlayerStatsRaceVersusRaceOnMap.vue";
import PlayerAvatar from "@/components/player/PlayerAvatar.vue";
import PlayerLeague from "@/components/player/PlayerLeague.vue";
import { Season } from "@/store/ranking/types";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import AppConstants from "../constants";
import ClanOverview from "@/components/clans/ClanOverview.vue";
import RaceIcon from "@/components/player/RaceIcon.vue";

import PlayerMatchesTab from "@/components/player/tabs/PlayerMatchesTab.vue";
import PlayerProfileTab from "@/components/player/tabs/PlayerProfileTab.vue";
import PlayerArrangedTeamsTab from "@/components/player/tabs/PlayerArrangedTeamsTab.vue";
import PlayerStatisticTab from "@/components/player/tabs/PlayerStatisticTab.vue";
import SeasonBadge from "@/components/player/SeasonBadge.vue";

@Component({
  components: {
    SeasonBadge,
    PlayerStatisticTab,
    PlayerArrangedTeamsTab,
    PlayerProfileTab,
    PlayerMatchesTab,
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
  @Prop() public freshLogin!: boolean;

  public tabsModel = {};
  private _intervalRefreshHandle: any = {};

  @Watch("battleTag")
  onBattleTagChanged() {
    this.init();
  }

  get raceStats() {
    return this.$store.direct.state.player.raceStats;
  }

  get gameModeStats() {
    return this.$store.direct.state.player.gameModeStats;
  }

  public selectSeason(season: Season) {
    this.$store.direct.commit.player.SET_SELECTED_SEASON(season);
    this.$store.direct.dispatch.player.loadGameModeStats({});
    this.$store.direct.dispatch.player.loadRaceStats();
    this.$store.direct.dispatch.player.loadMatches(1);
    this.$store.direct.dispatch.player.loadPlayerStatsRaceVersusRaceOnMap(
      this.battleTag
    );
    this.$store.direct.dispatch.player.loadPlayerMmrRpTimeline();
  }

  get seasons() {
    return this.$store.direct.state.player.playerProfile.participatedInSeasons;
  }

  get seasonsWithoutCurrentOne() {
    return (
      this.seasons
        ?.filter(
          (s) => s.id !== this.$store.direct.state.rankings.seasons[0]?.id
        )
        .reverse() ?? []
    );
  }

  get profile(): PlayerProfile {
    return this.$store.direct.state.player.playerProfile;
  }

  get loadingProfile(): boolean {
    return this.$store.direct.state.player.loadingProfile;
  }

  get selectedSeason() {
    return this.$store.direct.state.player.selectedSeason;
  }

  get battleTag(): string {
    return decodeURIComponent(this.id);
  }

  get totalMatches(): number {
    return this.$store.direct.state.player.totalMatches;
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

    await this.$store.direct.dispatch.player.loadProfile({battleTag: this.battleTag, freshLogin: this.freshLogin});
    await this.$store.direct.dispatch.player.loadGameModeStats({});
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
  }

  .live-match__team2 {
    position: absolute;
    right: 0;
    width: 45%;
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
