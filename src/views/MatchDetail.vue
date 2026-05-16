<template>
  <v-container class="w3-container-width">
    <div v-if="isJubileeGame" class="jubilee"></div>
    <v-row v-if="loading">
      <v-col cols="12">
        <v-card tile class="d-flex justify-center align-center py-10">
          <v-progress-circular indeterminate color="primary" size="40" />
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12">
        <v-card tile class="pb-5 pt-1">
          <div v-if="isOneVsOne && !loading" class="ovo-header">
            <div class="ovo-season-bar">
              <v-card-subtitle class="pa-0 text-uppercase opacity-100">
                <span v-if="isGatewayNeeded">{{ $t(`gatewayNames.${gateWay}`) }} · </span>
                <span>{{ $t(`views_matchdetail.season`) }}: {{ season }}</span>
              </v-card-subtitle>
              <host-icon
                v-if="match.serverInfo && match.serverInfo.provider"
                :host="match.serverInfo"
                style="padding-right: 0px"
              />
              <div class="subicon">
                <download-replay-icon :gameId="matchId" />
                <v-tooltip
                  v-if="showChatLogShortcut"
                  location="left"
                  content-class="w3-tooltip elevation-1"
                >
                  <template v-slot:activator="{ props: activatorProps }">
                    <span v-bind="activatorProps">
                      <v-btn
                        class="ma-2 w3-gray-gold-text"
                        icon
                        variant="outlined"
                        size="small"
                        @click="openChatLogDialog"
                      >
                        <v-icon size="x-large">{{ mdiChatProcessingOutline }}</v-icon>
                      </v-btn>
                    </span>
                  </template>
                  <span>View Chat Log</span>
                </v-tooltip>
              </div>
            </div>
            <div class="ovo-player-names">
              <div class="ovo-name ovo-name--left">
                <country-flag-extended
                  v-if="match.teams[0].players[0].countryCode || match.teams[0].players[0].location"
                  :countryCode="match.teams[0].players[0].countryCode"
                  :location="match.teams[0].players[0].location"
                  class="mr-2"
                />
                <a class="text-primary cursor-pointer" @click="goToPlayer(match.teams[0].players[0].battleTag)">
                  {{ match.teams[0].players[0].name }}
                </a>
              </div>
              <player-icon :race="match.teams[0].players[0].race" :rndRace="match.teams[0].players[0].rndRace" :big="true" />
              <div class="ovo-vs">VS</div>
              <player-icon :race="match.teams[1].players[0].race" :rndRace="match.teams[1].players[0].rndRace" :big="true" />
              <div class="ovo-name ovo-name--right">
                <a class="text-primary cursor-pointer" @click="goToPlayer(match.teams[1].players[0].battleTag)">
                  {{ match.teams[1].players[0].name }}
                </a>
                <country-flag-extended
                  v-if="match.teams[1].players[0].countryCode || match.teams[1].players[0].location"
                  :countryCode="match.teams[1].players[0].countryCode"
                  :location="match.teams[1].players[0].location"
                  class="ml-2"
                />
              </div>
            </div>
            <div class="ovo-mmr-row">
              <div class="ovo-mmr ovo-mmr--left">
                <template v-if="match.teams[0].players[0].oldMmr">
                  {{ Math.floor(match.teams[0].players[0].oldMmr) }}
                  <span class="ovo-mmr-label">MMR</span>
                  <span v-if="mmrChangePlayer1 !== 0" class="number-text" :class="match.teams[0].players[0].won ? 'w3-won' : 'w3-lost'">
                    ({{ mmrChangePlayer1 > 0 ? '+' : '' }}{{ mmrChangePlayer1 }})
                  </span>
                </template>
                <template v-else>{{ $t("components_matches_playermatchinfo.calibrating") }}</template>
              </div>
              <div></div>
              <div class="ovo-winner-icon">
                <span v-if="match.teams[0].players[0].won" class="ovo-crown">👑</span>
                <span v-if="match.teams[1].players[0].won" class="ovo-crown">👑</span>
              </div>
              <div></div>
              <div class="ovo-mmr ovo-mmr--right">
                <template v-if="match.teams[1].players[0].oldMmr">
                  {{ Math.floor(match.teams[1].players[0].oldMmr) }}
                  <span class="ovo-mmr-label">MMR</span>
                  <span v-if="mmrChangePlayer2 !== 0" class="number-text" :class="match.teams[1].players[0].won ? 'w3-won' : 'w3-lost'">
                    ({{ mmrChangePlayer2 > 0 ? '+' : '' }}{{ mmrChangePlayer2 }})
                  </span>
                </template>
                <template v-else>{{ $t("components_matches_playermatchinfo.calibrating") }}</template>
              </div>
            </div>
          </div>
          <div v-if="isCompleteGame && isOneVsOne">
            <match-detail-hero-row
              :heroes-of-winner="scoresOfWinners[0]?.heroes"
              :heroes-of-loser="scoresOfLosers[0]?.heroes"
              :scores-of-winner="scoresOfWinners[0]?.heroScore"
              :scores-of-loser="scoresOfLosers[0]?.heroScore"
              :unit-score-winner="scoresOfWinners[0]?.unitScore"
              :unit-score-loser="scoresOfLosers[0]?.unitScore"
              :resource-score-winner="scoresOfWinners[0]?.resourceScore"
              :resource-score-loser="scoresOfLosers[0]?.resourceScore"
              :duration-minutes="match.durationInSeconds / 60"
            />
            <div class="ovo-map-stats">
              <div><span class="ovo-mmr-label">Map:</span> {{ mapNameFromMatch(match) }}</div>
              <div><span class="ovo-mmr-label">Duration:</span> {{ gameDurationLong }}</div>
              <div><span class="ovo-mmr-label">Start time:</span> {{ gameStartTime }}</div>
            </div>
          </div>
          <div v-else-if="!loading">
            <v-card-title class="justify-center">
              <v-row justify="space-around">
                <v-col cols="1" class="pl-0 pr-0">
                  <v-card-subtitle class="pa-0 text-uppercase opacity-100">
                    <div v-if="isGatewayNeeded">{{ $t(`gatewayNames.${gateWay}`) }}</div>
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
                  <team-match-info class="ma-1" :big-race-icon="true" :team="match.teams[0]" />
                  <team-match-info class="ma-1" :big-race-icon="true" :team="match.teams[1]" />
                  <team-match-info class="ma-1" :big-race-icon="true" :team="match.teams[2]" />
                  <team-match-info class="ma-1" :big-race-icon="true" :team="match.teams[3]" />
                </v-col>
                <v-col cols="1" />
                <div class="subicon">
                  <download-replay-icon :gameId="matchId" />
                  <v-tooltip
                    v-if="showChatLogShortcut"
                    location="left"
                    content-class="w3-tooltip elevation-1"
                  >
                    <template v-slot:activator="{ props: activatorProps }">
                      <span v-bind="activatorProps">
                        <v-btn
                          class="ma-2 w3-gray-gold-text"
                          icon
                          variant="outlined"
                          size="small"
                          @click="openChatLogDialog"
                        >
                          <v-icon size="x-large">{{ mdiChatProcessingOutline }}</v-icon>
                        </v-btn>
                      </span>
                    </template>
                    <span>View Chat Log</span>
                  </v-tooltip>
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
          </div>
          <div v-else-if="isCompleteGame && !matchIsFFA">
            <match-detail-hero-row
              v-for="(player, index) in scoresOfWinners"
              :key="index"
              :heroes-of-winner="scoresOfWinners[index]?.heroes"
              :heroes-of-loser="scoresOfLosers[index]?.heroes"
              :scores-of-winner="scoresOfWinners[index]?.heroScore"
              :scores-of-loser="scoresOfLosers[index]?.heroScore"
            />
            <v-row class="justify-center">
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
          </div>
          <div v-else-if="isCompleteGame && matchIsFFA">
            <match-detail-hero-row
              v-for="(player, index) in scoresOfWinners"
              :key="index"
              :heroes-of-winner="scoresOfWinners[index]?.heroes"
              :heroes-of-loser="scoresOfLosers[index]?.heroes"
              :scores-of-winner="scoresOfWinners[index]?.heroScore"
              :scores-of-loser="scoresOfLosers[index]?.heroScore"
            />
            <match-detail-hero-row
              :not-color-winner="true"
              :heroes-of-winner="ffaLoser2?.heroes"
              :heroes-of-loser="ffaLoser3?.heroes"
              :scores-of-winner="ffaLoser2?.heroScore"
              :scores-of-loser="ffaLoser3?.heroScore"
            />
          </div>
          <v-row v-if="!isCompleteGame" class="justify-center">
            <v-card-subtitle>
              {{ $t(`views_matchdetail.incompletedata`) }}
            </v-card-subtitle>
          </v-row>
          <match-head-to-head
            v-if="isCompleteGame && isOneVsOne && !previewMode"
            :player-battle-tag="playerBattleTag"
            :opponent-battle-tag="opponentBattleTag"
            :current-match-id="matchId"
            :season="season"
            :gateway="match.gateWay"
            :game-mode="match.gameMode"
          />
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

        <v-dialog v-model="chatLogDialog" width="1500">
          <v-card>
            <admin-replay-chat-log-messages v-if="chatLogDialog" :matchId="matchId" />
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch, toRef } from "vue";
import { useRouter } from "vue-router";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import PlayerPerformanceOnMatch from "@/components/match-details/PlayerPerformanceOnMatch.vue";
import MatchDetailHeroRow from "@/components/match-details/MatchDetailHeroRow.vue";
import { Match, PlayerInTeam, PlayerScore, Team } from "@/store/types";
import { Gateways } from "@/store/ranking/types";
import HostIcon from "@/components/matches/HostIcon.vue";
import { mapNameFromMatch } from "@/composables/MatchMixin";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";
import MatchHeadToHead from "@/components/match-details/MatchHeadToHead.vue";
import { formatSecondsToDuration, formatTimestampStringToDateTime } from "@/helpers/date-functions";
import { formatDuration, intervalToDuration } from "date-fns";
import { useMatchStore } from "@/store/match/store";
import { isGatewayNeededForSeason } from "@/constants";
import { battleTagToName } from "@/helpers/profile";
import { GAME_MODES_FFA } from "@/store/constants";
import { useOauthStore } from "@/store/oauth/store";
import { EPermission } from "@/store/admin/permission/types";
import AdminReplayChatLogMessages from "@/components/admin/replays/AdminReplayChatLogMessages.vue";
import { mdiChatProcessingOutline } from "@mdi/js";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import PlayerIcon from "@/components/matches/PlayerIcon.vue";
import { getProfileUrl } from "@/helpers/url-functions";

export default defineComponent({
  name: "MatchDetailView",
  components: {
    MatchDetailHeroRow,
    PlayerPerformanceOnMatch,
    TeamMatchInfo,
    HostIcon,
    DownloadReplayIcon,
    MatchHeadToHead,
    AdminReplayChatLogMessages,
    CountryFlagExtended,
    PlayerIcon,
  },
  props: {
    matchId: {
      type: String,
      required: true,
    },
    previewMode: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const matchStore = useMatchStore();
    const oauthStore = useOauthStore();
    const chatLogDialog = ref<boolean>(false);
    const match = computed<Match>(() => matchStore.matchDetail.match);
    const matchDuration = computed<string>(() => formatSecondsToDuration(match.value.durationInSeconds));
    const playedDate = computed<string>(() => formatTimestampStringToDateTime(match.value.startTime));
    const ffaPlayers = computed<PlayerScore[]>(() => [ffaWinner.value, ...ffaLosers.value]);
    const gateWay = computed<string>(() => Gateways[matchStore.matchDetail.match.gateWay]);
    const season = computed<number>(() => matchStore.matchDetail.match.season ?? 1);
    const isGatewayNeeded = computed<boolean>(() => isGatewayNeededForSeason(season.value));
    const isCompleteGame = computed<PlayerScore[]>(() => matchStore.matchDetail.playerScores);
    const loading = computed<boolean>(() => matchStore.loadingMatchDetail);
    const permissions = computed<string[]>(() => oauthStore.permissions);
    const hasModerationPermission = computed<boolean>(() => permissions.value.includes(EPermission[EPermission.Moderation]));
    const showChatLogShortcut = computed<boolean>(() => hasModerationPermission.value && !props.previewMode);

    const matchIsFFA = computed<boolean>(() => {
      return GAME_MODES_FFA.includes(matchStore.matchDetail.match.gameMode);
    });

    const isOneVsOne = computed<boolean>(() => {
      const teams = match.value?.teams;
      return teams?.length === 2 && teams.every((t) => t.players?.length === 1);
    });

    const playerBattleTag = computed<string>(() => {
      return match.value?.teams?.[0]?.players?.[0]?.battleTag ?? "";
    });

    const opponentBattleTag = computed<string>(() => {
      return match.value?.teams?.[1]?.players?.[0]?.battleTag ?? "";
    });

    const isJubileeGame = computed<boolean>(() => {
      if (!match.value?.number) return false;
      return match.value.number !== 0 && match.value?.number % 1000000 === 0;
    });

    const router = useRouter();

    const mmrChangePlayer1 = computed<number>(() => {
      const p = match.value?.teams?.[0]?.players?.[0];
      if (p?.oldMmr && p?.currentMmr) return Math.floor(p.currentMmr - p.oldMmr);
      return 0;
    });

    const mmrChangePlayer2 = computed<number>(() => {
      const p = match.value?.teams?.[1]?.players?.[0];
      if (p?.oldMmr && p?.currentMmr) return Math.floor(p.currentMmr - p.oldMmr);
      return 0;
    });

    const gameDurationLong = computed<string>(() =>
      formatDuration(intervalToDuration({ start: 0, end: match.value.durationInSeconds * 1000 })),
    );

    const gameStartTime = computed<string>(() =>
      new Date(match.value.startTime).toLocaleString(),
    );

    function goToPlayer(battleTag: string) {
      router.push({ path: getProfileUrl(battleTag) });
    }

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

    // Helpers for matching player names/battleTags across data sources (team data vs score data)
    // Normalizes strings for case-insensitive comparison
    const normalize = (value?: string): string => (value ?? "").trim().toLowerCase();
    // Strips the discriminator (#number) from a BattleTag to match players who only have the character name
    const stripTag = (value?: string): string => normalize(value).split("#", 1)[0];

    // Determines if a player from team data matches a score record
    // Tries multiple matching strategies since score battleTags may be localized names or incomplete
    function isDirectPlayerScoreMatch(player: PlayerInTeam, score: PlayerScore): boolean {
      const battleTag = normalize(player.battleTag);
      const inviteName = normalize(player.inviteName);
      const displayName = normalize(player.name);
      const battleTagStripped = stripTag(player.battleTag);
      const inviteNameStripped = stripTag(player.inviteName);
      const scoreBattleTag = normalize(score.battleTag);
      const scoreBattleTagStripped = stripTag(score.battleTag);

      // Match strategies in priority order:
      // 1. Exact BattleTag match
      // 2. Score matches player's invite name
      // 3. Score matches player's display name
      // 4. Score matches BattleTag without discriminator (#number)
      // 5. Score matches invite name without discriminator
      // 6. Score matches display name without discriminator
      return scoreBattleTag === battleTag ||
          !!(inviteName && scoreBattleTag === inviteName) ||
          !!(displayName && scoreBattleTag === displayName) ||
          !!(battleTagStripped && scoreBattleTagStripped === battleTagStripped) ||
          !!(inviteNameStripped && scoreBattleTagStripped === inviteNameStripped) ||
          !!(displayName && scoreBattleTagStripped === displayName);
    }

    // Resolves which score data teamIndex corresponds to each displayed team.
    // This is necessary because match.teams (displayed order) may not align with playerScores.teamIndex (server order).
    // Uses a voting system: each player in a team votes for the score teamIndex they match, then picks the most common vote.
    // Falls back to assigning remaining unused score indexes for teams with no direct matches (e.g. FFA with mismatched names).
    const resolvedTeamIndexes = computed<Array<number | undefined>>(() => {
      const teams = match.value.teams ?? [];

      // Find the score teamIndex for a specific player by matching against all scores
      const directMatchTeamIndexForPlayer = (player: PlayerInTeam): number | undefined => {
        const score = playerScores.value.find((candidate) => isDirectPlayerScoreMatch(player, candidate));

        return score?.teamIndex;
      };

      // For each team, determine its likely score teamIndex via voting from matched players
      const resolvedIndexes: Array<number | undefined> = teams.map((team) => {
        const matchedIndexes = team.players
          .map((player) => directMatchTeamIndexForPlayer(player))
          .filter((index): index is number => index !== undefined);

        // If no players in this team match any score, return undefined for fallback handling
        if (matchedIndexes.length === 0) return undefined;

        // Count votes: which score teamIndex do players map to most often?
        const counts = new Map<number, number>();
        matchedIndexes.forEach((index) => {
          counts.set(index, (counts.get(index) ?? 0) + 1);
        });

        // Pick the teamIndex with the most votes
        let bestIndex: number | undefined;
        let bestCount = -1;
        counts.forEach((count, index) => {
          if (count > bestCount) {
            bestCount = count;
            bestIndex = index;
          }
        });

        return bestIndex;
      });

      // Fallback: assign remaining score teamIndexes to teams that didn't resolve via direct matching
      const uniqueScoreTeamIndexes = [...new Set(playerScores.value.map((score) => score.teamIndex))];
      const usedIndexes = new Set(resolvedIndexes.filter((index): index is number => index !== undefined));

      resolvedIndexes.forEach((index, teamIndex) => {
        if (index !== undefined) return; // Already resolved, skip

        const nextAvailableIndex = uniqueScoreTeamIndexes.find((candidate) => !usedIndexes.has(candidate));
        if (nextAvailableIndex === undefined) return; // No more indexes to assign

        resolvedIndexes[teamIndex] = nextAvailableIndex;
        usedIndexes.add(nextAvailableIndex);
      });

      return resolvedIndexes;
    });

    const scoresOfWinners = computed<PlayerScore[]>(() => {
      const winningTeam = match.value.teams[0];
      return getPlayerScores(winningTeam, resolvedTeamIndexes.value[0]);
    });

    const scoresOfLosers = computed<PlayerScore[]>(() => {
      const losingTeam = match.value.teams[1];
      return getPlayerScores(losingTeam, resolvedTeamIndexes.value[1]);
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

    // Maps displayed team players to their corresponding score records using a two-pass strategy:
    // Pass 1: Match players with direct name/tag matches
    // Pass 2: If unmatched player count equals remaining score count, assign by elimination
    // This handles cases where some scores have localized/incorrect names (e.g. Chinese characters instead of BattleTag)
    function getPlayerScores(team: Team, teamIndex?: number): PlayerScore[] {
      // Restrict to scores for this team if teamIndex is known, otherwise search all scores
      const teamScores = teamIndex === undefined
        ? playerScores.value
        : playerScores.value.filter((score) => score.teamIndex === teamIndex);
      const usedScores = new Set<number>();
      const mappedScores: Array<PlayerScore | undefined> = new Array(team.players.length).fill(undefined);

      // Find the first unused score that matches a player
      function findDirectMatch(player: PlayerInTeam): number {
        return teamScores.findIndex((score, scoreIndex) => {
          if (usedScores.has(scoreIndex)) return false; // Don't reuse scores
          return isDirectPlayerScoreMatch(player, score);
        });
      }

      // Pass 1: Assign confident matches
      team.players.forEach((player, playerIndex) => {
        const scoreIndex = findDirectMatch(player);
        if (scoreIndex === -1) return; // No match found

        usedScores.add(scoreIndex);
        mappedScores[playerIndex] = teamScores[scoreIndex];
      });

      // Pass 2: Assign remaining scores to unmatched players by elimination
      const unmatchedPlayerIndexes: number[] = [];
      mappedScores.forEach((score, playerIndex) => {
        if (!score) unmatchedPlayerIndexes.push(playerIndex);
      });

      const remainingScores = teamScores.filter((_, scoreIndex) => !usedScores.has(scoreIndex));

      // Only use elimination if counts align (prevents misassignment when data is corrupted)
      if (remainingScores.length === unmatchedPlayerIndexes.length) {
        unmatchedPlayerIndexes.forEach((playerIndex, index) => {
          mappedScores[playerIndex] = remainingScores[index];
        });
      }

      return team.players.map((player, playerIndex) => ({
        ...mappedScores[playerIndex] ?? {} as PlayerScore,
        battleTag: player.battleTag, // Use the battleTag from the Match (PlayerInTeam) record, since it is sometimes incorrect on the PlayerScore record
      }));
    }

    watch(toRef(props, "matchId"), init, { immediate: true });

    async function init(): Promise<void> {
      matchStore.SET_LOADING_MATCH_DETAIL(true);
      const requestedId = props.matchId;
      await matchStore.loadMatchDetail(requestedId);
      if (props.matchId !== requestedId) return;
    }

    function openChatLogDialog(): void {
      chatLogDialog.value = true;
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
      isGatewayNeeded,
      match,
      matchIsFFA,
      isOneVsOne,
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
      battleTagToName,
      playerBattleTag,
      opponentBattleTag,
      chatLogDialog,
      showChatLogShortcut,
      openChatLogDialog,
      mdiChatProcessingOutline,
      mmrChangePlayer1,
      mmrChangePlayer2,
      gameDurationLong,
      gameStartTime,
      goToPlayer,
    };
  },
});
</script>

<style lang="scss" scoped>
@media (max-width: 850px) {
  .w3-container-width {
    padding: 0 !important;
    max-width: 100% !important;
  }
}

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
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  position: absolute;
  top: 8px;
  right: 8px;
}

.ovo-header {
  padding: 8px 16px;
  position: relative;
}

.ovo-season-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  .subicon {
    position: static;
    margin-left: auto;
    flex-direction: row;
  }
}

.ovo-player-names {
  display: grid;
  grid-template-columns: 1fr auto auto auto 1fr;
  align-items: center;
  grid-column-gap: 10px;
  margin-bottom: 4px;
}

.ovo-name {
  font-weight: bold;
  font-size: 1.5em;

  @media (max-width: 850px) {
    font-size: 1.1em;
  }
  overflow: hidden;

  a {
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    &:hover {
      text-decoration: underline;
    }
  }
}

.ovo-name--left {
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.ovo-name--right {
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.ovo-vs {
  font-size: 1.2em;
  font-weight: bold;
  padding: 0 8px;
}

.ovo-mmr-row {
  display: grid;
  grid-template-columns: 1fr 10px 141px 10px 1fr;
  align-items: center;
  margin-top: 15px;
  margin-bottom: 1px;
}

.ovo-mmr--left {
  text-align: right;
}

.ovo-mmr--right {
  text-align: left;
}

.ovo-mmr-label {
  opacity: 0.6;
}

.ovo-winner-icon {
  width: 40px;
  text-align: center;
}

.ovo-crown {
  font-size: 1.5em;
}

.ovo-map-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 16px 0 8px;
}

</style>
