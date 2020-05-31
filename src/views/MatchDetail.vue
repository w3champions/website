<template>
  <v-container class="profile">
    <v-row v-if="!loading">
      <v-col cols="12">
        <v-card tile>
          <v-card-title class="justify-center">
            <v-row justify="space-around">
              <v-col cols="1" class="pl-0 pr-0">
                <v-card-subtitle class="pa-0">
                  {{ $t(`gatewayNames.${gateWay}`) }}
                  <br />
                  Season: {{ season }}
                </v-card-subtitle>
              </v-col>
              <v-col cols="4">
                <team-match-info
                  :big-race-icon="true"
                  :left="true"
                  :team="match.teams[0]"
                />
              </v-col>
              <v-col cols="1" class="text-center">
                <span>VS</span>
              </v-col>
              <v-col v-if="!matchIsFFA" cols="4">
                <team-match-info :big-race-icon="true" :team="match.teams[1]" />
              </v-col>
              <v-col v-if="matchIsFFA" cols="4">
                <team-match-info class="ma-1" :big-race-icon="true" :team="match.teams[1]" />
                <team-match-info class="ma-1" :big-race-icon="true" :team="match.teams[2]" />
                <team-match-info class="ma-1" :big-race-icon="true" :team="match.teams[3]" />
              </v-col>
              <v-col cols="1" />
            </v-row>
          </v-card-title>
          <v-card-title class="justify-center small-title">
            <v-card-subtitle>
              {{ $t(`mapNames.${match.map}`) }} ({{ matchDuration }})
              {{ playedDate }}
            </v-card-subtitle>
          </v-card-title>
          <match-detail-hero-row
            v-if="isCompleteGame && !matchIsFFA"
            :heroes-of-winner="scoresOfWinners[0].heroes"
            :heroes-of-looser="scoresOfLoosers[0].heroes"
            :scores-of-winner="scoresOfWinners[0].heroScore"
            :scores-of-looser="scoresOfLoosers[0].heroScore"
          />
          <match-detail-hero-row
            v-if="matchIs2v2 && isCompleteGame"
            :heroes-of-winner="scoresOfWinners[1].heroes"
            :scores-of-winner="scoresOfWinners[1].heroScore"
            :heroes-of-looser="scoresOfLoosers[1].heroes"
          />
          <match-detail-hero-row
            v-if="matchIsFFA && isCompleteGame"
            :heroes-of-winner="ffaWinner.heroes"
            :heroes-of-looser="ffaLooser1.heroes"
            :scores-of-winner="ffaWinner.heroScore"
            :scores-of-looser="ffaLooser1.heroScore"
          />
          <match-detail-hero-row
            v-if="matchIsFFA && isCompleteGame"
            :heroes-of-winner="ffaLooser2.heroes"
            :heroes-of-looser="ffaLooser3.heroes"
            :scores-of-winner="ffaLooser2.heroScore"
            :scores-of-looser="ffaLooser3.heroScore"
          />
          <v-row v-if="!isCompleteGame" class="justify-center">
            <v-card-subtitle>
              Sorry, but this games seems to have incomplete data
            </v-card-subtitle>
          </v-row>
          <v-row v-if="isCompleteGame && !matchIsFFA">
            <v-col :cols="matchIs2v2 ? 2 : 1"></v-col>
            <v-col cols="5">
              <player-performance-on-match
                :unit-score="scoresOfWinners.map((h) => h.unitScore)"
                :resource-scoure="scoresOfWinners.map((h) => h.resourceScore)"
                :unit-score-opponent="scoresOfLoosers.map((h) => h.unitScore)"
                :resource-scoure-opponent="
                  scoresOfLoosers.map((h) => h.resourceScore)
                "
                :left="true"
              />
            </v-col>
            <v-col cols="5">
              <player-performance-on-match
                :unit-score="scoresOfLoosers.map((h) => h.unitScore)"
                :resource-scoure="scoresOfLoosers.map((h) => h.resourceScore)"
                :unit-score-opponent="scoresOfWinners.map((h) => h.unitScore)"
                :resource-scoure-opponent="
                  scoresOfWinners.map((h) => h.resourceScore)
                "
              />
            </v-col>
            <v-col cols="1"></v-col>
          </v-row>
          <v-row v-if="isCompleteGame && matchIsFFA">
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import moment from "moment";
import MatchHiglights from "@/components/match-details/MatchHiglights.vue";
import HeroIcon from "@/components/match-details/HeroIcon.vue";
import PlayerPerformanceOnMatch from "@/components/match-details/PlayerPerformanceOnMatch.vue";
import MatchDetailHeroRow from "@/components/match-details/MatchDetailHeroRow.vue";
import { EGameMode } from "@/store/typings";
import { Gateways } from "@/store/ranking/types";

@Component({
  components: {
    MatchDetailHeroRow,
    PlayerPerformanceOnMatch,
    HeroIcon,
    MatchHiglights,
    TeamMatchInfo,
  },
})
export default class MatchDetailView extends Vue {
  @Prop() public matchId!: string;

  @Watch("matchId")
  onMatchIdChanged() {
    this.init();
  }

  mounted() {
    this.init();
  }

  get matchDuration() {
    const format =
      this.match.durationInSeconds <= 3600
        ? this.$t("dateFormats.timeShort")
        : this.$t("dateFormats.timeLong");
    return moment
      .utc(
        moment
          .duration(this.match.durationInSeconds, "seconds")
          .asMilliseconds()
      )
      .format(format.toString())
      .toString();
  }

  get playedDate() {
    return moment(this.match.startTime).format(
      this.$t("dateFormats.date").toString()
    );
  }

  get match() {
    return this.$store.direct.state.matches.matchDetail.match;
  }

  get gateWay() {
    return Gateways[this.$store.direct.state.matches.matchDetail.match.gateWay];
  }

  get season() {
    return this.$store.direct.state.matches.matchDetail.match.season ?? 1;
  }

  get matchIs2v2() {
    return (
      this.$store.direct.state.matches.matchDetail.match.gameMode ==
      EGameMode.GM_2ON2_AT
    );
  }

  get matchIsFFA() {
    return (
      this.$store.direct.state.matches.matchDetail.match.gameMode ==
      EGameMode.GM_FFA
    );
  }

  get isCompleteGame() {
    return this.$store.direct.state.matches.matchDetail.playerScores;
  }

  get scoresOfWinners() {
    return this.$store.direct.state.matches.matchDetail.playerScores.filter(
      (s) =>
        this.match.teams[0].players[0].battleTag.startsWith(s.battleTag) ||
        this.match.teams[0].players[1]?.battleTag?.startsWith(s.battleTag)
    );
  }

  get scoresOfLoosers() {
    return this.$store.direct.state.matches.matchDetail.playerScores.filter(
      (s) =>
        this.match.teams[1].players[0].battleTag.startsWith(s.battleTag) ||
        this.match.teams[1].players[1]?.battleTag?.startsWith(s.battleTag)
    );
  }

  get ffaWinner() {
    return this.$store.direct.state.matches.matchDetail.playerScores.find(s => s.battleTag === this.match.teams[0].players[0].battleTag);
  }

  get ffaLoosers() {
    return this.$store.direct.state.matches.matchDetail.playerScores.filter(s => s.battleTag !== this.match.teams[0].players[0].battleTag);
  }

  get ffaLooser1() {
    return this.$store.direct.state.matches.matchDetail.playerScores.find(s => s.battleTag === this.match.teams[1].players[0].battleTag);
  }

  get ffaLooser2() {
    return this.$store.direct.state.matches.matchDetail.playerScores.find(s => s.battleTag === this.match.teams[2].players[0].battleTag);
  }

  get ffaLooser3() {
    return this.$store.direct.state.matches.matchDetail.playerScores.find(s => s.battleTag === this.match.teams[3].players[0].battleTag);
  }

  get loading() {
    return this.$store.direct.state.matches.loadingMatchDetail;
  }

  private async init() {
    await this.$store.direct.dispatch.matches.loadMatchDetail(this.matchId);
  }
}
</script>

<style type="text/css">
.small-title {
  margin-top: -30px !important;
  margin-bottom: -25px !important;
}
</style>
