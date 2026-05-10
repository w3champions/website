<template>
  <div v-if="hasData" class="mt-8 mb-4">
    <v-card-title class="d-flex justify-center">
      {{ $t("components_matchdetails_matchheadtohead.headToHead") }}
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
            {{ stats.totalGames }} {{ $t("components_matchdetails_matchheadtohead.gamesPlayed") }}
          </div>
          <RecentPerformance v-if="recentFormStrings.length > 1" :last-ten-matches-performance="recentFormStrings" />
        </v-col>
      </v-row>

      <!-- Previous matches -->
      <v-row v-if="timeline.length > 0" justify="center" class="mt-5 mb-2">
        <v-col cols="10" lg="6" class="h2h-content">
          <div ref="scrollBox" class="match-list-scroll">
            <template v-for="entry in timeline" :key="entry.season">
              <div class="season-header">
                {{ $t("views_rankings.season") }} {{ entry.season }}
              </div>
              <template v-if="entry.matches.length > 0">
                <div
                  v-for="m in entry.matches"
                  :key="m.id"
                  class="d-flex align-center py-1 match-row"
                  :class="{ 'current-match': isCurrentMatch(m.id) }"
                  @click="goToMatch(m.id)"
                >
                  <player-icon v-if="getMatchPlayerRace(m) !== null" :race="getMatchPlayerRace(m) as ERaceEnum" />
                  <span class="mx-1 text-caption text-medium-emphasis">vs</span>
                  <player-icon v-if="getMatchOpponentRace(m) !== null" :race="getMatchOpponentRace(m) as ERaceEnum" />
                  <span
                    class="text-body-2 flex-grow-1 ml-3"
                    :class="playerWonMatch(m) ? 'w3-won' : 'w3-lost'"
                  >
                    {{ m.mapName || m.map }}
                  </span>
                  <span class="text-body-2 text-medium-emphasis time-ago">{{ formatTimeAgo(m.endTime) }}</span>
                  <div class="d-flex flex-column align-end duration-cell">
                    <span class="number-text text-body-2">{{ formatDuration(m.durationInSeconds) }}</span>
                    <div class="duration-bar" :style="{ width: getDurationBarWidth(m.durationInSeconds) }"></div>
                  </div>
                </div>
              </template>
              <div v-else class="text-caption text-medium-emphasis py-1">
                {{ $t("components_matchdetails_matchheadtohead.noGames") }}
              </div>
            </template>
            <div v-if="canLoadMore" class="d-flex justify-center mt-4">
              <v-btn
                variant="text"
                size="small"
                :loading="loadingMore"
                @click="loadMore"
              >
                {{ $t("components_matchdetails_matchheadtohead.loadMore") }}
              </v-btn>
            </div>
            <div v-else-if="exhausted" class="text-caption text-medium-emphasis text-center mt-4">
              {{ $t("components_matchdetails_matchheadtohead.noMoreMatches") }}
            </div>
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
import { computed, defineComponent, nextTick, onMounted, ref, watch, PropType } from "vue";
import { useRouter } from "vue-router";
import { EGameMode, ERaceEnum, Match, PlayerInTeam, Team } from "@/store/types";
import PlayerIcon from "@/components/matches/PlayerIcon.vue";
import RecentPerformance from "@/components/player/RecentPerformance.vue";
import MatchService from "@/services/MatchService";
import { Gateways } from "@/store/ranking/types";
import { useRankingStore } from "@/store/ranking/store";
import { formatSecondsToDuration } from "@/helpers/date-functions";
import { formatDistanceToNow, parseJSON } from "date-fns";

const MAX_DURATION_BAR = 1800;

interface H2HStats {
  wins: number;
  losses: number;
  totalGames: number;
}

interface PairCache {
  matchesBySeason: Map<number, Match[]>;
  emptySeasons: Set<number>;
  oldestLoadedSeason: number;
  consecutiveEmpty: number;
  exhausted: boolean;
}

const globalSeasonCache = new Map<string, PairCache>();

function getPairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
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
    gameMode: {
      type: Number as PropType<EGameMode>,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const h2hMatches = ref<Match[]>([]);
    const loading = ref(false);
    const loadingMore = ref(false);
    const hasData = ref(false);
    const consecutiveEmpty = ref(0);
    const oldestLoadedSeason = ref(0);
    const emptySeasons = ref<number[]>([]);
    const exhausted = ref(false);
    const scrollBox = ref<HTMLElement | null>(null);

    function scrollHighlightIntoView() {
      nextTick(() => {
        const el = scrollBox.value?.querySelector(".current-match");
        (el as HTMLElement | null)?.scrollIntoView({ block: "nearest" });
      });
    }

    const pairKey = computed(() => getPairKey(props.playerBattleTag, props.opponentBattleTag));

    function getOrCreatePairCache(): PairCache {
      let cache = globalSeasonCache.get(pairKey.value);
      if (!cache) {
        cache = {
          matchesBySeason: new Map(),
          emptySeasons: new Set(),
          oldestLoadedSeason: 0,
          consecutiveEmpty: 0,
          exhausted: false,
        };
        globalSeasonCache.set(pairKey.value, cache);
      }
      return cache;
    }

    function rebuildFromCache(cache: PairCache) {
      const seasonsDesc = Array.from(cache.matchesBySeason.keys()).sort((a, b) => b - a);
      const allMatches: Match[] = [];
      for (const season of seasonsDesc) {
        allMatches.push(...(cache.matchesBySeason.get(season) || []));
      }
      h2hMatches.value = allMatches;
      emptySeasons.value = Array.from(cache.emptySeasons);
      oldestLoadedSeason.value = cache.oldestLoadedSeason;
      consecutiveEmpty.value = cache.consecutiveEmpty;
      exhausted.value = cache.exhausted;
      hasData.value = allMatches.length > 0;
    }

    const rankingStore = useRankingStore();
    const currentSeason = computed(() =>
      rankingStore.seasons.length > 0 ? rankingStore.seasons[0].id : props.season,
    );
    const playerName = computed(() => props.playerBattleTag.split("#")[0]);
    const opponentName = computed(() => props.opponentBattleTag.split("#")[0]);

    const nextSeasonToLoad = computed(() => oldestLoadedSeason.value - 1);
    const canLoadMore = computed(() => nextSeasonToLoad.value >= 1 && consecutiveEmpty.value < 2);

    function getMatchPlayerRace(match: Match): ERaceEnum | null {
      for (const team of match.teams) {
        const player = team.players.find((p) => p.battleTag === props.playerBattleTag);
        if (player) return player.rndRace || player.race;
      }
      return null;
    }

    function getMatchOpponentRace(match: Match): ERaceEnum | null {
      for (const team of match.teams) {
        const player = team.players.find((p) => p.battleTag === props.opponentBattleTag);
        if (player) return player.rndRace || player.race;
      }
      return null;
    }

    async function fetchSeason(season: number): Promise<Match[]> {
      const cache = getOrCreatePairCache();
      if (cache.matchesBySeason.has(season)) return cache.matchesBySeason.get(season)!;
      if (cache.emptySeasons.has(season)) return [];
      const response = await MatchService.retrievePlayerMatches(
        0,
        props.playerBattleTag,
        props.opponentBattleTag,
        props.gameMode,
        ERaceEnum.TOTAL,
        ERaceEnum.TOTAL,
        props.gateway,
        season,
      );
      if (response.matches.length === 0) {
        cache.emptySeasons.add(season);
      } else {
        cache.matchesBySeason.set(season, response.matches);
      }
      return response.matches;
    }

    onMounted(async () => {
      await rankingStore.retrieveSeasons();
      const cache = getOrCreatePairCache();
      if (cache.matchesBySeason.size > 0 || cache.emptySeasons.size > 0) {
        rebuildFromCache(cache);
        scrollHighlightIntoView();
        return;
      }
      loading.value = true;
      const prevSeason = Math.max(1, currentSeason.value - 1);
      const [current, previous] = await Promise.all([
        fetchSeason(currentSeason.value),
        prevSeason !== currentSeason.value ? fetchSeason(prevSeason) : Promise.resolve([]),
      ]);
      h2hMatches.value = [...current, ...previous];
      oldestLoadedSeason.value = prevSeason;
      cache.oldestLoadedSeason = prevSeason;
      hasData.value = h2hMatches.value.length > 0;
      loading.value = false;
      scrollHighlightIntoView();
    });

    watch(() => props.currentMatchId, () => scrollHighlightIntoView());

    async function loadMore() {
      const cache = getOrCreatePairCache();
      loadingMore.value = true;
      while (nextSeasonToLoad.value >= 1 && consecutiveEmpty.value < 2) {
        const season = nextSeasonToLoad.value;
        const matches = await fetchSeason(season);
        if (matches.length === 0) {
          consecutiveEmpty.value++;
          emptySeasons.value.push(season);
        } else {
          consecutiveEmpty.value = 0;
          h2hMatches.value = [...h2hMatches.value, ...matches];
        }
        oldestLoadedSeason.value = season;
        cache.oldestLoadedSeason = season;
        cache.consecutiveEmpty = consecutiveEmpty.value;
        if (matches.length > 0) break;
      }
      if (consecutiveEmpty.value >= 2 || nextSeasonToLoad.value < 1) {
        exhausted.value = true;
        cache.exhausted = true;
      }
      loadingMore.value = false;
    }

    function goToMatch(matchId: string) {
      if (matchId === props.currentMatchId) return;
      router.push({ path: `/match/${matchId}` });
    }

    function isCurrentMatch(matchId: string): boolean {
      return matchId === props.currentMatchId;
    }

    function playerWonMatch(match: Match): boolean {
      return match.teams.some(
        (team: Team) => team.players.some(
          (p: PlayerInTeam) => p.battleTag === props.playerBattleTag && p.won,
        ),
      );
    }

    const stats = computed<H2HStats>(() => {
      const matches = h2hMatches.value;
      const wins = matches.filter(playerWonMatch).length;
      const totalGames = matches.length;

      return {
        wins,
        losses: totalGames - wins,
        totalGames,
      };
    });

    const recentFormStrings = computed(() =>
      [...h2hMatches.value]
        .slice(0, 10)
        .map(playerWonMatch)
        .map((won) => (won ? "W" : "L")),
    );

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

    const groupedMatches = computed(() => {
      const groups: { season: number; matches: Match[] }[] = [];
      for (const match of h2hMatches.value) {
        const last = groups[groups.length - 1];
        if (last && last.season === match.season) {
          last.matches.push(match);
        } else {
          groups.push({ season: match.season, matches: [match] });
        }
      }
      return groups;
    });

    const timeline = computed(() => {
      const entries: { season: number; matches: Match[] }[] = [];
      const matchGroups = new Map(groupedMatches.value.map((g) => [g.season, g.matches]));
      const allSeasons = new Set([
        ...groupedMatches.value.map((g) => g.season),
        ...emptySeasons.value,
      ]);
      const sorted = Array.from(allSeasons).sort((a, b) => b - a);
      for (const season of sorted) {
        entries.push({ season, matches: matchGroups.get(season) || [] });
      }
      return entries;
    });

    return {
      loading,
      loadingMore,
      hasData,
      canLoadMore,
      nextSeasonToLoad,
      loadMore,
      exhausted,
      timeline,
      playerName,
      opponentName,
      stats,
      recentFormStrings,
      scrollBox,
      formatDuration,
      getDurationBarWidth,
      formatTimeAgo,
      goToMatch,
      isCurrentMatch,
      playerWonMatch,
      getMatchPlayerRace,
      getMatchOpponentRace,
    };
  },
});
</script>

<style lang="scss" scoped>
.h2h-content {
  max-width: 550px;
}

.season-header {
  position: sticky;
  top: 0;
  background-color: rgb(var(--v-theme-surface));
  z-index: 1;
  margin-left: -8px;
  margin-right: -20px;
  padding: 8px 8px 6px;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.match-list-scroll {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 0 8px 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-on-surface), 0.15) transparent;
  background-color: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 8px;
}

.match-row {
  gap: 4px;
  text-decoration: none;
  border-radius: 4px;
  padding-left: 4px;
  padding-right: 4px;
  border-left: 2px solid transparent;
  transition: background-color 0.15s;

  &:hover {
    box-shadow: 0 0 10px rgba(var(--v-theme-on-surface), 0.3);
    cursor: pointer;
  }
}

.current-match {
  background-color: rgba(var(--v-theme-primary), 0.15);
  border-left: 2px solid rgb(var(--v-theme-primary));

  &:hover {
    box-shadow: none;
    cursor: default;
  }
}

.score-name {
  min-width: 120px;
}

.duration-cell {
  min-width: 48px;
  margin-right: 8px;
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
  margin-right: 16px;
}
</style>
