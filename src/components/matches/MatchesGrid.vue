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
            <td v-if="!unfinished" class="text-center text-medium-emphasis">
              {{ $t("components_matches_matchesgrid.replay") }}
            </td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in matches" :key="item.id">
            <td>
              <div
                v-if="isFfa(item.gameMode)"
                :class="{ 'cursor-pointer': !unfinished }"
                class="my-3"
                @click="goToMatchDetailPage(item)"
              >
                <div v-if="hasServerInfo(item)" class="server-icon-row server-icon-row--ffa">
                  <host-icon :host="item.serverInfo" />
                </div>
                <v-row v-if="alwaysLeftName" justify="center">
                  <v-col offset="4" class="py-1">
                    <team-match-info
                      :not-clickable="!unfinished"
                      :team="getPlayerTeam(item)"
                      :unfinishedMatch="unfinished"
                      :is-anonymous="true"
                      :highlightedPlayer="alwaysLeftName"
                      :spoiler-free-winner="true"
                      :show-heroes="showHeroes"
                      :selectedHeroes="selectedHeroes"
                    />
                  </v-col>
                </v-row>
                <v-row v-for="(team, index) in getOpponentTeams(item)" :key="index" justify="center">
                  <v-col offset="4" class="py-1">
                    <team-match-info
                      :not-clickable="!unfinished"
                      :team="team"
                      :unfinishedMatch="unfinished"
                      :is-anonymous="true"
                      :spoiler-free-winner="true"
                      :show-heroes="showHeroes"
                      :selectedHeroes="selectedHeroes"
                    />
                  </v-col>
                </v-row>
              </div>
              <v-row
                v-if="!isFfa(item.gameMode)"
                :class="{ 'cursor-pointer': !unfinished }"
                class="force-no-wrap"
                @click="goToMatchDetailPage(item)"
              >
                <v-col :cols="teamColumnWidth" class="team-match-info-container left-side" align-self="center">
                  <team-match-info
                    :not-clickable="!unfinished"
                    :team="alwaysLeftName ? getPlayerTeam(item) : getWinner(item)"
                    :unfinishedMatch="unfinished"
                    :left="true"
                    :highlightedPlayer="nameIfNonSolo(item)"
                    :spoiler-free-winner="true"
                    :show-heroes="showHeroes"
                    :selectedHeroes="selectedHeroes"
                  />
                </v-col>
                <v-col :cols="serverColumnWidth" class="py-2 d-flex flex-column justify-center align-center">
                  <span class="text-no-wrap">{{ $t(`views_matchdetail.vs`) }}</span>
                  <host-icon v-if="hasServerInfo(item)" :host="item.serverInfo" />
                </v-col>
                <v-col :cols="teamColumnWidth" class="team-match-info-container" align-self="center">
                  <team-match-info
                    :not-clickable="!unfinished"
                    :team="alwaysLeftName ? getOpponentTeam(item) : getLoser(item)"
                    :unfinishedMatch="unfinished"
                    :spoiler-free-winner="true"
                    :show-heroes="showHeroes"
                    :selectedHeroes="selectedHeroes"
                  />
                </v-col>
              </v-row>
            </td>
            <td class="text-center">
              <span>{{ gameModeTranslation(item.gameMode) }}</span>
              <br />
              <span class="text-caption">{{ mapNameFromMatch(item) }}</span>
            </td>
            <td class="text-right">
              <v-tooltip location="top" content-class="w3-tooltip elevation-1">
                <template v-slot:activator="{ props: tooltipProps }">
                  <span class="start-time-text" v-bind="tooltipProps">{{ getStartTime(item) }}</span>
                </template>
                <span>{{ getStartTimeTooltip(item) }}</span>
              </v-tooltip>
            </td>
            <td class="text-right">
              <div class="d-flex flex-column text-right align-end">
                <span class="number-text" :class="{ 'spoiler-mask': hideDurationSpoilers && !unfinished }">{{ getDuration(item) }}</span>
                <div
                  v-show="!unfinished"
                  class="duration-bar"
                  :class="{ 'spoiler-mask': hideDurationSpoilers }"
                  :style="{ width: getDurationBarWidth(item) }"
                ></div>
              </div>
            </td>
            <td v-if="!unfinished" class="text-center">
              <download-replay-icon v-if="showReplayDownload(item)" :gameId="item.id" />
            </td>
          </tr>
          <tr v-if="!matches || matches.length == 0">
            <td :colspan="emptyStateColspan" class="text-center">
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
import { computed, defineComponent, type StyleValue, type PropType } from "vue";
import { useI18n } from "vue-i18n";
import { EGameMode, type Match, type PlayerInTeam, type Team } from "@/store/types";
import { GAME_MODES_FFA } from "@/store/constants";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import HostIcon from "@/components/matches/HostIcon.vue";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";
import { mapNameFromMatch } from "@/composables/MatchMixin";
import { useRouter } from "vue-router";
import {
  formatSecondsToDuration,
  formatTimestampStringToDateTime,
  formatTimestampStringToRelativeTime,
  formatTimestampStringToUnixTime,
} from "@/helpers/date-functions";
import { useMatchStore } from "@/store/match/store";
import { usePlayerStore } from "@/store/player/store";
import { useSpoilerFreeStore } from "@/store/spoilerFree/store";

interface MatchesGridHeader {
  name: string;
  text: string;
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
    showRelativeStartTime: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, context) {
    const { t, locale } = useI18n();
    const router = useRouter();
    const matchStore = useMatchStore();
    const playerStore = usePlayerStore();
    const spoilerFreeStore = useSpoilerFreeStore();
    const gameModeTranslation = (gameMode: EGameMode) => t(`gameModes.${EGameMode[gameMode]}`);
    const isFfa = (gameMode: EGameMode) => GAME_MODES_FFA.includes(gameMode);
    const FAKE_DURATION_IN_SECONDS = 15 * 60;

    const matches = computed<Match[]>(() => props.modelValue);
    const hideDurationSpoilers = computed<boolean>(() => spoilerFreeStore.hideDuration);

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

    const emptyStateColspan = computed<number>(() => props.unfinished ? headers.value.length : headers.value.length + 1);
    const teamColumnWidth = 5.5;
    const serverColumnWidth = 1;

    function onPageChanged(page: number): void {
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

    function goToMatchDetailPage(match: Match): void {
      if (props.unfinished) return;
      router.push({ path: `/match/${match.id}` });
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
      if (props.showRelativeStartTime) {
        return formatTimestampStringToRelativeTime(match.startTime, locale.value);
      }

      return formatTimestampStringToDateTime(match.startTime);
    }

    function getStartTimeTooltip(match: Match): string {
      if (props.showRelativeStartTime) {
        return formatTimestampStringToDateTime(match.startTime);
      }

      return formatTimestampStringToRelativeTime(match.startTime, locale.value);
    }

    function getDuration(match: Match): string {
      if (props.unfinished) return t("matchStatuses.onGoing").toString();

      if (spoilerFreeStore.hideDuration) {
        return formatSecondsToDuration(FAKE_DURATION_IN_SECONDS);
      }

      return formatSecondsToDuration(match.durationInSeconds);
    }

    function getDurationBarWidth(match: Match): string {
      if (props.unfinished) return "0%";
      // TODO: Use a percentile based on the game mode length instead (requires backend API data)
      const maxDuration = 1800; // 30 minutes, for now.
      const minPercent = 5; // Minimum width so it's not too small
      const durationInSeconds = spoilerFreeStore.hideDuration ? FAKE_DURATION_IN_SECONDS : match.durationInSeconds;
      return `${Math.max(minPercent, Math.min(maxDuration, durationInSeconds) / maxDuration * 100)}%`;
    }

    function showReplayDownload(item: Match): boolean {
      // Timestamp is - 29th September 2022 - 17:17 UTC - first game of 1.33.0.19378
      return !props.unfinished && formatTimestampStringToUnixTime(item.endTime) > 1664471820;
    }

    function hasServerInfo(match: Match): boolean {
      return Boolean(match.serverInfo?.provider);
    }

    const headers = computed<MatchesGridHeader[]>(() => [
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
        text: t(
          props.showRelativeStartTime
            ? "components_matches_matchesgrid.timeSince"
            : "components_matches_matchesgrid.starttime",
        ),
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
    ]);

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
      emptyStateColspan,
      teamColumnWidth,
      serverColumnWidth,
      goToMatchDetailPage,
      getWinner,
      getLoser,
      getPlayerTeam,
      getOpponentTeam,
      getOpponentTeams,
      nameIfNonSolo,
      getStartTime,
      getStartTimeTooltip,
      getDuration,
      getDurationBarWidth,
      showReplayDownload,
      hasServerInfo,
      hideDurationSpoilers,
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

.server-icon-row {
  display: flex;
  justify-content: center;
}

.server-icon-row--ffa {
  margin-right: auto;
  margin-left: auto;
}

.start-time-text {
  cursor: default;
  white-space: nowrap;
}

.spoiler-mask {
  filter: blur(6px);
}

.force-no-wrap {
  flex-wrap: nowrap !important;
}
</style>
