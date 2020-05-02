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
            :heroes-of-looser="heroesOfLooser1"
            :heroes-of-winner="heroesOfWinner1"
            :scores-of-looser="scoresOfLooser1.heroScore"
            :scores-of-winner="scoresOfWinner1.heroScore"
          />
          <match-detail-hero-row
            v-if="matchIs2v2"
            :heroes-of-looser="heroesOfLooser2"
            :heroes-of-winner="heroesOfWinner2"
            :scores-of-looser="scoresOfLooser2.heroScore"
            :scores-of-winner="scoresOfWinner2.heroScore"
          />
          <v-row>
            <v-col cols="1"> </v-col>
            <v-col cols="5">
              <player-performance-on-match
                :unit-score="scoresOfWinner1.unitScore"
                :resource-scoure="scoresOfWinner1.resourceScore"
                :unit-score-opponent="scoresOfLooser1.unitScore"
                :resource-scoure-opponent="scoresOfLooser1.resourceScore"
                :left="true"
              />
            </v-col>
            <v-col cols="5">
              <player-performance-on-match
                :unit-score="scoresOfLooser1.unitScore"
                :resource-scoure="scoresOfLooser1.resourceScore"
                :unit-score-opponent="scoresOfWinner1.unitScore"
                :resource-scoure-opponent="scoresOfWinner1.resourceScore"
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
import {EGameMode} from "@/store/typings";

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

  get heroesOfWinner1() {
    return this.scoresOfWinner1.heroes;
  }

  get heroesOfWinner2() {
    return this.scoresOfWinner2.heroes;
  }

  get heroesOfLooser1() {
    return this.scoresOfLooser1.heroes;
  }

  get heroesOfLooser2() {
    return this.scoresOfLooser2.heroes;
  }

  get scoresOfWinner1() {
    return this.$store.direct.state.matches.matchDetail.playerScores.filter(s =>
      this.match.teams[0].players[0].id.startsWith(s.battleTag.toLowerCase())
    )[0];
  }

  get scoresOfWinner2() {
    return this.$store.direct.state.matches.matchDetail.playerScores.filter(s =>
      this.match.teams[0].players[1].id.startsWith(s.battleTag.toLowerCase())
    )[0];
  }

  get scoresOfLooser1() {
    return this.$store.direct.state.matches.matchDetail.playerScores.filter(s =>
      this.match.teams[1].players[0].id.startsWith(s.battleTag.toLowerCase())
    )[0];
  }

  get scoresOfLooser2() {
    return this.$store.direct.state.matches.matchDetail.playerScores.filter(s =>
      this.match.teams[1].players[1].id.startsWith(s.battleTag.toLowerCase())
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
