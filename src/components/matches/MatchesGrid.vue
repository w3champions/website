<template>
  <div>
    <div class="custom-table-wrapper elevation-1">
      <table class="custom-table">
        <thead>
          <tr>
            <td
              v-for="header in headers"
              :key="header.name"
              :style="header.style"
            >
              {{ header.text }}
            </td>
            <td v-if="!unfinished">
              {{ $t("components_matches_matchesgrid.replay") }}
            </td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in matches" :key="item.id">
            <td>
              <div v-if="isFfa(item.gameMode)"  @click="goToMatchDetailPage(item)" class="my-3">
                <v-row justify="center" v-if="alwaysLeftName">
                  <v-col offset="4" class="py-1">
                    <team-match-info
                      :not-clickable="!unfinished"
                      :team="getPlayerTeam(item)"
                      :unfinishedMatch="unfinished"
                      :is-anonymous="true"
                    ></team-match-info>
                  </v-col>
                </v-row>
                <v-row justify="center" v-for="(team, index) in getOpponentTeams(item)" :key="index">
                  <v-col offset="4" class="py-1">
                    <team-match-info
                      :not-clickable="!unfinished"
                      :team="team"
                      :unfinishedMatch="unfinished"
                      :is-anonymous="true"
                    ></team-match-info>
                  </v-col>
                </v-row>
              </div>
              <v-row @click="goToMatchDetailPage(item)" v-if="!isFfa(item.gameMode)">
                <v-col cols="5.5" class="team-match-info-container left-side">
                  <team-match-info
                    :not-clickable="!unfinished"
                    :team="alwaysLeftName ? getPlayerTeam(item) : getWinner(item)"
                    :unfinishedMatch="unfinished"
                    :left="true"
                  ></team-match-info>
                </v-col>
                <v-col cols="1">
                  <span class="text-no-wrap">VS</span>
                  <host-icon v-if="item.serverInfo && item.serverInfo.provider" :host="item.serverInfo"></host-icon>
                </v-col>
                <v-col cols="5.5" class="team-match-info-container">
                  <team-match-info
                    :not-clickable="!unfinished"
                    :team="alwaysLeftName ? getOpponentTeam(item) : getLoser(item)"
                    :unfinishedMatch="unfinished"
                  ></team-match-info>
                </v-col>
              </v-row>
            </td>
            <td>
              {{ gameModeTranslation(item.gameMode) }}
            </td>
            <td>
              <span>{{ mapNameFromMatch(item) }}</span>
            </td>
            <td>
              {{ getStartTime(item) }}
            </td>
            <td>
              <span class="number-text">{{ getDuration(item) }}</span>
            </td>
            <td v-if="showReplayDownload(item)">
              <download-replay-icon :gameId="item.id"></download-replay-icon>
            </td>
          </tr>
          <tr v-if="!matches || matches.length == 0">
            <td colspan="4" class="text-center">
              {{ $t("components_matches_matchesgrid.nomatchesfound") }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="filter-blur">
      <div class="text-center font-regular mt-2">
        {{ currentMatchesLowRange }} - {{ currentMatchesHighRange }} of
        {{ totalMatches }}
      </div>
      <v-pagination v-model="page" :length="getTotalPages" :total-visible="5" @update:model-value="onPageChanged"></v-pagination>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onUnmounted, ref, StyleValue } from "vue";
import { useI18n } from "vue-i18n";
import { Match, Team, PlayerInTeam, EGameMode } from "@/store/types";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import HostIcon from "@/components/matches/HostIcon.vue";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";
import { mapNameFromMatch } from "@/mixins/MatchMixin";
import { TranslateResult } from "vue-i18n";
import { useRouter } from "vue-router";
import { formatSecondsToDuration, formatTimestampStringToDateTime, formatTimestampStringToUnixTime } from "@/helpers/date-functions";

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
  },
  props: {
    value: {
      type: Array<Match>,
      required: false,
      default: [],
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
  },
  setup(props, context) {
    const { t } = useI18n();
    const router = useRouter();
    const page = ref<number>(1);
    const ffaModes = [EGameMode.GM_FFA, EGameMode.GM_LTW_FFA, EGameMode.GM_SC_FFA_4];

    const matches: ComputedRef<Match[]> = computed((): Match[] => props.value);

    const gameModeTranslation = (gameMode: EGameMode) => t(`gameModes.${EGameMode[gameMode]}`);

    const isFfa = (gameMode: EGameMode) => ffaModes.includes(gameMode);

    const currentMatchesLowRange: ComputedRef<number> = computed((): number => {
      if (props.totalMatches === 0) return 0;
      if (props.totalMatches <= 50) return 1;
      return page.value * 50 - 49;
    });

    const currentMatchesHighRange: ComputedRef<number> = computed((): number => {
      const highRange = page.value * 50;
      return highRange > props.totalMatches ? props.totalMatches : highRange;
    });

    function onPageChanged(page: number): void {
      context.emit("pageChanged", page);
    }

    const getTotalPages: ComputedRef<number> = computed((): number => {
      if (!props.totalMatches) return 1;
      return Math.ceil(props.totalMatches / 50);
    });

    function goToMatchDetailPage(match: Match): void {
      if (props.unfinished) return;

      router.push({
        path: `/match/${match.id}`,
      });
    }

    const getWinner = (match: Match): Team => match.teams[0];
    const getLoser = (match: Match): Team =>match.teams[1];

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

    function getStartTime(match: Match): string {
      return formatTimestampStringToDateTime(match.startTime);
    }

    function getDuration(match: Match): string {
      if (props.unfinished) return t("matchStatuses.onGoing").toString();
      return formatSecondsToDuration(match.durationInSeconds);
    }

    function showReplayDownload(item: Match): boolean {
      // Timestamp is - 29th September 2022 - 17:17 UTC - first game of 1.33.0.19378
      return !props.unfinished && formatTimestampStringToUnixTime(item.endTime) > 1664471820;
    }

    onUnmounted(() => {
      context.emit("pageChanged", 1);
    });

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
          textAlign: "start",
          minWidth: "100px",
        },
      },
      {
        name: "Map",
        text: t("components_matches_matchesgrid.map"),
        sortable: false,
        value: "map",
        style: {
          textAlign: "start",
        },
      },
      {
        name: "Starttime",
        text: t("components_matches_matchesgrid.starttime"),
        sortable: false,
        value: "startTime",
        style: {
          textAlign: "start",
          minWidth: "170px",
        },
      },
      {
        name: "Duration",
        text: t("components_matches_matchesgrid.duration"),
        sortable: false,
        value: "duration",
        style: {
          textAlign: "start",
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
      goToMatchDetailPage,
      getWinner,
      getLoser,
      getPlayerTeam,
      getOpponentTeam,
      getOpponentTeams,
      getStartTime,
      getDuration,
      showReplayDownload,
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
</style>
