<template>
  <v-container class="profile">
    <div v-if="isJubileeGame" class="jubilee"></div>
    <v-row v-if="!loading">
      <v-col cols="12">
        <v-card tile>
          <v-card-title class="justify-center">
            <v-row justify="space-around">
              <v-col cols="1" class="pl-0 pr-0">
                <v-card-subtitle class="pa-0">
                  {{ $t(`gatewayNames.${gateWay}`) }}
                  <br />
                  {{ $t(`views_matchdetail.season`) }}: {{ season }}
                </v-card-subtitle>
                <host-icon v-if="match.serverInfo && match.serverInfo.provider" :host="match.serverInfo"
                  style="padding-right: 0px"></host-icon>
              </v-col>
              <v-col cols="4" v-if="!matchIsFFA()">
                <team-match-info :big-race-icon="true" :left="true" :team="match.teams[0]" />
              </v-col>
              <v-col cols="1" class="text-center">
                <span v-if="!matchIsFFA()">{{ $t(`views_matchdetail.vs`) }}</span>
              </v-col>
              <v-col v-if="!matchIsFFA()" cols="4">
                <team-match-info :big-race-icon="true" :team="match.teams[1]" />
              </v-col>
              <v-col v-if="matchIsFFA()" cols="6">
                <team-match-info class="ma-1" :big-race-icon="true" :team="match.teams[0]" />
                <team-match-info class="ma-1" :big-race-icon="true" :team="match.teams[1]" />
                <team-match-info class="ma-1" :big-race-icon="true" :team="match.teams[2]" />
                <team-match-info class="ma-1" :big-race-icon="true" :team="match.teams[3]" />
              </v-col>
              <v-col cols="1" />
              <div class="subicon">
                <download-replay-icon :gameId="matchId" />
              </div>
            </v-row>
          </v-card-title>
          <v-card-title v-if="isJubileeGame" class="justify-center">
            {{ $t(`views_matchdetail.jubileeGameNumber`, { gameNumber }) }}
          </v-card-title>
          <v-card-title v-if="isJubileeGame" class="justify-center">
            {{ $t(`views_matchdetail.jubileeGameMessage`) }}
          </v-card-title>
          <v-card-title class="justify-center small-title">
            <v-card-subtitle>
              {{ $_mapNameFromMatch(match) }} ({{ matchDuration }})
              {{ playedDate }}
            </v-card-subtitle>
          </v-card-title>
          <div v-if="isCompleteGame">
            <match-detail-hero-row v-for="(player, index) in scoresOfWinners" v-bind:key="index" :heroes-of-winner="
              !!scoresOfWinners[index] ? scoresOfWinners[index]?.heroes : []
            " :heroes-of-looser="
  !!scoresOfLoosers[index] ? scoresOfLoosers[index]?.heroes : []
" :scores-of-winner="
  !!scoresOfWinners[index] ? scoresOfWinners[index]?.heroScore : []
" :scores-of-looser="
  !!scoresOfLoosers[index] ? scoresOfLoosers[index]?.heroScore : []
" />
          </div>
          <match-detail-hero-row v-if="matchIsFFA() && isCompleteGame" :not-color-winner="true"
            :heroes-of-winner="!!ffaLooser2?.heroes ? ffaLooser2?.heroes : []"
            :heroes-of-looser="!!ffaLooser3?.heroes ? ffaLooser3?.heroes : []" :scores-of-winner="
              !!ffaLooser2?.heroScore ? ffaLooser2?.heroScore : []
            " :scores-of-looser="
  !!ffaLooser3?.heroScore ? ffaLooser3?.heroScore : []
" />
          <v-row v-if="!isCompleteGame" class="justify-center">
            <v-card-subtitle>
              {{ $t(`views_matchdetail.incompletedata`) }}
            </v-card-subtitle>
          </v-row>
          <v-row v-if="isCompleteGame && !matchIsFFA()" class="justify-center">
            <v-col cols="5" class="mr-7">
              <player-performance-on-match class="mt-4" :unit-score="
                scoresOfWinners.map((h) => (!!h ? h.unitScore : []))
              " :resource-scoure="
  scoresOfWinners.map((h) => (!!h ? h.resourceScore : []))
" :unit-score-opponent="
  scoresOfLoosers.map((h) => (!!h ? h.unitScore : []))
" :resource-scoure-opponent="
  scoresOfLoosers.map((h) => (!!h ? h.resourceScore : []))
" :left="true" />
            </v-col>
            <v-col cols="5" class="ml-7">
              <player-performance-on-match :unit-score="
                scoresOfLoosers.map((h) => (!!h ? h.unitScore : []))
              " :resource-scoure="
  scoresOfLoosers.map((h) => (!!h ? h.resourceScore : []))
" :unit-score-opponent="
  scoresOfWinners.map((h) => (!!h ? h.unitScore : []))
" :resource-scoure-opponent="
  scoresOfWinners.map((h) => (!!h ? h.resourceScore : []))
" />
            </v-col>
          </v-row>
          <v-row class="mb-3" v-if="isCompleteGame && matchIsFFA()">
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
import { Component, Mixins, Prop, Watch } from "vue-property-decorator";
import _keyBy from "lodash/keyBy";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import moment from "moment";
import MatchHiglights from "@/components/match-details/MatchHiglights.vue";
import HeroIcon from "@/components/match-details/HeroIcon.vue";
import PlayerPerformanceOnMatch from "@/components/match-details/PlayerPerformanceOnMatch.vue";
import MatchDetailHeroRow from "@/components/match-details/MatchDetailHeroRow.vue";
import { EGameMode, PlayerScore, Team } from "@/store/typings";
import { Gateways } from "@/store/ranking/types";
import HostIcon from "@/components/matches/HostIcon.vue";
import MatchMixin from "@/mixins/MatchMixin";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";

@Component({
  components: {
    MatchDetailHeroRow,
    PlayerPerformanceOnMatch,
    HeroIcon,
    MatchHiglights,
    TeamMatchInfo,
    HostIcon,
    DownloadReplayIcon,
  },
})
export default class MatchDetailView extends Mixins(MatchMixin) {
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

  get isJubileeGame() {
    if (!this.match?.number) {
      return false;
    }

    return this.match.number !== 0 && this.match?.number % 1000000 === 0;
  }

  get gameNumber() {
    const number = this.match.number / 1000000;
    switch (number) {
      case 1:
        return "one";
      case 2:
        return "two";
      case 3:
        return "three";
      case 4:
        return "four";
      case 5:
        return "five";
      case 6:
        return "six";
      case 7:
        return "seven";
      case 8:
        return "eight";
      case 9:
        return "nine";
      default:
        return "bazillion";
    }
  }

  get gateWay() {
    return Gateways[this.$store.direct.state.matches.matchDetail.match.gateWay];
  }

  get season() {
    return this.$store.direct.state.matches.matchDetail.match.season ?? 1;
  }

  matchIsFFA() {
    const ffaModes = [
      EGameMode.GM_FFA, EGameMode.GM_SC_FFA_4
    ];

    return ffaModes.includes(this.$store.direct.state.matches.matchDetail.match.gameMode);

  }

  get isCompleteGame() {
    return this.$store.direct.state.matches.matchDetail.playerScores;
  }

  get playerScores() {
    const {
      playerScores,
      match,
    } = this.$store.direct.state.matches.matchDetail;
    if (this.matchIsFFA()) {
      const ffaMappedPlayerScores = playerScores.map((playerScore) => {
        const battleTag = match.serverInfo.playerServerInfos[playerScore.teamIndex].battleTag;
        return {
          ...playerScore,
          battleTag,
        };
      });
      this.$store.direct.dispatch.matches.setPlayerScores(ffaMappedPlayerScores);
      return ffaMappedPlayerScores ?? [];
    }
    return playerScores ?? [];
  }

  get scoresOfWinners() {
    const winningTeam = this.match.teams[0];
    return this.getPlayerScores(winningTeam);
  }

  get scoresOfLoosers() {
    const losingTeam = this.match.teams[1];
    return this.getPlayerScores(losingTeam);
  }

  get ffaWinner() {
    return this.playerScores.find(
      (s) => s.battleTag === this.match.teams[0].players[0].battleTag
    );
  }

  get ffaLoosers() {
    return this.playerScores.filter(
      (s) => s.battleTag !== this.match.teams[0].players[0].battleTag
    );
  }

  get ffaLooser1() {
    return this.playerScores.find(
      (s) => s.battleTag === this.match.teams[1].players[0].battleTag
    );
  }

  get ffaLooser2() {
    return this.playerScores.find(
      (s) => s.battleTag === this.match.teams[2].players[0].battleTag
    );
  }

  get ffaLooser3() {
    return this.playerScores.find(
      (s) => s.battleTag === this.match.teams[3].players[0].battleTag
    );
  }

  get loading() {
    return this.$store.direct.state.matches.loadingMatchDetail;
  }

  private async init() {
    await this.$store.direct.dispatch.matches.loadMatchDetail(this.matchId);
  }

  private getPlayerScores(team: Team): PlayerScore[] {
    const scores: PlayerScore[] = this.playerScores
      .filter((s) =>
        team.players.some(
          (player) =>
            player.battleTag.startsWith(s.battleTag) ||
            s.battleTag
              .toLowerCase()
              .includes(player.battleTag.toLowerCase().split("#", 1)[0])
        )
      )
      .map((s) => {
        // Use the battleTag from the Player record
        // since it is sometimes incorrect on the PlayerScore record
        const matchedPlayer = team.players.find((p) =>
          s.battleTag
            .toLowerCase()
            .includes(p.battleTag.toLowerCase().split("#", 1)[0])
        );
        return {
          ...s,
          battleTag: matchedPlayer?.battleTag ?? "",
        };
      });

    const playerScoreDictionary = _keyBy(scores, "battleTag");

    return team.players.map(
      (player) => playerScoreDictionary[player.battleTag]
    );
  }
}
</script>

<style type="text/css" scoped>
.small-title {
  margin-top: -30px !important;
  margin-bottom: -25px !important;
}

.jubilee {
  position: absolute;
  width: 80%;
  height: 80%;
  left: 10%;
  z-index: 100;
  background-image: url("../assets/giphy.gif") !important;
  background-size: cover !important;
}

.subicon {
  display: block;
  position: absolute;
  right: 1%;
}
</style>
