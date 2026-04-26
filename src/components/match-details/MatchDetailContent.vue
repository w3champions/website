<template>
  <div class="match-detail-content">
    <div v-if="isJubileeGame" class="jubilee"></div>
    <v-card tile class="pb-5 pt-1">
      <v-card-title class="justify-center">
        <v-row justify="space-around">
          <v-col cols="1" class="pl-0 pr-0">
            <v-card-subtitle class="pa-0 text-uppercase opacity-100">
              <div>{{ $t(`gatewayNames.${gateWay}`) }}</div>
              <div>{{ $t(`views_matchdetail.season`) }}: {{ season }}</div>
            </v-card-subtitle>
            <host-icon
              v-if="match.serverInfo && match.serverInfo.provider"
              :host="match.serverInfo"
              style="padding-right: 0px"
            />
          </v-col>
          <v-col v-if="!matchIsFFA" cols="4" align-self="center">
            <team-match-info
              :big-race-icon="true"
              :left="true"
              :team="match.teams[0]"
            />
          </v-col>
          <v-col cols="1" class="text-center" align-self="center">
            <span v-if="!matchIsFFA">{{ $t(`views_matchdetail.vs`) }}</span>
          </v-col>
          <v-col v-if="!matchIsFFA" cols="4" align-self="center">
            <team-match-info :big-race-icon="true" :team="match.teams[1]" />
          </v-col>
          <v-col v-if="matchIsFFA" cols="6" align-self="center">
            <team-match-info
              class="ma-1"
              :big-race-icon="true"
              :team="match.teams[0]"
            />
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
          <div v-if="showReplayDownload" class="subicon">
            <download-replay-icon :gameId="matchId" />
          </div>
        </v-row>
      </v-card-title>
      <div class="pb-2">
        <v-card-title v-if="isJubileeGame" class="d-flex justify-center">
          {{ $t(`views_matchdetail.jubileeGameNumber`, { gameNumber }) }}
        </v-card-title>
        <v-card-title v-if="isJubileeGame" class="d-flex justify-center">
          {{ $t(`views_matchdetail.jubileeGameMessage`) }}
        </v-card-title>
        <v-card-title class="d-flex justify-center">
          {{ `${mapNameFromMatch(match)} (${matchDuration}) | ${playedDate}` }}
        </v-card-title>
      </div>
      <div v-if="isCompleteGame">
        <match-detail-hero-row
          v-for="(player, index) in scoresOfWinners"
          :key="index"
          :heroes-of-winner="scoresOfWinners[index]?.heroes"
          :heroes-of-loser="scoresOfLosers[index]?.heroes"
          :scores-of-winner="scoresOfWinners[index]?.heroScore"
          :scores-of-loser="scoresOfLosers[index]?.heroScore"
        />
      </div>
      <match-detail-hero-row
        v-if="matchIsFFA && isCompleteGame"
        :not-color-winner="true"
        :heroes-of-winner="ffaLoser2?.heroes"
        :heroes-of-loser="ffaLoser3?.heroes"
        :scores-of-winner="ffaLoser2?.heroScore"
        :scores-of-loser="ffaLoser3?.heroScore"
      />
      <v-row v-if="!isCompleteGame" class="justify-center">
        <v-card-subtitle>
          {{ $t(`views_matchdetail.incompletedata`) }}
        </v-card-subtitle>
      </v-row>
      <v-row v-if="isCompleteGame && !matchIsFFA" class="justify-center">
        <v-col cols="5" class="mr-7">
          <player-performance-on-match
            class="mt-4"
            :unit-score="scoresOfWinners.map((h) => h.unitScore)"
            :resource-score="scoresOfWinners.map((h) => h.resourceScore)"
            :unit-score-opponent="scoresOfLosers.map((h) => h.unitScore)"
            :resource-score-opponent="scoresOfLosers.map((h) => h.resourceScore)"
            :left="true"
          />
        </v-col>
        <v-col cols="5" class="ml-7">
          <player-performance-on-match
            class="mt-4"
            :unit-score="scoresOfLosers.map((h) => h.unitScore)"
            :resource-score="scoresOfLosers.map((h) => (h.resourceScore))"
            :unit-score-opponent="scoresOfWinners.map((h) => h.unitScore)"
            :resource-score-opponent="scoresOfWinners.map((h) => h.resourceScore)"
          />
        </v-col>
      </v-row>
      <v-row v-if="isCompleteGame && matchIsFFA" class="mb-3">
        <v-col cols="2" />
        <v-col>
          <v-row v-for="(label, index) in rowLabels" :key="label" dense>
            <v-col>
              {{ label }}
            </v-col>
            <v-col v-for="player in ffaPlayers" :key="player?.battleTag">
              <div v-if="index === 0">
                {{ battleTagToName(player?.battleTag) }}
              </div>
              <div v-if="index === 1">
                {{ player?.unitScore.unitsKilled }}
              </div>
              <div v-if="index === 2">
                {{ player?.unitScore.unitsProduced }}
              </div>
              <div v-if="index === 3">
                {{ player?.resourceScore.goldCollected }}
              </div>
              <div v-if="index === 4">
                {{ player?.resourceScore.lumberCollected }}
              </div>
              <div v-if="index === 5">
                {{ player?.resourceScore.goldUpkeepLost }}
              </div>
              <div v-if="index === 6">
                {{ player?.unitScore.largestArmy }}
              </div>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="1" />
      </v-row>
    </v-card>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import PlayerPerformanceOnMatch from "@/components/match-details/PlayerPerformanceOnMatch.vue";
import MatchDetailHeroRow from "@/components/match-details/MatchDetailHeroRow.vue";
import { Match, MatchDetail, PlayerInTeam, PlayerScore, Team } from "@/store/types";
import { Gateways } from "@/store/ranking/types";
import HostIcon from "@/components/matches/HostIcon.vue";
import { mapNameFromMatch } from "@/composables/MatchMixin";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";
import { formatSecondsToDuration, formatTimestampStringToDateTime } from "@/helpers/date-functions";
import { battleTagToName } from "@/helpers/profile";
import { GAME_MODES_FFA } from "@/store/constants";

export default defineComponent({
  name: "MatchDetailContent",
  components: {
    MatchDetailHeroRow,
    PlayerPerformanceOnMatch,
    TeamMatchInfo,
    HostIcon,
    DownloadReplayIcon,
  },
  props: {
    matchDetail: {
      type: Object as PropType<MatchDetail>,
      required: true,
    },
    matchId: {
      type: String,
      required: true,
    },
    showReplayDownload: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props) {
    const match = computed<Match>(() => props.matchDetail.match);
    const matchDuration = computed<string>(() => formatSecondsToDuration(match.value.durationInSeconds));
    const playedDate = computed<string>(() => formatTimestampStringToDateTime(match.value.startTime));
    const gateWay = computed<string>(() => Gateways[match.value.gateWay]);
    const season = computed<number>(() => match.value.season ?? 1);
    const isCompleteGame = computed<PlayerScore[]>(() => props.matchDetail.playerScores);

    const matchIsFFA = computed<boolean>(() => {
      return GAME_MODES_FFA.includes(match.value.gameMode);
    });

    const isJubileeGame = computed<boolean>(() => {
      if (!match.value?.number) return false;
      return match.value.number !== 0 && match.value?.number % 1000000 === 0;
    });

    const playerScores = computed<PlayerScore[]>(() => {
      const { playerScores, match } = props.matchDetail;
      if (matchIsFFA.value) {
        return playerScores.map((playerScore) => {
          const battleTag = match.serverInfo.playerServerInfos[playerScore.teamIndex].battleTag;
          return {
            ...playerScore,
            battleTag,
          };
        });
      }
      return playerScores ?? [];
    });

    const scoresOfWinners = computed<PlayerScore[]>(() => {
      const winningTeam = match.value.teams[0];
      return getPlayerScores(winningTeam);
    });

    const scoresOfLosers = computed<PlayerScore[]>(() => {
      const losingTeam = match.value.teams[1];
      return getPlayerScores(losingTeam);
    });

    const ffaWinner = computed<PlayerScore>(() => playerScores.value.find(
      (s) => s.battleTag === match.value.teams[0].players[0].battleTag
    )!);

    const ffaLosers = computed<PlayerScore[]>(() => playerScores.value.filter(
      (s) => s.battleTag !== match.value.teams[0].players[0].battleTag
    ));

    const ffaLoser2 = computed<PlayerScore>(() => playerScores.value.find(
      (s) => s.battleTag === match.value.teams[2].players[0].battleTag
    )!);

    const ffaLoser3 = computed<PlayerScore>(() => playerScores.value.find(
      (s) => s.battleTag === match.value.teams[3].players[0].battleTag
    )!);

    const ffaPlayers = computed<PlayerScore[]>(() => [ffaWinner.value, ...ffaLosers.value]);

    const gameNumber = computed<string>(() => {
      const number = match.value.number / 1000000;
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
    });

    function getPlayerScores(team: Team): PlayerScore[] {
      return team.players.map((p: PlayerInTeam) => {
        const playerInTeamBattleTag = p.battleTag.toLowerCase();
        const score = playerScores.value.find((score) => score.battleTag.toLowerCase() === playerInTeamBattleTag) ||
          playerScores.value.find((score) => score.battleTag.toLowerCase().includes(playerInTeamBattleTag.split("#", 1)[0])) ||
          playerScores.value.find((score) => score.battleTag === p.inviteName);

        return {
          ...score ?? {} as PlayerScore,
          battleTag: p.battleTag,
        };
      });
    }

    const rowLabels = [
      "",
      "Units killed",
      "Units produced",
      "Gold mined",
      "Lumber harvested",
      "Upkeep lost",
      "Largest army",
    ];

    return {
      mapNameFromMatch,
      isJubileeGame,
      gateWay,
      season,
      match,
      matchIsFFA,
      gameNumber,
      matchDuration,
      playedDate,
      isCompleteGame,
      scoresOfWinners,
      scoresOfLosers,
      ffaLoser2,
      ffaLoser3,
      rowLabels,
      ffaPlayers,
      battleTagToName,
    };
  },
});
</script>

<style lang="scss" scoped>
.match-detail-content {
  position: relative;
}

.jubilee {
  position: absolute;
  width: 80%;
  height: 80%;
  left: 10%;
  z-index: 100;
  background-image: url("/assets/giphy.gif") !important;
  background-size: cover !important;
}

.subicon {
  display: block;
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>
