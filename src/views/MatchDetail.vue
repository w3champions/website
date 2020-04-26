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
          <v-row justify="space-between">
            <v-col cols="1"> </v-col>
            <v-col cols="1">
              <hero-icon :hero="heroesOfWinner[2]" />
            </v-col>
            <v-col cols="1">
              <hero-icon :hero="heroesOfWinner[1]" />
            </v-col>
            <v-col cols="1">
              <hero-icon :hero="heroesOfWinner[0]" />
            </v-col>
            <v-col cols="2">
              <match-higlights
                :left="true"
                :experience="scoresOfWinner.heroScore.expGained"
                :hero-kills="scoresOfWinner.heroScore.heroesKilled"
                :items-collected="scoresOfWinner.heroScore.itemsObtained"
                :hero-kills-opponent="scoresOfLooser.heroScore.heroesKilled"
                :experience-opponent="scoresOfLooser.heroScore.expGained"
                :items-collected-opponent="scoresOfLooser.heroScore.itemsObtained"
              />
            </v-col>
            <v-col cols="2">
              <match-higlights
                :experience="scoresOfLooser.heroScore.expGained"
                :hero-kills="scoresOfLooser.heroScore.heroesKilled"
                :items-collected="scoresOfLooser.heroScore.itemsObtained"
                :hero-kills-opponent="scoresOfWinner.heroScore.heroesKilled"
                :experience-opponent="scoresOfWinner.heroScore.expGained"
                :items-collected-opponent="scoresOfWinner.heroScore.itemsObtained"
              />
            </v-col>
            <v-col cols="1">
              <hero-icon :hero="heroesOfLooser[0]" />
            </v-col>
            <v-col cols="1">
              <hero-icon :hero="heroesOfLooser[1]" />
            </v-col>
            <v-col cols="1">
              <hero-icon :hero="heroesOfLooser[2]" />
            </v-col>
            <v-col cols="1"> </v-col>
          </v-row>
          <v-row>
            <v-col cols="1"> </v-col>
            <v-col>
              <player-performance-on-match
                :unit-score="scoresOfWinner.unitScore"
                :resource-scoure="scoresOfWinner.resourceScore"
                :unit-score-opponent="scoresOfLooser.unitScore"
                :resource-scoure-opponent="scoresOfLooser.resourceScore"
                :left="true"
              />
            </v-col>
            <v-col>
              <player-performance-on-match
                :unit-score="scoresOfLooser.unitScore"
                :resource-scoure="scoresOfLooser.resourceScore"
                :unit-score-opponent="scoresOfWinner.unitScore"
                :resource-scoure-opponent="scoresOfWinner.resourceScore"
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

@Component({
  components: {
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

  get heroesOfWinner() {
    return this.scoresOfWinner.heroes;
  }

  get heroesOfLooser() {
    return this.scoresOfLooser.heroes;
  }

  get scoresOfWinner() {
    return this.$store.direct.state.matches.matchDetail.playerScores.filter(s =>
      this.match.teams[0].players[0].id.startsWith(s.battleTag.toLowerCase())
    )[0];
  }

  get scoresOfLooser() {
    return this.$store.direct.state.matches.matchDetail.playerScores.filter(s =>
      this.match.teams[1].players[0].id.startsWith(s.battleTag.toLowerCase())
    )[0];
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
