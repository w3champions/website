<template>
  <v-container class="pa-3 w3-container-width">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title class="pt-3">
            <v-row no-gutters align="start">
              <v-col cols="auto">
                {{ $t("views_app.matches") }}
              </v-col>
              <v-spacer />
              <v-col cols="auto" class="d-flex align-start">
                <div class="matches-season-slot" :class="{ 'matches-season-slot--hidden': unfinished }">
                  <season-select @seasonSelected="selectSeason" />
                </div>
              </v-col>
            </v-row>
          </v-card-title>
          <v-card-text class="pt-2">
            <div class="matches-filter-scroll">
              <div class="matches-filter-row d-flex align-center">
                <matches-status-select />
                <game-mode-select :disabledModes="disabledGameModes" :gameMode="gameMode" @gameModeChanged="gameModeChanged" />
                <map-select :mapInfo="maps" :map="map" @mapChanged="mapChanged" />
                <mmr-select :mmr="mmr" @mmrFilterChanged="mmrFilterChanged" />
                <duration-select v-if="!unfinished" :duration="duration" @durationFilterChanged="durationFilterChanged" />
                <sort-select v-if="unfinished" />
                <hero-select v-if="!unfinished && showHeroSelect" :selectedHeroes="selectedHeroes" @heroChanged="heroChanged" />
                <hero-icon-toggle :showHeroes="showHeroIcons" :unfinished="unfinished" @update:showHeroes="toggleShowHeroIcons" />
              </div>
            </div>
          </v-card-text>
          <v-card-text v-if="isMatchesLoading" class="d-flex justify-center py-10">
            <v-progress-circular indeterminate color="primary" size="40" />
          </v-card-text>
          <matches-grid
            v-else
            v-model="matches"
            :totalMatches="totalMatches"
            :itemsPerPage="50"
            :unfinished="unfinished"
            :is-player-profile="false"
            :show-heroes="showHeroIcons"
            :selectedHeroes="selectedHeroes"
            @pageChanged="onPageChanged"
          />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from "vue";
import { type Match, EGameMode } from "@/store/types";
import { MatchStatus, type Mmr } from "@/store/match/types";
import type { Season } from "@/store/ranking/types";
import MatchesGrid from "@/components/matches/MatchesGrid.vue";
import MatchesStatusSelect from "@/components/matches/MatchesStatusSelect.vue";
import GameModeSelect from "@/components/common/GameModeSelect.vue";
import MapSelect from "@/components/common/MapSelect.vue";
import MmrSelect from "@/components/common/MmrSelect.vue";
import DurationSelect from "@/components/common/DurationSelect.vue";
import SortSelect from "@/components/matches/SortSelect.vue";
import type { MatchesOnMapPerSeason } from "@/store/overallStats/types";
import AppConstants from "@/constants";
import { useOverallStatsStore } from "@/store/overallStats/store";
import { useRankingStore } from "@/store/ranking/store";
import { useMatchStore } from "@/store/match/store";
import type { MapInfo } from "@/store/common/types";
import SeasonSelect from "@/components/common/SeasonSelect.vue";
import HeroSelect from "@/components/matches/HeroSelect.vue";
import HeroIconToggle from "@/components/matches/HeroIconToggle.vue";

export default defineComponent({
  name: "MatchesView",
  components: {
    SeasonSelect,
    MatchesGrid,
    MatchesStatusSelect,
    GameModeSelect,
    MapSelect,
    MmrSelect,
    SortSelect,
    HeroIconToggle,
    HeroSelect,
    DurationSelect,
  },
  setup() {
    const overallStatsStore = useOverallStatsStore();
    const rankingsStore = useRankingStore();
    const matchStore = useMatchStore();
    const isInitializing = ref<boolean>(true);
    let _intervalRefreshHandle: NodeJS.Timeout;

    const matches = computed<Match[]>(() => matchStore.matches);
    const totalMatches = computed<number>(() => matchStore.totalMatches);
    const isMatchesLoading = computed<boolean>(() => isInitializing.value || matchStore.loadingMatches);
    const selectedHeroes = computed<number[]>(() => matchStore.selectedHeroFilter);
    const currentSeason = computed<Season>(() => rankingsStore.seasons[0]);
    const unfinished = computed<boolean>(() => matchStore.status === MatchStatus.onGoing);
    const gameMode = computed<EGameMode>(() => matchStore.gameMode);
    const map = computed<string>(() => matchStore.map);
    const mmr = computed<Mmr>(() => matchStore.mmr);
    const duration = computed<{ min: number; max: number }>(() => matchStore.duration);


    const showHeroIcons = computed<boolean>(() => matchStore.showHeroIcons);
    const showHeroSelect = computed<boolean>(() => gameMode.value === EGameMode.GM_1ON1 || gameMode.value === EGameMode.GM_1ON1_TOURNAMENT);

    const maps = computed<Array<MapInfo>>(() => {
      if (!unfinished.value) {
        // Ongoing matches need map AND mapName, hence this object with both properties
        // Finished matches only need mapName, so just pass mapName as the value for both.
        // Kind of stupid but would be complicated to fix
        return matchStore.mapNames.map((mapName) => ({ map: mapName, mapName }));
      }

      if (!currentSeason.value) {
        return [];
      }

      const maps = mapsByGameMode.value[gameMode.value] || [];
      return Array.from(maps);
    });

    const disabledGameModes = computed<Array<EGameMode>>(() => {
      if (matchStore.status === MatchStatus.onGoing) {
        return [
          EGameMode.GM_2ON2_AT,
          EGameMode.GM_4ON4_AT,
          EGameMode.GM_LEGION_4v4_X20_AT,
          EGameMode.GM_DOTA_5ON5_AT,
          EGameMode.GM_DS_AT,
          EGameMode.GM_CF_AT,
          EGameMode.GM_MINIDOTA_3ON3_AT,
        ];
      }

      return [];
    });

    const mapsByGameMode = computed<Record<EGameMode, Set<MapInfo>>>(() => {
      const filterSeasons =
        matchStore.status === MatchStatus.onGoing
          ? (matchesOnMapPerSeason: MatchesOnMapPerSeason) => matchesOnMapPerSeason.season === currentSeason.value.id
          : (matchesOnMapPerSeason: MatchesOnMapPerSeason) => matchesOnMapPerSeason.season >= 0;

      return overallStatsStore.matchesOnMapPerSeason
        .filter(filterSeasons)
        .reduce<Record<EGameMode, Set<MapInfo>>>((mapsByMode, matchesOnMapPerSeason) => {
          for (const modes of matchesOnMapPerSeason.matchesOnMapPerModes) {
            // just get the map name and ignore the count
            const mapsInfos = modes.maps.map(({ map, mapName }) => ({ map, mapName }));

            if (!mapsByMode[modes.gameMode]) {
              mapsByMode[modes.gameMode] = new Set(mapsInfos);
            } else {
              // combine this seasons mode maps with other seasons modes maps without dupes
              mapsByMode[modes.gameMode] = new Set([...mapsByMode[modes.gameMode], ...mapsInfos]);
            }
          }
          return mapsByMode;
        }, {} as Record<EGameMode, Set<MapInfo>>);
    });

    async function getMatches(): Promise<void> {
      await matchStore.loadMatches();
    }

    function onPageChanged(): void {
      getMatches();
    }

    function refreshMatches(): void {
      _intervalRefreshHandle = setInterval(() => {
        getMatches();
      }, AppConstants.ongoingMatchesRefreshInterval);
    }

    onMounted(async (): Promise<void> => {
      await rankingsStore.retrieveSeasons();
      rankingsStore.setSeason(rankingsStore.seasons[0]);
      try {
        await matchStore.setSeason(rankingsStore.seasons[0]);
      } finally {
        isInitializing.value = false;
      }
      overallStatsStore.loadMatchesOnMapsPerSeason();
      refreshMatches();
    });

    onUnmounted((): void => {
      clearInterval(_intervalRefreshHandle);
    });

    function gameModeChanged(gameMode: EGameMode): void {
      matchStore.setGameMode(gameMode);
    }

    function mapChanged(map: string): void {
      matchStore.setMap(map);
    }

    function mmrFilterChanged(mmr: Mmr): void {
      matchStore.setMmr(mmr);
    }
    function durationFilterChanged(duration: { min: number; max: number }): void {
      matchStore.setDuration(duration);
    }

    async function selectSeason(season: Season): Promise<void> {
      await matchStore.setSeason(season);
    }
    function toggleShowHeroIcons(showHeroIcons: boolean): void {
      matchStore.setShowHeroIcons(showHeroIcons);
    }

    async function heroChanged(heroes: number[]): Promise<void> {
      await matchStore.setSelectedHeroFilter(heroes);
    }

    return {
      disabledGameModes,
      gameMode,
      gameModeChanged,
      mapChanged,
      maps,
      map,
      mmrFilterChanged,
      mmr,
      duration,
      durationFilterChanged,
      selectSeason,
      unfinished,
      isMatchesLoading,
      matches,
      totalMatches,
      selectedHeroes,
      onPageChanged,
      showHeroIcons,
      toggleShowHeroIcons,
      showHeroSelect,
      heroChanged,
    };
  },
});
</script>

<style lang="scss" scoped>
.matches-filter-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding-top: 2px;
  padding-bottom: 8px;
  margin-top: -2px;
  margin-bottom: -8px;
}

.matches-filter-row {
  width: max-content;
  min-width: 100%;
  flex-wrap: nowrap;
}

.matches-season-slot--hidden {
  visibility: hidden;
  pointer-events: none;
}
</style>
