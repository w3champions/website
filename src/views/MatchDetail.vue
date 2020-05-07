<template>
  <v-container class="profile">
    <v-row v-if="!loading">
      <v-col cols="12">
        <v-card tile>
          <v-card-title class="justify-center">
            <v-row justify="space-around">
              <v-col>
                <team-match-info
                  :big-race-icon="true"
                  :left="true"
                  :team="match.teams[0]"
                />
              </v-col>
              <v-col cols="1" class="text-center">
                <span>VS</span>
              </v-col>
              <v-col>
                <team-match-info :big-race-icon="true" :team="match.teams[1]" />
              </v-col>
            </v-row>
          </v-card-title>
          <v-card-title class="justify-center small-title">
            <v-card-subtitle>
              {{ $t(`mapNames.${match.map}`) }} ({{ matchDuration }})
              {{ playedDate }}
            </v-card-subtitle>
          </v-card-title>
          <match-detail-hero-row
            :heroes-of-winner="scoresOfWinners[0].heroes"
            :heroes-of-looser="scoresOfLoosers[0].heroes"
            :scores-of-looser="scoresOfLoosers[0].heroScore"
            :scores-of-winner="scoresOfWinners[0].heroScore"
          />
          <match-detail-hero-row
            v-if="matchIs2v2"
            :heroes-of-winner="scoresOfWinners[1].heroes"
            :heroes-of-looser="scoresOfLoosers[1].heroes"
            :scores-of-looser="scoresOfLoosers[1].heroScore"
            :scores-of-winner="scoresOfWinners[1].heroScore"
          />
          <v-row>
            <v-col cols="1"> </v-col>
            <v-col cols="5">
              <player-performance-on-match
                :unit-score="scoresOfWinners.map(h => h.unitScore)"
                :resource-scoure="scoresOfWinners.map(h => h.resourceScore)"
                :unit-score-opponent="scoresOfLoosers.map(h => h.unitScore)"
                :resource-scoure-opponent="scoresOfLoosers.map(h => h.resourceScore)"
                :left="true"
              />
            </v-col>
            <v-col cols="5">
              <player-performance-on-match
                :unit-score="scoresOfLoosers.map(h => h.unitScore)"
                :resource-scoure="scoresOfLoosers.map(h => h.resourceScore)"
                :unit-score-opponent="scoresOfWinners.map(h => h.unitScore)"
                :resource-scoure-opponent="scoresOfWinners.map(h => h.resourceScore)"
              />
            </v-col>
            <v-col cols="1"> </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import TeamMatchInfo from "@/components/TeamMatchInfo.vue";
import moment from "moment";
import MatchHiglights from "@/components/MatchHiglights.vue";
import HeroIcon from "@/components/HeroIcon.vue";
import PlayerPerformanceOnMatch from "@/components/PlayerPerformanceOnMatch.vue";
import MatchDetailHeroRow from "@/components/MatchDetailHeroRow.vue";
import { EGameMode } from "@/store/typings";

@Component({
  components: {
    MatchDetailHeroRow,
    PlayerPerformanceOnMatch,
    HeroIcon,
    MatchHiglights,
    TeamMatchInfo
  }
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
    return moment
      .utc(
        moment
          .duration(this.match.durationInSeconds, "seconds")
          .asMilliseconds()
      )
      .format("mm:ss");
  }

  get playedDate() {
    return moment(this.match.startTime).format("MM.DD.YYYY");
  }

  get match() {
    return this.$store.direct.state.matches.matchDetail.match;
  }

  get matchIs2v2() {
    return (
      this.$store.direct.state.matches.matchDetail.match.gameMode ==
      EGameMode.GM_2ON2
    );
  }

  get scoresOfWinners() {
    return this.$store.direct.state.matches.matchDetail.playerScores.filter(
      s =>
        this.match.teams[0].players[0].battleTag.startsWith(s.battleTag) ||
        this.match.teams[0].players[1]?.battleTag?.startsWith(s.battleTag)
    );
  }

  get scoresOfLoosers() {
    return this.$store.direct.state.matches.matchDetail.playerScores.filter(
      s =>
        this.match.teams[1].players[0].battleTag.startsWith(s.battleTag) ||
        this.match.teams[1].players[1]?.battleTag?.startsWith(s.battleTag)
    );
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
