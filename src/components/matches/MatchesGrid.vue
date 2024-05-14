<template>
  <div>
    <div class="custom-table-wrapper elevation-1">
      <table class="custom-table">
        <thead>
          <tr>
            <td
              v-for="header in headers"
              :key="header.name"
              :style="header.style"
            >
              {{ header.text }}
            </td>
            <td v-if="!unfinished">
              {{ $t("components_matches_matchesgrid.replay") }}
            </td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in matches" :key="item.id">
            <td>
              <div v-if="isFfa(item.gameMode)"  @click="goToMatchDetailPage(item)" class="my-3">
                <v-row justify="center" v-if="alwaysLeftName">
                  <v-col offset="4" class="py-1">
                    <team-match-info
                      :not-clickable="!unfinished"
                      :team="getPlayerTeam(item)"
                      :unfinishedMatch="unfinished"
                      :is-anonymous="true"
                    ></team-match-info>
                  </v-col>
                </v-row>
                <v-row justify="center" v-for="(team, index) in getOpponentTeams(item)" :key="index">
                  <v-col offset="4" class="py-1">
                    <team-match-info
                      :not-clickable="!unfinished"
                      :team="team"
                      :unfinishedMatch="unfinished"
                      :is-anonymous="true"
                    ></team-match-info>
                  </v-col>
                </v-row>
              </div>
              <v-row @click="goToMatchDetailPage(item)" v-if="!isFfa(item.gameMode)">
                <v-col cols="5.5" class="team-match-info-container left-side">
                  <team-match-info
                    :not-clickable="!unfinished"
                    :team="alwaysLeftName ? getPlayerTeam(item) : getWinner(item)"
                    :unfinishedMatch="unfinished"
                    left="true"
                  ></team-match-info>
                </v-col>
                <v-col cols="1">
                  VS
                  <host-icon v-if="item.serverInfo && item.serverInfo.provider" :host="item.serverInfo"></host-icon>
                </v-col>
                <v-col cols="5.5" class="team-match-info-container">
                  <team-match-info
                    :not-clickable="!unfinished"
                    :team="alwaysLeftName ? getOpponentTeam(item) : getLoser(item)"
                    :unfinishedMatch="unfinished"
                  ></team-match-info>
                </v-col>
              </v-row>
            </td>
            <td>
              {{ gameModeTranslation(item.gameMode) }}
            </td>
            <td>
              <span>{{ mapNameFromMatch(item) }}</span>
            </td>
            <td>
              {{ getStartTime(item) }}
            </td>
            <td>
              <span class="number-text">{{ getDuration(item) }}</span>
            </td>
            <td v-if="showReplayDownload(item)">
              <download-replay-icon :gameId="item.id"></download-replay-icon>
            </td>
          </tr>
          <tr v-if="!matches || matches.length == 0">
            <td colspan="4" class="text-center">
              {{ $t("components_matches_matchesgrid.nomatchesfound") }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="filter-blur">
      <div class="text-center font-regular mt-2">
        {{ currentMatchesLowRange }} - {{ currentMatchesHighRange }} of
        {{ totalMatches }}
      </div>
      <v-pagination v-model="page" :length="getTotalPages()" :total-visible="5" @input="onPageChanged"></v-pagination>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { StyleValue } from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Match, Team, PlayerInTeam, EGameMode } from "@/store/types";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import HostIcon from "@/components/matches/HostIcon.vue";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";
import { mapNameFromMatch } from "@/mixins/MatchMixin";
import {
  formatSecondsToDuration,
  formatTimestampStringToDateTime,
  formatTimestampStringToUnixTime
} from "@/helpers/date-functions";
import { TranslateResult } from "vue-i18n";

interface MatchesGridHeader {
  name: string;
  text: TranslateResult;
  sortable: boolean;
  value: string;
  style: StyleValue;
}

@Component({
  components: {
    TeamMatchInfo,
    HostIcon,
    DownloadReplayIcon,
  },
})

export default class MatchesGrid extends Vue {
  @Prop() public value!: Match[];
  @Prop() public totalMatches!: number;
  @Prop() public itemsPerPage!: number;
  @Prop() public alwaysLeftName!: string;
  @Prop() public unfinished!: boolean;

  public page = 1;
  public mapNameFromMatch = mapNameFromMatch;

  destroyed() {
    this.$emit("pageChanged", 1);
  }

  gameModeTranslation(gameMode: EGameMode) {
    return this.$t(`gameModes.${EGameMode[gameMode]}`);
  }

  isFfa(gameMode: EGameMode) {
    const ffaModes = [
      EGameMode.GM_FFA, EGameMode.GM_LTW_FFA, EGameMode.GM_SC_FFA_4
    ];

    return ffaModes.includes(gameMode);
  }

  get matches(): Match[] {
    return this.value;
  }

  get currentMatchesLowRange() {
    if (this.totalMatches === 0) return 0;
    if (this.totalMatches <= 50) return 1;
    return this.page * 50 - 49;
  }

  get currentMatchesHighRange() {
    const highRange = this.page * 50;
    return highRange > this.totalMatches ? this.totalMatches : highRange;
  }

  public onPageChanged(page: number) {
    this.$emit("pageChanged", page);
  }

  public getWinner(match: Match) {
    return match.teams[0];
  }

  public getTotalPages() {
    if (!this.totalMatches) {
      return 1;
    }

    return Math.ceil(this.totalMatches / 50);
  }

  public goToMatchDetailPage(match: Match) {
    if (this.unfinished) {
      return true;
    }

    this.$router.push({
      path: `/match/${match.id}`,
    });
  }

  public getLoser(match: Match) {
    return match.teams[1];
  }

  public getPlayerTeam(match: Match) {
    const playerTeam = match.teams.find((team: Team) =>
      team.players.some((player: PlayerInTeam) => player.battleTag === this.alwaysLeftName)
    );

    return playerTeam;
  }

  public getOpponentTeam(match: Match) {
    return match.teams.find(
      (team: Team) => !team.players.some((player: PlayerInTeam) => player.battleTag === this.alwaysLeftName)
    );
  }

  public getOpponentTeams(match: Match) {
    const playerTeam = this.getPlayerTeam(match);
    const opponentTeams = match.teams.filter((x) => x != playerTeam);

    return opponentTeams;
  }

  public getStartTime(match: Match): string {
    return formatTimestampStringToDateTime(match.startTime);
  }

  public getDuration(match: Match): string {
    if (this.unfinished) {
      return this.$t("matchStatuses.onGoing").toString();
    }
    return formatSecondsToDuration(match.durationInSeconds);
  }

  showReplayDownload(item: Match): boolean {
    // Timestamp is - 29th September 2022 - 17:17 UTC - first game of 1.33.0.19378
    return !this.unfinished && formatTimestampStringToUnixTime(item.endTime) > 1664471820;
  }

  get headers(): MatchesGridHeader[] {
    return [
      {
        name: "Players",
        text: this.$t("components_matches_matchesgrid.players"),
        sortable: false,
        value: "players",
        style: {
          textAlign: "center",
          minWidth: "475px",
        },
      },
      {
        name: "Gamemode",
        text: this.$t("components_matches_matchesgrid.gamemode"),
        sortable: false,
        value: "gameMode",
        style: {
          textAlign: "start",
          minWidth: "100px",
        },
      },
      {
        name: "Map",
        text: this.$t("components_matches_matchesgrid.map"),
        sortable: false,
        value: "map",
        style: {
          textAlign: "start",
        },
      },
      {
        name: "Starttime",
        text: this.$t("components_matches_matchesgrid.starttime"),
        sortable: false,
        value: "startTime",
        style: {
          textAlign: "start",
          minWidth: "170px",
        },
      },
      {
        name: "Duration",
        text: this.$t("components_matches_matchesgrid.duration"),
        sortable: false,
        value: "duration",
        style: {
          textAlign: "start",
        },
      },
    ];
  }
}
</script>

<style lang="scss" scoped>
.team-match-info-container {
  display: flex;
  align-items: center;
  justify-content: start;

  &.left-side {
    justify-content: end;
  }
}
</style>