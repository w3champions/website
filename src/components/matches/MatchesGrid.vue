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
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in matches"
            :key="item.id"
            @click="goToMatchDetailPage(item)"
          >
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
                <v-row
                  justify="center"
                  v-for="(team, index) in getOpponentTeams(item)"
                  :key="index"
                >
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
              <v-row v-if="item.gameMode !== 5">
                <v-col cols="5.5">
                  <team-match-info
                    :not-clickable="!unfinished"
                    :team="
                      alwaysLeftName ? getPlayerTeam(item) : getWinner(item)
                    "
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
                    :team="
                      alwaysLeftName ? getOpponentTeam(item) : getLoser(item)
                    "
                    :unfinishedMatch="unfinished"
                  ></team-match-info>
                </v-col>
              </v-row>
            </td>
            <td>
              <span>{{ $t("mapNames." + item.map.replace("'", "")) }}</span>
            </td>
            <td>
              {{
                item.startTime | moment($t("dateFormats.dateTime").toString())
              }}
            </td>
            <td>
              <span class="number-text">{{ getDuration(item) }}</span>
            </td>
          </tr>
          <tr v-if="!matches || matches.length == 0">
            <td colspan="4" class="text-center">
              no matches found
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
      <v-pagination
        v-model="page"
        :length="getTotalPages()"
        :total-visible="5"
        @input="onPageChanged"
      ></v-pagination>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import {
  Match,
  DataTableOptions,
  Team,
  PlayerInTeam,
  EGameMode,
} from "@/store/typings";
import moment from "moment";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import HostIcon from "@/components/matches/HostIcon.vue";

@Component({
  components: {
    TeamMatchInfo,
    HostIcon
  },
})
export default class MatchesGrid extends Vue {
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
      team.players.some(
        (player: PlayerInTeam) => player.battleTag === this.alwaysLeftName
      )
    );

    return playerTeam;
  }

  public getOpponentTeam(match: Match) {
    return match.teams.find(
      (team: Team) =>
        !team.players.some(
          (player: PlayerInTeam) => player.battleTag === this.alwaysLeftName
        )
    );
  }

  public getOpponentTeams(match: Match) {
    const playerTeam = this.getPlayerTeam(match);
    const opponentTeams = match.teams.filter((x) => x != playerTeam);

    return opponentTeams;
  }

  public getDuration(match: Match) {
    if (this.unfinished) {
      return "ongoing";
    }

    const format =
      match.durationInSeconds <= 3600
        ? this.$t("dateFormats.timeShort")
        : this.$t("dateFormats.timeLong");
    return moment
      .utc(moment.duration(match.durationInSeconds, "seconds").asMilliseconds())
      .format(format.toString())
      .toString();
  }

  public headers = [
    {
      text: "Players",
      align: "center",
      sortable: false,
      value: "players",
      minWidth: "475px",
    },
    {
      text: "Map",
      align: "start",
      sortable: false,
      value: "map",
    },
    {
      text: "Start Time",
      align: "start",
      sortable: false,
      value: "startTime",
      minWidth: "170px",
    },
    {
      text: "Duration",
      align: "start",
      sortable: false,
      value: "duration",
    },
  ];
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
