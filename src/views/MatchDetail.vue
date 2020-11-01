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
                <team-match-info
                  class="ma-1"
                  :big-race-icon="true"
                  :team="match.teams[1]"
                />
                <team-match-info
                  class="ma-1"
                  :big-race-icon="true"
                  :team="match.teams[2]"
                />
                <team-match-info
                  class="ma-1"
                  :big-race-icon="true"
                  :team="match.teams[3]"
                />
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
            v-for="(player, index) in scoresOfWinners"
            v-bind:key="index"
            :heroes-of-winner="scoresOfWinners[index].heroes"
            :heroes-of-looser="scoresOfLoosers[index].heroes"
            :scores-of-winner="scoresOfWinners[index].heroScore"
            :scores-of-looser="scoresOfLoosers[index].heroScore"
          />
          <match-detail-hero-row
            v-if="matchIsFFA && isCompleteGame"
            :not-color-winner="true"
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
            <v-col :cols="0"></v-col>
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
            <v-col cols="2" />
            <v-col>
              <v-row dense v-for="(label, index) in rowLabels" :key="label">
                <v-col>
                  {{ label }}
                </v-col>
                <v-col v-for="player in ffaPlayers" :key="player.battleTag">
                  <div v-if="index === 0">
                    {{ player.battleTag.split("#")[0] }}
                  </div>
                  <div v-if="index === 1">
                    {{ player.unitScore.unitsKilled }}
                  </div>
                  <div v-if="index === 2">
                    {{ player.unitScore.unitsProduced }}
                  </div>
                  <div v-if="index === 3">
                    {{ player.resourceScore.goldCollected }}
                  </div>
                  <div v-if="index === 4">
                    {{ player.resourceScore.lumberCollected }}
                  </div>
                  <div v-if="index === 5">
                    {{ player.resourceScore.goldUpkeepLost }}
                  </div>
                  <div v-if="index === 6">
                    {{ player.unitScore.largestArmy }}
                  </div>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="1" />
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import _keyBy from "lodash/keyBy";
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

  get rowLabels() {
    return [
      "",
      "Units killed",
      "Units produced",
      "Gold mined",
      "Lumber harvested",
      "Upkeep lost",
      "Largest army",
    ];
  }

  get ffaPlayers() {
    return [this.ffaWinner, ...this.ffaLoosers];
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

  get matchIsFFA() {
    return (
      this.$store.direct.state.matches.matchDetail.match.gameMode ===
      EGameMode.GM_FFA
    );
  }

  get isCompleteGame() {
    return this.$store.direct.state.matches.matchDetail.playerScores;
  }

  get scoresOfWinners() {
    const scoresOfWinners = this.$store.direct.state.matches.matchDetail.playerScores.filter(
      (s) =>
        this.match.teams[0].players.some((player) =>
          player.battleTag.startsWith(s.battleTag)
        )
    );
    const scoresOfWinnersByBattleTag = _keyBy(scoresOfWinners, "battleTag");

    return this.match.teams[0].players.map(
      (player) => scoresOfWinnersByBattleTag[player.battleTag]
    );
  }

  get scoresOfLoosers() {
    const scoresOfLoosers = this.$store.direct.state.matches.matchDetail.playerScores.filter(
      (s) =>
        this.match.teams[1].players.some((player) =>
          player.battleTag.startsWith(s.battleTag)
        )
    );
    const scoresOfLoosersByBattleTag = _keyBy(scoresOfLoosers, "battleTag");

    return this.match.teams[1].players.map(
      (player) => scoresOfLoosersByBattleTag[player.battleTag]
    );
  }

  get ffaWinner() {
    return this.$store.direct.state.matches.matchDetail.playerScores.find(
      (s) => s.battleTag === this.match.teams[0].players[0].battleTag
    );
  }

  get ffaLoosers() {
    return this.$store.direct.state.matches.matchDetail.playerScores.filter(
      (s) => s.battleTag !== this.match.teams[0].players[0].battleTag
    );
  }

  get ffaLooser1() {
    return this.$store.direct.state.matches.matchDetail.playerScores.find(
      (s) => s.battleTag === this.match.teams[1].players[0].battleTag
    );
  }

  get ffaLooser2() {
    return this.$store.direct.state.matches.matchDetail.playerScores.find(
      (s) => s.battleTag === this.match.teams[2].players[0].battleTag
    );
  }

  get ffaLooser3() {
    return this.$store.direct.state.matches.matchDetail.playerScores.find(
      (s) => s.battleTag === this.match.teams[3].players[0].battleTag
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
