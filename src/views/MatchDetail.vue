<template>
  <v-container class="profile">
    <div v-if="isJubileeGame" class="jubilee"></div>
    <v-row v-if="!loading">
      <v-col cols="12">
        <v-card tile class="pb-5">
          <v-card-title class="justify-center">
            <v-row justify="space-around">
              <v-col cols="1" class="pl-0 pr-0">
                <v-card-subtitle class="pa-0">
                  {{ $t(`gatewayNames.${gateWay}`) }}
                  <br />
                  {{ $t(`views_matchdetail.season`) }}: {{ season }}
                </v-card-subtitle>
                <host-icon
                  v-if="match.serverInfo && match.serverInfo.provider"
                  :host="match.serverInfo"
                  style="padding-right: 0px"
                ></host-icon>
              </v-col>
              <v-col cols="4" v-if="!matchIsFFA" align-self="center">
                <team-match-info
                  :big-race-icon="true"
                  :left="true"
                  :team="match.teams[0]"
                />
              </v-col>
              <v-col cols="1" class="text-center" align-self="center" >
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
              <div class="subicon">
                <download-replay-icon :gameId="matchId"/>
              </div>
            </v-row>
          </v-card-title>
          <v-card-title v-if="isJubileeGame" class="justify-center">
            {{ $t(`views_matchdetail.jubileeGameNumber`, { gameNumber }) }}
          </v-card-title>
          <v-card-title v-if="isJubileeGame" class="justify-center">
            {{ $t(`views_matchdetail.jubileeGameMessage`) }}
          </v-card-title>
          <v-card-title class="justify-center">{{ `${mapNameFromMatch(match)} (${matchDuration}) | ${playedDate}` }}</v-card-title>
          <div v-if="isCompleteGame">
            <match-detail-hero-row
              v-for="(player, index) in scoresOfWinners"
              v-bind:key="index"
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
          <v-row  v-if="isCompleteGame && !matchIsFFA" class="justify-center">
            <v-col cols="5" class="mr-7">
              <player-performance-on-match class="mt-4"
                :unit-score="scoresOfWinners.map((h) => h.unitScore)"
                :resource-score="scoresOfWinners.map((h) => h.resourceScore)"
                :unit-score-opponent="scoresOfLosers.map((h) => h.unitScore)"
                :resource-score-opponent="scoresOfLosers.map((h) => h.resourceScore)"
                :left="true"
              />
            </v-col>
            <v-col cols="5" class="ml-7">
              <player-performance-on-match class="mt-4"
                :unit-score="scoresOfLosers.map((h) => h.unitScore)"
                :resource-score="scoresOfLosers.map((h) => (h.resourceScore))"
                :unit-score-opponent="scoresOfWinners.map((h) => h.unitScore)"
                :resource-score-opponent="scoresOfWinners.map((h) => h.resourceScore)"
              />
            </v-col>
          </v-row>
          <v-row class="mb-3" v-if="isCompleteGame && matchIsFFA">
            <v-col cols="2" />
            <v-col>
              <v-row dense v-for="(label, index) in rowLabels" :key="label">
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
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from "vue";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import PlayerPerformanceOnMatch from "@/components/match-details/PlayerPerformanceOnMatch.vue";
import MatchDetailHeroRow from "@/components/match-details/MatchDetailHeroRow.vue";
import { EGameMode, Match, PlayerScore, Team } from "@/store/types";
import { Gateways } from "@/store/ranking/types";
import HostIcon from "@/components/matches/HostIcon.vue";
import { mapNameFromMatch } from "@/mixins/MatchMixin";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";
import { formatSecondsToDuration, formatTimestampStringToDateTime } from "@/helpers/date-functions";
import { useMatchStore } from "@/store/match/store";
import _keyBy from "lodash/keyBy";
import { battleTagToName } from "@/helpers/profile";

export default defineComponent({
  name: "MatchDetailView",
  components: {
    MatchDetailHeroRow,
    PlayerPerformanceOnMatch,
    TeamMatchInfo,
    HostIcon,
    DownloadReplayIcon,
  },
  props: {
    matchId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const matchStore = useMatchStore();

    // const matchIdRef = ref<string>(props.matchId);

    const match = computed<Match>(() => matchStore.matchDetail.match);
    const matchDuration = computed<string>(() => formatSecondsToDuration(match.value.durationInSeconds));
    const playedDate = computed<string>(() => formatTimestampStringToDateTime(match.value.startTime));
    const ffaPlayers = computed<PlayerScore[]>(() => [ffaWinner.value, ...ffaLosers.value]);
    const gateWay = computed<string>(() => Gateways[matchStore.matchDetail.match.gateWay]);
    const season = computed<number>(() => matchStore.matchDetail.match.season ?? 1);
    const isCompleteGame = computed<PlayerScore[]>(() => matchStore.matchDetail.playerScores);
    const loading = computed<boolean>(() => matchStore.loadingMatchDetail);

    const matchIsFFA = computed<boolean>(() => {
      const ffaModes = [EGameMode.GM_FFA, EGameMode.GM_SC_FFA_4, EGameMode.GM_SC_OZ];
      return ffaModes.includes(matchStore.matchDetail.match.gameMode);
    });

    const isJubileeGame = computed<boolean>(() => {
      if (!match.value?.number) return false;
      return match.value.number !== 0 && match.value?.number % 1000000 === 0;
    });

    const playerScores = computed<PlayerScore[]>(() => {
      const { playerScores, match } = matchStore.matchDetail;
      if (matchIsFFA.value) {
        const ffaMappedPlayerScores = playerScores.map((playerScore) => {
          const battleTag = match.serverInfo.playerServerInfos[playerScore.teamIndex].battleTag;
          return {
            ...playerScore,
            battleTag,
          };
        });
        matchStore.setPlayerScores(ffaMappedPlayerScores);
        return ffaMappedPlayerScores ?? [];
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

    const ffaLoser1 = computed<PlayerScore>(() => playerScores.value.find(
      (s) => s.battleTag === match.value.teams[1].players[0].battleTag
    )!);

    const ffaLoser2 = computed<PlayerScore>(() => playerScores.value.find(
      (s) => s.battleTag === match.value.teams[2].players[0].battleTag
    )!);

    const ffaLoser3 = computed<PlayerScore>(() => playerScores.value.find(
      (s) => s.battleTag === match.value.teams[3].players[0].battleTag
    )!);

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
      const scores: PlayerScore[] = playerScores.value
        .map((playerScore) => {
          // Use the battleTag from the Match record, since it is sometimes incorrect on the PlayerScore record
          const matchedPlayer = team.players.find((p) =>
            playerScore.battleTag
              .toLowerCase()
              .includes(p.battleTag.toLowerCase().split("#", 1)[0]) ||
              p.inviteName && p.inviteName === playerScore.battleTag
          );
          return {
            ...playerScore,
            battleTag: matchedPlayer?.battleTag ?? "",
          };
        });

      const playerScoreDictionary = _keyBy(scores, "battleTag");

      return team.players.map(
        (player) => playerScoreDictionary[player.battleTag]
      );
    }

    // watch(matchIdRef, init);

    onMounted((): void => {
      init();
    });

    async function init(): Promise<void> {
      await matchStore.loadMatchDetail(props.matchId);
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
      loading,
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
      ffaLoser1,
      ffaLoser2,
      ffaLoser3,
      rowLabels,
      ffaPlayers,
      battleTagToName
    };
  },
});
</script>

<style lang="scss" scoped>
.small-title {
  margin-top: -25px !important;
  margin-bottom: -25px !important;
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
