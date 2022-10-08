<template>
  <div>
    <div class="custom-table-wrapper elevation-1">
      <table class="custom-table">
        <thead>
          <tr>
            <td
              v-for="header in headers"
              :key="header.text"
              v-bind:style="{
                width: header.width,
                'min-width': header.minWidth,
                'text-align': header.align,
              }"
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
              <div v-if="item.gameMode === 5" class="my-3">
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
              <v-row @click="goToMatchDetailPage(item)" v-if="item.gameMode !== 5">
                <v-col cols="5.5">
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
                <v-col cols="5.5">
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
              <span>{{ $_mapNameFromMatch(item) }}</span>
            </td>
            <td>
              {{ item.startTime | moment($t("dateFormats.dateTime").toString()) }}
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
import { Component, Mixins, Prop } from "vue-property-decorator";
import { Match, Team, PlayerInTeam, EGameMode } from "@/store/typings";
import moment from "moment";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import HostIcon from "@/components/matches/HostIcon.vue";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";
import MatchMixin from "@/mixins/MatchMixin";

@Component({
  components: {
    TeamMatchInfo,
    HostIcon,
    DownloadReplayIcon,
  },
})
export default class MatchesGrid extends Mixins(MatchMixin) {
  @Prop() public value!: Match[];
  @Prop() public totalMatches!: number;
  @Prop() public itemsPerPage!: number;
  @Prop() public alwaysLeftName!: string;
  @Prop() public unfinished!: boolean;

  data() {
    return {
      page: 1,
    };
  }

  destroyed() {
    this.$emit("pageChanged", 1);
  }

  gameModeTranslation(gameMode: EGameMode) {
    return this.$t(`gameModes.${EGameMode[gameMode]}`);
  }

  get matches(): Match[] {
    return this.value;
  }

  get currentMatchesLowRange() {
    if (this.totalMatches === 0) {
      return 0;
    }
    if (this.totalMatches <= 50) {
      return 1;
    }
    return this.$data.page * 50 - 49;
  }

  get currentMatchesHighRange() {
    const highRange = this.$data.page * 50;

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

  public getDuration(match: Match) {
    if (this.unfinished) {
      return this.$t("matchStatuses.onGoing");
    }

    const format = match.durationInSeconds <= 3600 ? this.$t("dateFormats.timeShort") : this.$t("dateFormats.timeLong");

    return moment
      .utc(moment.duration(match.durationInSeconds, "seconds").asMilliseconds())
      .format(format.toString())
      .toString();
  }

  showReplayDownload(item: Match): boolean {
    // Timestamp is - 29th September 2022 - 17:17 UTC - first game of 1.33.0.19378
    return !this.unfinished && moment(item.endTime).unix() > 1664471820 ? true : false;
  }

  get headers() {
    return [
      {
        text: this.$t("components_matches_matchesgrid.players"),
        align: "center",
        sortable: false,
        value: "players",
        minWidth: "475px",
      },
      {
        text: this.$t("components_matches_matchesgrid.gamemode"),
        align: "start",
        sortable: false,
        value: "gameMode",
        maxWidth: "100px",
      },
      {
        text: this.$t("components_matches_matchesgrid.map"),
        align: "start",
        sortable: false,
        value: "map",
      },
      {
        text: this.$t("components_matches_matchesgrid.starttime"),
        align: "start",
        sortable: false,
        value: "startTime",
        minWidth: "170px",
      },
      {
        text: this.$t("components_matches_matchesgrid.duration"),
        align: "start",
        sortable: false,
        value: "duration",
      },
    ];
  }
}
</script>

<style lang="scss">
.playerCol {
  max-width: 500px;
}

.pager__current-matches {
  text-align: center;
}
</style>
