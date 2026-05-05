<template>
  <div v-if="!matchIsFFA && hasData" class="mt-8 mb-4">
    <v-card-title class="d-flex justify-center align-center">
      {{ $t("components_matchdetails_matchheadtohead.headToHead") }}
      <v-chip size="small" variant="outlined" class="ml-3 season-chip">
        <v-menu activator="parent" location="bottom">
          <v-card>
            <v-card-text>
              <v-list density="compact" max-height="200" class="overflow-y-auto">
                <v-list-item
                  :active="selectedSeason === null"
                  @click="switchSeason(null)"
                >
                  <v-list-item-title>{{ combinedLabel }}</v-list-item-title>
                </v-list-item>
                <v-list-item
                  v-for="s in availableSeasons"
                  :key="s"
                  :active="s === selectedSeason"
                  @click="switchSeason(s)"
                >
                  <v-list-item-title>{{ $t("views_rankings.season") }} {{ s }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-menu>
        {{ selectedSeason === null ? combinedLabel : `${$t("views_rankings.season")} ${selectedSeason}` }}
        <v-icon end size="small">{{ mdiChevronDown }}</v-icon>
      </v-chip>
    </v-card-title>

    <v-row v-if="loading" class="justify-center my-4">
      <v-progress-circular indeterminate size="24" />
    </v-row>

    <template v-else-if="stats.totalGames > 0">
      <!-- Score block: centered, player context already in match header above -->
      <v-row justify="center" class="mt-4">
        <v-col cols="auto" class="text-center">
          <div class="d-flex justify-center align-center ga-6">
            <span class="text-body-2 text-medium-emphasis score-name text-right">{{ playerName }}</span>
            <div class="text-h4">
              <span class="w3-won">{{ stats.wins }}</span>
              <span class="text-medium-emphasis mx-2">-</span>
              <span class="w3-lost">{{ stats.losses }}</span>
            </div>
            <span class="text-body-2 text-medium-emphasis score-name text-left">{{ opponentName }}</span>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            <template v-if="isCapped">{{ $t("components_matchdetails_matchheadtohead.last50") }}</template>
            <template v-else>{{ stats.totalGames }} {{ $t("components_matchdetails_matchheadtohead.gamesPlayed") }}</template>
          </div>
          <RecentPerformance v-if="recentFormStrings.length > 1" :last-ten-matches-performance="recentFormStrings" />
        </v-col>
      </v-row>

      <!-- Previous matches -->
      <v-row v-if="groupedMatches.length > 0" justify="center" class="mt-5 mb-2">
        <v-col cols="10" lg="7">
          <div class="d-flex align-center mb-3">
            <span class="text-subtitle-2 text-medium-emphasis">
              {{ $t("components_matchdetails_matchheadtohead.previousMatches") }}
            </span>
            <v-tooltip v-if="hasShortGames" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="text"
                  size="x-small"
                  class="ml-2 text-medium-emphasis"
                  @click="filterShortGames = !filterShortGames"
                >
                  {{ filterShortGames ? $t("components_matchdetails_matchheadtohead.showAll") : $t("components_matchdetails_matchheadtohead.hideShort") }}
                </v-btn>
              </template>
              <span>{{ $t("components_matchdetails_matchheadtohead.filterTooltip") }}</span>
            </v-tooltip>
          </div>
          <template v-for="group in groupedMatches" :key="group.season">
            <div v-if="groupedMatches.length > 1" class="text-caption text-medium-emphasis mt-3 mb-1">
              ── {{ $t("views_rankings.season") }} {{ group.season }} ──
            </div>
            <div v-for="m in group.matches" :key="m.id" class="d-flex align-center py-1 gap-3">
              <router-link
                :to="`/match/${m.id}`"
                class="font-weight-bold text-body-2 wl-indicator"
                :class="playerWonMatch(m) ? 'w3-won' : 'w3-lost'"
              >
                {{ playerWonMatch(m) ? "W" : "L" }}
              </router-link>
              <player-icon v-if="getMatchPlayerRace(m) !== null" :race="getMatchPlayerRace(m) as ERaceEnum" />
              <span class="text-body-2 flex-grow-1">{{ m.mapName || m.map }}</span>
              <div class="d-flex flex-column align-end duration-cell">
                <span class="number-text text-body-2">{{ formatDuration(m.durationInSeconds) }}</span>
                <div class="duration-bar" :style="{ width: getDurationBarWidth(m.durationInSeconds) }"></div>
              </div>
              <span class="text-body-2 text-medium-emphasis time-ago">{{ formatTimeAgo(m.endTime) }}</span>
            </div>
          </template>
        </v-col>
      </v-row>

      <!-- Map breakdown + Game patterns stacked -->
      <v-row justify="center" class="mt-5">
        <v-col cols="10" lg="7">
          <div v-if="mapBreakdown.length > 0">
            <div class="text-subtitle-2 text-medium-emphasis mb-2">
              {{ $t("components_matchdetails_matchheadtohead.byMap") }}
            </div>
            <div v-for="ms in mapBreakdown" :key="ms.mapName" class="d-flex justify-space-between py-1">
              <span class="text-body-2">{{ ms.mapName }}</span>
              <span class="number-text">
                <span class="w3-won">{{ ms.wins }}</span>
                <span class="mx-1">-</span>
                <span class="w3-lost">{{ ms.losses }}</span>
              </span>
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 text-medium-emphasis mb-2">
            {{ $t("components_matchdetails_matchheadtohead.gamePatterns") }}
          </div>
          <div class="d-flex justify-space-between py-1">
            <span class="text-body-2 text-medium-emphasis">{{ $t("components_matchdetails_matchheadtohead.avgDuration") }}</span>
            <span class="number-text">{{ formattedAvgDuration }}</span>
          </div>
          <div class="d-flex justify-space-between py-1">
            <span class="text-body-2 text-medium-emphasis">{{ $t("components_matchdetails_matchheadtohead.shortest") }}</span>
            <span class="number-text">{{ formattedShortestGame }}</span>
          </div>
          <div class="d-flex justify-space-between py-1">
            <span class="text-body-2 text-medium-emphasis">{{ $t("components_matchdetails_matchheadtohead.longest") }}</span>
            <span class="number-text">{{ formattedLongestGame }}</span>
          </div>
        </v-col>
      </v-row>
    </template>

    <v-row v-else class="justify-center my-4">
      <v-card-subtitle>{{ $t("components_matchdetails_matchheadtohead.noGames") }}</v-card-subtitle>
    </v-row>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, PropType } from "vue";
import { EGameMode, ERaceEnum, Match, PlayerInTeam, Team } from "@/store/types";
import PlayerIcon from "@/components/matches/PlayerIcon.vue";
import RecentPerformance from "@/components/player/RecentPerformance.vue";
import MatchService from "@/services/MatchService";
import { Gateways } from "@/store/ranking/types";
import { mdiChevronDown } from "@mdi/js";
import { formatSecondsToDuration } from "@/helpers/date-functions";
import { formatDistanceToNow, parseJSON } from "date-fns";

const MIN_GAME_DURATION = 120;
const MAX_DURATION_BAR = 1800;
const MAX_MAP_ENTRIES = 5;
const MAX_GROUPED_MATCHES = 15;

interface MapRecord {
  mapName: string;
  wins: number;
  losses: number;
}

interface H2HStats {
  wins: number;
  losses: number;
  totalGames: number;
  avgDuration: number;
  shortestGame: number;
  longestGame: number;
}

export default defineComponent({
  name: "MatchHeadToHead",
  components: { PlayerIcon, RecentPerformance },
  props: {
    playerBattleTag: {
      type: String,
      required: true,
    },
    opponentBattleTag: {
      type: String,
      required: true,
    },
    currentMatchId: {
      type: String,
      required: true,
    },
    season: {
      type: Number,
      required: true,
    },
    gateway: {
      type: Number as PropType<Gateways>,
      required: true,
    },
    matchIsFFA: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const h2hMatches = ref<Match[]>([]);
    const loading = ref(false);
    const hasData = ref(false);
    const selectedSeason = ref<number | null>(null);
    const filterShortGames = ref(true);
    const seasonCache = new Map<number, Match[]>();

    const hasShortGames = computed(() =>
      h2hMatches.value.some((m) => m.durationInSeconds > 0 && m.durationInSeconds < MIN_GAME_DURATION),
    );

    const filteredMatches = computed(() => {
      if (filterShortGames.value) {
        return h2hMatches.value.filter((m) => !m.durationInSeconds || m.durationInSeconds >= MIN_GAME_DURATION);
      }
      return h2hMatches.value;
    });

    const isCapped = computed(() => filteredMatches.value.length >= MatchService.pageSize);

    const currentSeason = computed(() => props.season);
    const previousSeason = computed(() => Math.max(1, props.season - 1));
    const combinedLabel = computed(() => `S${currentSeason.value} + S${previousSeason.value}`);
    const playerName = computed(() => props.playerBattleTag.split("#")[0]);
    const opponentName = computed(() => props.opponentBattleTag.split("#")[0]);

    function getMatchPlayerRace(match: Match): ERaceEnum | null {
      for (const team of match.teams) {
        const player = team.players.find((p) => p.battleTag === props.playerBattleTag);
        if (player) return player.rndRace || player.race;
      }
      return null;
    }

    const availableSeasons = computed(() => {
      const seasons = [];
      const oldest = Math.max(1, props.season - 3);
      for (let i = props.season; i >= oldest; i--) {
        seasons.push(i);
      }
      return seasons;
    });

    async function loadSeason(season: number) {
      loading.value = true;
      h2hMatches.value = await fetchSeason(season);
      loading.value = false;
    }

    async function fetchSeason(season: number): Promise<Match[]> {
      if (seasonCache.has(season)) return seasonCache.get(season)!;
      const response = await MatchService.retrievePlayerMatches(
        0,
        props.playerBattleTag,
        props.opponentBattleTag,
        EGameMode.UNDEFINED,
        ERaceEnum.TOTAL,
        ERaceEnum.TOTAL,
        props.gateway,
        season,
      );
      seasonCache.set(season, response.matches);
      return response.matches;
    }

    onMounted(async () => {
      loading.value = true;
      const [current, previous] = await Promise.all([
        fetchSeason(props.season),
        previousSeason.value !== props.season ? fetchSeason(previousSeason.value) : Promise.resolve([]),
      ]);
      h2hMatches.value = [...current, ...previous];
      hasData.value = h2hMatches.value.length > 1;
      loading.value = false;
    });

    function switchSeason(season: number | null) {
      selectedSeason.value = season;
      if (season === null) {
        const current = seasonCache.get(props.season) || [];
        const prev = seasonCache.get(previousSeason.value) || [];
        h2hMatches.value = [...current, ...prev];
      } else {
        loadSeason(season);
      }
    }

    function playerWonMatch(match: Match): boolean {
      return match.teams.some(
        (team: Team) => team.players.some(
          (p: PlayerInTeam) => p.battleTag === props.playerBattleTag && p.won,
        ),
      );
    }

    const durationMatches = computed(() => {
      return filteredMatches.value
        .map((m) => m.durationInSeconds || 0)
        .filter((d) => d > 0);
    });

    const stats = computed<H2HStats>(() => {
      const matches = filteredMatches.value;
      const wins = matches.filter(playerWonMatch).length;
      const totalGames = matches.length;
      const durations = durationMatches.value;
      const totalDuration = durations.reduce((sum, d) => sum + d, 0);

      return {
        wins,
        losses: totalGames - wins,
        totalGames,
        avgDuration: durations.length > 0 ? Math.round(totalDuration / durations.length) : 0,
        shortestGame: durations.length > 0 ? Math.min(...durations) : 0,
        longestGame: durations.length > 0 ? Math.max(...durations) : 0,
      };
    });

    const recentForm = computed(() =>
      [...filteredMatches.value]
        .slice(0, 10)
        .map(playerWonMatch),
    );

    const recentFormStrings = computed(() =>
      recentForm.value.map((won) => (won ? "W" : "L")),
    );

    const formattedAvgDuration = computed(() => formatSecondsToDuration(stats.value.avgDuration));
    const formattedShortestGame = computed(() => formatSecondsToDuration(stats.value.shortestGame));
    const formattedLongestGame = computed(() => formatSecondsToDuration(stats.value.longestGame));

    function formatDuration(seconds: number): string {
      return formatSecondsToDuration(seconds);
    }

    function getDurationBarWidth(seconds: number): string {
      const maxDuration = MAX_DURATION_BAR;
      const minPercent = 5;
      const pct = Math.max(minPercent, Math.min(maxDuration, seconds) / maxDuration * 100);
      return `${pct}%`;
    }

    function formatTimeAgo(timestamp: string): string {
      if (!timestamp) return "";
      return formatDistanceToNow(parseJSON(timestamp), { addSuffix: true });
    }

    const mapBreakdown = computed<MapRecord[]>(() => {
      const mapMap = new Map<string, { wins: number; losses: number }>();

      for (const match of filteredMatches.value) {
        const mapName = match.mapName || match.map;
        if (!mapMap.has(mapName)) {
          mapMap.set(mapName, { wins: 0, losses: 0 });
        }
        const record = mapMap.get(mapName)!;
        if (playerWonMatch(match)) {
          record.wins++;
        } else {
          record.losses++;
        }
      }

      return Array.from(mapMap.entries())
        .map(([mapName, record]) => ({ mapName, ...record }))
        .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
        .slice(0, MAX_MAP_ENTRIES);
    });

    const groupedMatches = computed(() => {
      const groups: { season: number; matches: Match[] }[] = [];
      const filtered = filteredMatches.value.filter((m) => m.id !== props.currentMatchId).slice(0, MAX_GROUPED_MATCHES);
      for (const match of filtered) {
        const last = groups[groups.length - 1];
        if (last && last.season === match.season) {
          last.matches.push(match);
        } else {
          groups.push({ season: match.season, matches: [match] });
        }
      }
      return groups;
    });

    return {
      loading,
      hasData,
      isCapped,
      hasShortGames,
      combinedLabel,
      playerName,
      opponentName,
      selectedSeason,
      availableSeasons,
      switchSeason,
      stats,
      recentFormStrings,
      filterShortGames,
      formattedAvgDuration,
      formattedShortestGame,
      formattedLongestGame,
      formatDuration,
      getDurationBarWidth,
      formatTimeAgo,
      mapBreakdown,
      groupedMatches,
      playerWonMatch,
      getMatchPlayerRace,
      mdiChevronDown,
    };
  },
});
</script>

<style lang="scss" scoped>
.season-chip {
  min-width: 110px;
  justify-content: center;
}

.wl-indicator {
  min-width: 20px;
}

.score-name {
  min-width: 120px;
}

.duration-cell {
  min-width: 48px;
}

.duration-bar {
  background-color: rgb(var(--v-theme-primary));
  height: 3px;
  border-radius: 2px;
  margin-top: 2px;
}

.time-ago {
  min-width: 80px;
  text-align: right;
}
</style>
