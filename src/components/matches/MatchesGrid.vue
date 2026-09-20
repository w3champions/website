<template>
  <div>
    <div
      class="matches-grid-container"
      @mouseover="onGridTipOver"
      @mouseleave="onGridTipLeave"
    >
      <!-- FFA matches: keep the existing table layout -->
      <table v-if="hasAnyFfa" class="custom-table">
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
          <tr v-for="item in ffaMatches" :key="item.id">
            <td>
              <div
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
            </td>
            <td class="text-center">
              <span>{{ gameModeTranslation(item.gameMode) }}</span>
              <br />
              <span class="text-caption">{{ mapNameFromMatch(item) }}</span>
            </td>
            <td class="text-right">
              <span class="start-time-text" :data-tip="getStartTimeTooltip(item)">{{ getStartTime(item) }}</span>
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
          <tr v-if="!ffaMatches || ffaMatches.length == 0">
            <td :colspan="emptyStateColspan" class="text-center">
              {{ $t("components_matches_matchesgrid.nomatchesfound") }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Standard (non-FFA) matches: card layout -->
      <div class="match-cards-list">
        <!-- Empty state: only show when there are no matches at all (FFA would show its own empty row) -->
        <div v-if="matches.length === 0" class="match-cards-empty">
          {{ $t("components_matches_matchesgrid.nomatchesfound") }}
        </div>

        <div
          v-for="entry in standardMatchesWithPlayers"
          :key="entry.match.id"
          class="match-card"
          :class="{ 'cursor-pointer': !unfinished }"
          @click="goToMatchDetailPage(entry.match)"
        >
          <!-- Card body: left player | VS divider | right player -->
          <div class="match-card__body">
            <!-- Left player -->
            <match-card-player-info
              v-if="entry.leftPlayer"
              :player="entry.leftPlayer"
              :left="true"
              :not-clickable="unfinished"
              :unfinished-match="unfinished"
              :highlighted="alwaysLeftName === entry.leftPlayer.battleTag"
              :spoiler-free-winner="true"
            />

            <!-- VS divider -->
            <div class="match-card__vs">
              <img src="/assets/swords.svg" class="vs-swords" alt="VS" />
              <span class="vs-label">VS</span>
              <host-icon v-if="hasServerInfo(entry.match)" :host="entry.match.serverInfo" />
            </div>

            <!-- Right player -->
            <match-card-player-info
              v-if="entry.rightPlayer"
              :player="entry.rightPlayer"
              :left="false"
              :not-clickable="unfinished"
              :unfinished-match="unfinished"
              :highlighted="alwaysLeftName === entry.rightPlayer.battleTag"
              :spoiler-free-winner="true"
            />
          </div>

          <!-- Card footer: map / gamemode / time / duration -->
          <div class="match-card__footer" @click.stop>
            <span class="footer-mode">{{ gameModeTranslation(entry.match.gameMode) }}</span>
            <span class="footer-sep">·</span>
            <span class="footer-map">{{ mapNameFromMatch(entry.match) }}</span>
            <span class="footer-sep">·</span>
            <span class="footer-time start-time-text" :data-tip="getStartTimeTooltip(entry.match)">{{ getStartTime(entry.match) }}</span>
            <span class="footer-sep">·</span>
            <span class="footer-duration number-text" :class="{ 'spoiler-mask': hideDurationSpoilers && !unfinished }">{{ getDuration(entry.match) }}</span>
            <div
              v-show="!unfinished"
              class="footer-duration-bar"
              :class="{ 'spoiler-mask': hideDurationSpoilers }"
              :style="{ width: getDurationBarWidth(entry.match) }"
            />
            <div v-if="!unfinished" class="footer-replay" @click.stop>
              <download-replay-icon v-if="showReplayDownload(entry.match)" :gameId="entry.match.id" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <!--
      One shared tooltip re-targeted via event delegation (see onGridTipOver),
      instead of a v-tooltip per hero icon / start time. Hero icons render as plain
      <img> (no per-icon v-img/v-tooltip), so toggling the heroes switch doesn't
      churn hundreds of overlay instances.
    -->
    <v-tooltip
      :model-value="textTipOpen"
      :activator="textTipActivator"
      :open-on-hover="false"
      location="top"
      transition="none"
      content-class="w3-tooltip elevation-1"
    >
      {{ textTipText }}
    </v-tooltip>
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
import { computed, defineComponent, type PropType, ref, type StyleValue } from "vue";
import { useI18n } from "vue-i18n";
import { EGameMode, type Match, type PlayerInTeam, type Team } from "@/store/types";
import { GAME_MODES_FFA } from "@/store/constants";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import MatchCardPlayerInfo from "@/components/matches/MatchCardPlayerInfo.vue";
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
    MatchCardPlayerInfo,
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
    const hideWinnerSpoilers = computed<boolean>(() => spoilerFreeStore.hideWinner && !props.unfinished);

    // Partition matches into FFA and standard (non-FFA) for the two layout paths
    const ffaMatches = computed<Match[]>(() => matches.value.filter((m) => isFfa(m.gameMode)));
    const standardMatches = computed<Match[]>(() => matches.value.filter((m) => !isFfa(m.gameMode)));
    const hasAnyFfa = computed<boolean>(() => ffaMatches.value.length > 0);


    // Shared hover tooltip, re-anchored via event delegation instead of mounting a
    // v-tooltip per hero icon. Elements opt in with a `data-tip` attribute (hero
    // icons, start time); a single overlay is re-targeted to whichever one is
    // hovered, so toggling the heroes switch doesn't churn hundreds of overlays.
    const textTipActivator = ref<HTMLElement | undefined>(undefined);
    const textTipText = ref<string>("");
    const textTipOpen = ref<boolean>(false);

    function onGridTipOver(event: MouseEvent): void {
      const textEl = (event.target as Element | null)?.closest<HTMLElement>("[data-tip]");
      if (textEl) {
        textTipActivator.value = textEl;
        textTipText.value = textEl.getAttribute("data-tip") ?? "";
        textTipOpen.value = true;
      } else {
        textTipOpen.value = false;
      }
    }

    function onGridTipLeave(): void {
      textTipOpen.value = false;
    }

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

    // The backend returns the winning team first, so a fixed left/right split states the result
    // on its own — masking every value inside the row still leaves the position telling. Under
    // hide-winner the teams are ordered by battleTag instead: unrelated to the outcome, and
    // stable across re-renders and pagination the way a shuffle would not be.
    function teamSortKey(team: Team): string {
      return team.players.map((player: PlayerInTeam) => player.battleTag.toLowerCase()).sort()[0] ?? "";
    }

    function orderTeams(teams: Team[]): Team[] {
      if (!hideWinnerSpoilers.value) return teams;

      return [...teams].sort((a: Team, b: Team) => teamSortKey(a).localeCompare(teamSortKey(b)));
    }

    const getLeftTeam = (match: Match): Team => orderTeams(match.teams)[0];
    const getRightTeam = (match: Match): Team => orderTeams(match.teams)[1];

    // Convenience helpers that return the first player of each team for 1v1 card layout
    const getLeftPlayer = (match: Match): PlayerInTeam => {
      const team = props.alwaysLeftName ? getPlayerTeam(match) : getLeftTeam(match);
      return team?.players[0];
    };
    const getRightPlayer = (match: Match): PlayerInTeam => {
      const team = props.alwaysLeftName ? getOpponentTeam(match) : getRightTeam(match);
      return team?.players[0];
    };

    // Precompute left/right players per standard match to keep the template clean
    type MatchWithPlayers = { match: Match; leftPlayer: PlayerInTeam | undefined; rightPlayer: PlayerInTeam | undefined };
    const standardMatchesWithPlayers = computed<MatchWithPlayers[]>(() =>
      standardMatches.value.map((match) => ({
        match,
        leftPlayer: getLeftPlayer(match),
        rightPlayer: getRightPlayer(match),
      }))
    );

    // For multi-player standard matches (2v2, etc.) we still fall back to team-level info.
    // The card layout currently surfaces only the first player per team.
    // TODO: extend card to show all players for 2v2+

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

    // On a player profile this drops the profile player's own team, which stays pinned first so
    // you can always find yourself. On the global matches list there is no such player, so every
    // team lands here — in Survival Chaos that is placement order, hence the same reordering.
    function getOpponentTeams(match: Match): Team[] {
      const playerTeam = getPlayerTeam(match);
      const opponentTeams = match.teams.filter((x) => x != playerTeam);

      return orderTeams(opponentTeams);
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
      ffaMatches,
      standardMatches,
      standardMatchesWithPlayers,
      hasAnyFfa,
      currentMatchesLowRange,
      currentMatchesHighRange,
      onPageChanged,
      getTotalPages,
      emptyStateColspan,
      teamColumnWidth,
      serverColumnWidth,
      goToMatchDetailPage,
      getLeftTeam,
      getRightTeam,
      getLeftPlayer,
      getRightPlayer,
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
      textTipActivator,
      textTipText,
      textTipOpen,
      onGridTipOver,
      onGridTipLeave,
    };
  },
});
</script>

<style lang="scss" scoped>
// ── Shared ──────────────────────────────────────────────────

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

// ── Match cards ──────────────────────────────────────────────

.matches-grid-container {
  // gives card box-shadows room
  padding: 4px 2px;
}

.match-cards-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 8px 8px;
}

.match-cards-empty {
  text-align: center;
  padding: 24px;
  opacity: 0.6;
}

.match-card {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-surface-variant), 0.35);
  transition: background 0.15s, box-shadow 0.15s;

  &:hover {
    background: rgba(var(--v-theme-surface-variant), 0.6);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }
}

:global(.v-theme--light) .match-card {
  background: rgba(240, 240, 230, 0.95);

  &:hover {
    background: rgba(240, 240, 230, 1);
  }
}

.match-card__body {
  display: flex;
  align-items: center;
  padding: 10px 12px 6px;
  gap: 8px;
  min-height: 88px;
}

// ── VS divider ───────────────────────────────────────────────

.match-card__vs {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 48px;
}

.vs-swords {
  width: 28px;
  height: 28px;
  opacity: 0.75;
}

.vs-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0.5;
  text-transform: uppercase;
}

// ── Card footer ──────────────────────────────────────────────

.match-card__footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 6px;
  padding: 4px 12px 6px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  font-size: 0.72rem;
  opacity: 0.65;
}

.footer-sep {
  opacity: 0.4;
}

.footer-duration-bar {
  height: 2px;
  background-color: rgb(var(--v-theme-primary));
  border-radius: 1px;
  margin-left: 2px;
  // prevent it from participating in the flex row
  flex-basis: 100%;
  order: 99;
  max-width: 140px;
}

.footer-replay {
  margin-left: auto;
}
</style>
