<template>
  <div>
    <div class="elevation-1 overflow-x-auto overflow-y-hidden">
      <table class="custom-table">
        <thead>
          <tr>
            <td
              v-for="header in headers"
              :key="header.name"
              :style="header.style"
              class="text-medium-emphasis"
            >
              {{ header.text }}
            </td>
            <td v-if="!unfinished" class="text-center text-medium-emphasis match-page-cell">
              {{ $t("components_matches_matchesgrid.match") }}
            </td>
            <td v-if="!unfinished" class="text-center text-medium-emphasis">
              {{ $t("components_matches_matchesgrid.replay") }}
            </td>
          </tr>
        </thead>
        <tbody>
          <template v-for="item in matches" :key="item.id">
            <tr>
              <td
                :class="{ 'cursor-pointer': isAccordionCellActive() }"
                @click="onAccordionCellSelected(item)"
              >
                <div
                  v-if="isFfa(item.gameMode)"
                  class="my-3"
                >
                  <v-row v-if="alwaysLeftName" justify="center">
                    <v-col offset="4" class="py-1">
                      <team-match-info
                        :not-clickable="unfinished"
                        :team="getPlayerTeam(item)"
                        :unfinishedMatch="unfinished"
                        :is-anonymous="true"
                        :highlightedPlayer="alwaysLeftName"
                        :show-heroes="showHeroes"
                        :selectedHeroes="selectedHeroes"
                      />
                    </v-col>
                  </v-row>
                  <v-row v-for="(team, index) in getOpponentTeams(item)" :key="index" justify="center">
                    <v-col offset="4" class="py-1">
                      <team-match-info
                        :not-clickable="unfinished"
                        :team="team"
                        :unfinishedMatch="unfinished"
                        :is-anonymous="true"
                        :show-heroes="showHeroes"
                        :selectedHeroes="selectedHeroes"
                      />
                    </v-col>
                  </v-row>
                </div>
                <v-row
                  v-if="!isFfa(item.gameMode)"
                  class="force-no-wrap"
                >
                  <v-col cols="5.5" class="team-match-info-container left-side" align-self="center">
                    <team-match-info
                      :not-clickable="unfinished"
                      :team="alwaysLeftName ? getPlayerTeam(item) : getWinner(item)"
                      :unfinishedMatch="unfinished"
                      :left="true"
                      :highlightedPlayer="nameIfNonSolo(item)"
                      :show-heroes="showHeroes"
                      :selectedHeroes="selectedHeroes"
                    />
                  </v-col>
                  <v-col cols="1" class="py-2 d-flex flex-column justify-center align-center">
                    <span class="text-no-wrap">{{ $t(`views_matchdetail.vs`) }}</span>
                    <host-icon v-if="item.serverInfo && item.serverInfo.provider" :host="item.serverInfo" />
                  </v-col>
                  <v-col cols="5.5" class="team-match-info-container" align-self="center">
                    <team-match-info
                      :not-clickable="unfinished"
                      :team="alwaysLeftName ? getOpponentTeam(item) : getLoser(item)"
                      :unfinishedMatch="unfinished"
                      :show-heroes="showHeroes"
                      :selectedHeroes="selectedHeroes"
                    />
                  </v-col>
                </v-row>
              </td>
              <td
                class="text-center"
                :class="{ 'cursor-pointer': isAccordionCellActive() }"
                @click="onAccordionCellSelected(item)"
              >
                <span>{{ gameModeTranslation(item.gameMode) }}</span>
                <br />
                <span class="text-caption">{{ mapNameFromMatch(item) }}</span>
              </td>
              <td
                class="text-right"
                :class="{ 'cursor-pointer': isAccordionCellActive() }"
                @click="onAccordionCellSelected(item)"
              >
                {{ getStartTime(item) }}
              </td>
              <td
                class="text-right"
                :class="{ 'cursor-pointer': isAccordionCellActive() }"
                @click="onAccordionCellSelected(item)"
              >
                <div class="d-flex flex-column text-right align-end">
                  <span class="number-text">{{ getDuration(item) }}</span>
                  <div v-show="!unfinished" class="duration-bar" :style="{ width: getDurationBarWidth(item) }"></div>
                </div>
              </td>
              <td
                v-if="!unfinished"
                class="text-center match-page-cell"
                :class="{ 'cursor-pointer': isAccordionCellActive() }"
                @click="onAccordionCellSelected(item)"
              >
                <v-tooltip location="top" content-class="w3-tooltip elevation-1">
                  <template v-slot:activator="{ props }">
                    <span v-bind="props">
                      <v-btn
                        class="ma-2 w3-gray-gold-text"
                        icon
                        variant="outlined"
                        size="small"
                        @click.stop="goToMatchDetailPage(item)"
                      >
                        <v-icon size="x-large">{{ mdiOpenInNew }}</v-icon>
                      </v-btn>
                    </span>
                  </template>
                  <span>{{ $t("components_matches_matchesgrid.openMatch") }}</span>
                </v-tooltip>
              </td>
              <td
                v-if="!unfinished"
                class="text-center"
                :class="{ 'cursor-pointer': isAccordionCellActive() }"
                @click="onAccordionCellSelected(item)"
              >
                <span v-if="showReplayDownload(item)" @click.stop>
                  <download-replay-icon :gameId="item.id" />
                </span>
              </td>
            </tr>
            <tr v-if="isExpanded(item)" class="match-detail-row">
              <td :colspan="matchDetailColspan" class="pa-0">
                <div v-if="isLoadingMatchDetail(item.id)" class="text-center pa-6">
                  <v-progress-circular indeterminate color="primary" />
                </div>
                <match-detail-content
                  v-else-if="matchDetailsById[item.id]"
                  :match-detail="matchDetailsById[item.id]"
                  :match-id="item.id"
                  :show-replay-download="false"
                />
              </td>
            </tr>
          </template>
          <tr v-if="!matches || matches.length == 0">
            <td colspan="4" class="text-center">
              {{ $t("components_matches_matchesgrid.nomatchesfound") }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div>
      <div class="text-center font-regular mt-2">
        {{ currentMatchesLowRange }} - {{ currentMatchesHighRange }} of
        {{ totalMatches }}
      </div>
      <v-pagination v-model="page" :length="getTotalPages" total-visible="8" @update:model-value="onPageChanged" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, StyleValue, PropType, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { EGameMode, Match, MatchDetail, PlayerInTeam, Team } from "@/store/types";
import { GAME_MODES_FFA } from "@/store/constants";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import HostIcon from "@/components/matches/HostIcon.vue";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";
import MatchDetailContent from "@/components/match-details/MatchDetailContent.vue";
import { mapNameFromMatch } from "@/composables/MatchMixin";
import { TranslateResult } from "vue-i18n";
import { useRouter } from "vue-router";
import { formatSecondsToDuration, formatTimestampStringToDateTime, formatTimestampStringToUnixTime } from "@/helpers/date-functions";
import { useMatchStore } from "@/store/match/store";
import { usePlayerStore } from "@/store/player/store";
import MatchService from "@/services/MatchService";
import { mdiOpenInNew } from "@mdi/js";

interface MatchesGridHeader {
  name: string;
  text: TranslateResult;
  sortable: boolean;
  value: string;
  style: StyleValue;
}

export default defineComponent({
  name: "MatchesGrid",
  components: {
    TeamMatchInfo,
    HostIcon,
    DownloadReplayIcon,
    MatchDetailContent,
  },
  props: {
    modelValue: {
      type: Array<Match>,
      required: true,
    },
    totalMatches: {
      type: Number,
      required: true,
    },
    itemsPerPage: {
      type: Number,
      required: true,
    },
    alwaysLeftName: {
      type: String,
      required: false,
      default: undefined,
    },
    unfinished: {
      type: Boolean,
      required: false,
      default: false,
    },
    isPlayerProfile: {
      type: Boolean,
      required: true,
    },
    showHeroes: {
      type: Boolean,
      required: false,
      default: false,
    },
    selectedHeroes: {
      type: Array as PropType<number[]>,
      required: false,
      default: () => [],
    },
    inlineDetails: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, context) {
    const { t } = useI18n();
    const router = useRouter();
    const matchStore = useMatchStore();
    const playerStore = usePlayerStore();
    const gameModeTranslation = (gameMode: EGameMode) => t(`gameModes.${EGameMode[gameMode]}`);
    const isFfa = (gameMode: EGameMode) => GAME_MODES_FFA.includes(gameMode);
    const expandedMatchId = ref<string>("");
    const matchDetailsById = ref<Record<string, MatchDetail>>({});
    const loadingMatchDetailsById = ref<Record<string, boolean>>({});

    const matches = computed<Match[]>(() => props.modelValue);
    const matchDetailColspan = computed<number>(() => headers.length + (props.unfinished ? 0 : 2));

    const currentMatchesLowRange = computed<number>(() => {
      if (props.totalMatches === 0) return 0;
      if (props.totalMatches <= 50) return 1;
      return page.value * 50 - 49;
    });

    const currentMatchesHighRange = computed<number>(() => {
      const highRange = page.value * 50;
      return highRange > props.totalMatches ? props.totalMatches : highRange;
    });

    const getTotalPages = computed<number>(() => {
      if (!props.totalMatches) return 1;
      return Math.ceil(props.totalMatches / 50);
    });

    function onPageChanged(page: number): void {
      expandedMatchId.value = "";
      context.emit("pageChanged", page);
    }

    const page = computed<number>({
      get(): number {
        return props.isPlayerProfile ? playerStore.page : matchStore.page;
      },
      set(val: number): void {
        if (props.isPlayerProfile) {
          playerStore.SET_PAGE(val);
        } else {
          matchStore.SET_PAGE(val);
        }
      },
    });

    watch(matches, (): void => {
      expandedMatchId.value = "";
    });

    async function onMatchSelected(match: Match): Promise<void> {
      if (props.unfinished) return;
      if (!props.inlineDetails) {
        goToMatchDetailPage(match);
        return;
      }

      if (expandedMatchId.value === match.id) {
        expandedMatchId.value = "";
        return;
      }

      expandedMatchId.value = match.id;
      await loadInlineMatchDetail(match.id);
    }

    function isAccordionCellActive(): boolean {
      return props.inlineDetails && !props.unfinished;
    }

    async function onAccordionCellSelected(match: Match): Promise<void> {
      if (!isAccordionCellActive()) return;

      await onMatchSelected(match);
    }

    function goToMatchDetailPage(match: Match): void {
      router.push({ path: `/match/${match.id}` });
    }

    async function loadInlineMatchDetail(matchId: string): Promise<void> {
      if (matchDetailsById.value[matchId] || loadingMatchDetailsById.value[matchId]) return;

      loadingMatchDetailsById.value = {
        ...loadingMatchDetailsById.value,
        [matchId]: true,
      };

      const matchDetail = await MatchService.retrieveMatchDetail(matchId);
      matchDetailsById.value = {
        ...matchDetailsById.value,
        [matchId]: matchDetail,
      };
      loadingMatchDetailsById.value = {
        ...loadingMatchDetailsById.value,
        [matchId]: false,
      };
    }

    function isExpanded(match: Match): boolean {
      return expandedMatchId.value === match.id;
    }

    function isLoadingMatchDetail(matchId: string): boolean {
      return loadingMatchDetailsById.value[matchId] === true;
    }

    const getWinner = (match: Match): Team => match.teams[0];
    const getLoser = (match: Match): Team => match.teams[1];

    function getPlayerTeam(match: Match): Team {
      const playerTeam = match.teams.find((team: Team) =>
        team.players.some((player: PlayerInTeam) => player.battleTag === props.alwaysLeftName)
      );

      return playerTeam!;
    }

    function getOpponentTeam(match: Match): Team {
      return match.teams.find(
        (team: Team) => !team.players.some((player: PlayerInTeam) => player.battleTag === props.alwaysLeftName)
      )!;
    }

    function getOpponentTeams(match: Match): Team[] {
      const playerTeam = getPlayerTeam(match);
      const opponentTeams = match.teams.filter((x) => x != playerTeam);

      return opponentTeams;
    }

    function nameIfNonSolo(match: Match): string {
      if (!props.alwaysLeftName || getPlayerTeam(match).players.length === 1) return "";
      return props.alwaysLeftName;
    }

    function getStartTime(match: Match): string {
      return formatTimestampStringToDateTime(match.startTime);
    }

    function getDuration(match: Match): string {
      if (props.unfinished) return t("matchStatuses.onGoing").toString();
      return formatSecondsToDuration(match.durationInSeconds);
    }

    function getDurationBarWidth(match: Match): string {
      if (props.unfinished) return "0%";
      // TODO: Use a percentile based on the game mode length instead (requires backend API data)
      const maxDuration = 1800; // 30 minutes, for now.
      const minPercent = 5; // Minimum width so it's not too small
      return `${Math.max(minPercent, Math.min(maxDuration, match.durationInSeconds) / maxDuration * 100)}%`;
    }

    function showReplayDownload(item: Match): boolean {
      // Timestamp is - 29th September 2022 - 17:17 UTC - first game of 1.33.0.19378
      return !props.unfinished && formatTimestampStringToUnixTime(item.endTime) > 1664471820;
    }

    const headers: MatchesGridHeader[] = [
      {
        name: "Players",
        text: t("components_matches_matchesgrid.players"),
        sortable: false,
        value: "players",
        style: {
          textAlign: "center",
          minWidth: "475px",
        },
      },
      {
        name: "Gamemode",
        text: t("components_matches_matchesgrid.gamemode"),
        sortable: false,
        value: "gameMode",
        style: {
          textAlign: "center",
          minWidth: "90px",
        },
      },
      {
        name: "Starttime",
        text: t("components_matches_matchesgrid.starttime"),
        sortable: false,
        value: "startTime",
        style: {
          textAlign: "end",
          minWidth: "170px",
        },
      },
      {
        name: "Duration",
        text: t("components_matches_matchesgrid.duration"),
        sortable: false,
        value: "duration",
        style: {
          textAlign: "end",
        },
      },
    ];

    return {
      page,
      mapNameFromMatch,
      headers,
      gameModeTranslation,
      isFfa,
      matches,
      currentMatchesLowRange,
      currentMatchesHighRange,
      onPageChanged,
      getTotalPages,
      onMatchSelected,
      onAccordionCellSelected,
      isAccordionCellActive,
      goToMatchDetailPage,
      getWinner,
      getLoser,
      getPlayerTeam,
      getOpponentTeam,
      getOpponentTeams,
      nameIfNonSolo,
      getStartTime,
      getDuration,
      getDurationBarWidth,
      showReplayDownload,
      isExpanded,
      isLoadingMatchDetail,
      matchDetailsById,
      matchDetailColspan,
      mdiOpenInNew,
    };
  },
});
</script>

<style lang="scss" scoped>
.team-match-info-container {
  display: flex;
  align-items: center;
  justify-content: start;

  &.left-side {
    justify-content: end;
  }
}

.duration-bar {
  background-color: rgb(var(--v-theme-primary));
  height: 3px;
  border-radius: 2px;
  margin-top: 2px;
}

.force-no-wrap {
  flex-wrap: nowrap !important;
}

.match-page-cell {
  padding-right: 0 !important;
}

</style>
