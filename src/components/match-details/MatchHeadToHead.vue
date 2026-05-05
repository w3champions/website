<template>
  <div v-if="!matchIsFFA && hasData" class="mt-8 mb-4">
    <v-card-title class="d-flex justify-center align-center">
      {{ $t("components_matchdetails_matchheadtohead.headToHead") }}
      <v-chip size="small" variant="outlined" class="ml-3">
        <v-menu activator="parent" location="bottom">
          <v-list density="compact">
            <v-list-item
              v-for="s in availableSeasons"
              :key="s"
              :active="s === selectedSeason"
              @click="switchSeason(s)"
            >
              <v-list-item-title>{{ $t("views_rankings.season") }} {{ s }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        S{{ selectedSeason }}
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
          <div class="text-h4">
            <span class="w3-won">{{ stats.wins }}</span>
            <span class="text-medium-emphasis mx-2">-</span>
            <span class="w3-lost">{{ stats.losses }}</span>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            <template v-if="isCapped">{{ $t("components_matchdetails_matchheadtohead.last50") }}</template>
            <template v-else>{{ stats.totalGames }} {{ $t("components_matchdetails_matchheadtohead.gamesPlayed") }}</template>
          </div>
          <div v-if="recentForm.length > 1" class="d-flex justify-center align-center mt-3">
            <span
              v-for="(result, index) in recentForm"
              :key="index"
              class="mx-1 font-weight-bold text-body-2"
              :class="result ? 'w3-won' : 'w3-lost'"
            >
              {{ result ? "W" : "L" }}
            </span>
          </div>
          <div v-if="recentForm.length > 1" class="text-caption text-medium-emphasis mt-1">
            {{ $t("components_matchdetails_matchheadtohead.oldest") }} → {{ $t("components_matchdetails_matchheadtohead.newest") }}
          </div>
        </v-col>
      </v-row>

      <!-- Previous matches -->
      <v-row v-if="previousMatches.length > 0" justify="center" class="mt-5 mb-2">
        <v-col cols="10" lg="7">
          <div class="text-subtitle-2 text-medium-emphasis mb-3">
            {{ $t("components_matchdetails_matchheadtohead.previousMatches") }}
          </div>
          <div v-for="m in previousMatches" :key="m.id" class="d-flex align-center py-1" style="gap: 12px">
            <router-link
              :to="`/match/${m.id}`"
              class="font-weight-bold text-body-2"
              :class="playerWonMatch(m) ? 'w3-won' : 'w3-lost'"
              style="min-width: 20px"
            >
              {{ playerWonMatch(m) ? "W" : "L" }}
            </router-link>
            <player-icon v-if="getMatchPlayerRace(m) !== null" :race="getMatchPlayerRace(m) as ERaceEnum" />
            <span class="text-body-2 flex-grow-1">{{ m.mapName || m.map }}</span>
            <span class="number-text text-body-2" style="min-width: 48px">{{ formatDuration(m.durationInSeconds) }}</span>
            <span class="text-body-2 text-medium-emphasis" style="min-width: 80px; text-align: right">{{ formatTimeAgo(m.endTime) }}</span>
          </div>
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

          <div class="d-flex align-center mb-2">
            <span class="text-subtitle-2 text-medium-emphasis">
              {{ $t("components_matchdetails_matchheadtohead.gamePatterns") }}
            </span>
            <v-tooltip location="top">
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
import MatchService from "@/services/MatchService";
import { Gateways } from "@/store/ranking/types";
import { mdiChevronDown } from "@mdi/js";
import { formatSecondsToDuration } from "@/helpers/date-functions";
import { formatDistanceToNow, parseJSON } from "date-fns";

const MIN_GAME_DURATION = 120;

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
  components: { PlayerIcon },
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
    const selectedSeason = ref(props.season);
    const filterShortGames = ref(true);
    const seasonCache = new Map<number, Match[]>();

    const isCapped = computed(() => h2hMatches.value.length >= MatchService.pageSize);

    function getMatchPlayerRace(match: Match): ERaceEnum | null {
      for (const team of match.teams) {
        const player = team.players.find((p) => p.battleTag === props.playerBattleTag);
        if (player) return player.rndRace || player.race;
      }
      return null;
    }

    const availableSeasons = computed(() => {
      const seasons = [];
      for (let i = props.season; i >= 1; i--) {
        seasons.push(i);
      }
      return seasons;
    });

    async function loadSeason(season: number) {
      if (seasonCache.has(season)) {
        h2hMatches.value = seasonCache.get(season)!;
        return;
      }

      loading.value = true;
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
      h2hMatches.value = response.matches;
      loading.value = false;
    }

    onMounted(async () => {
      await loadSeason(props.season);
      hasData.value = h2hMatches.value.length > 1;
    });

    function switchSeason(season: number) {
      selectedSeason.value = season;
      loadSeason(season);
    }

    function playerWonMatch(match: Match): boolean {
      return match.teams.some(
        (team: Team) => team.players.some(
          (p: PlayerInTeam) => p.battleTag === props.playerBattleTag && p.won,
        ),
      );
    }

    const durationMatches = computed(() => {
      const durations = h2hMatches.value
        .map((m) => m.durationInSeconds || 0)
        .filter((d) => d > 0);

      if (filterShortGames.value) {
        return durations.filter((d) => d >= MIN_GAME_DURATION);
      }
      return durations;
    });

    const stats = computed<H2HStats>(() => {
      const matches = h2hMatches.value;
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
      [...h2hMatches.value]
        .reverse()
        .slice(0, 10)
        .map(playerWonMatch),
    );

    const formattedAvgDuration = computed(() => formatSecondsToDuration(stats.value.avgDuration));
    const formattedShortestGame = computed(() => formatSecondsToDuration(stats.value.shortestGame));
    const formattedLongestGame = computed(() => formatSecondsToDuration(stats.value.longestGame));

    function formatDuration(seconds: number): string {
      return formatSecondsToDuration(seconds);
    }

    function formatTimeAgo(timestamp: string): string {
      if (!timestamp) return "";
      return formatDistanceToNow(parseJSON(timestamp), { addSuffix: true });
    }

    const mapBreakdown = computed<MapRecord[]>(() => {
      const mapMap = new Map<string, { wins: number; losses: number }>();

      for (const match of h2hMatches.value) {
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
        .slice(0, 5);
    });

    const previousMatches = computed(() =>
      h2hMatches.value
        .filter((m) => m.id !== props.currentMatchId)
        .slice(0, 10),
    );

    return {
      loading,
      hasData,
      isCapped,
      selectedSeason,
      availableSeasons,
      switchSeason,
      stats,
      recentForm,
      filterShortGames,
      formattedAvgDuration,
      formattedShortestGame,
      formattedLongestGame,
      formatDuration,
      formatTimeAgo,
      mapBreakdown,
      previousMatches,
      playerWonMatch,
      getMatchPlayerRace,
      mdiChevronDown,
    };
  },
});
</script>
