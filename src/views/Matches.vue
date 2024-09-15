<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            {{ $t("views_app.matches") }}
          </v-card-title>
          <v-card-text>
            <matches-status-select />
            <game-mode-select
              :disabledModes="disabledGameModes"
              :gameMode="gameMode"
              @gameModeChanged="gameModeChanged"
            ></game-mode-select>
            <map-select @mapChanged="mapChanged" :mapInfo="maps" :map="map"></map-select>
            <mmr-select @mmrChanged="mmrChanged" :mmr="mmr"></mmr-select>
            <sort-select v-if="unfinished"></sort-select>
            <season-select v-if="!unfinished" @seasonSelected="selectSeason"></season-select>
          </v-card-text>
          <matches-grid
            v-model="matches"
            :totalMatches="totalMatches"
            @pageChanged="onPageChanged"
            :itemsPerPage="50"
            :unfinished="unfinished"
            :is-player-profile="false"
          ></matches-grid>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, onUnmounted } from "vue";
import { Match, EGameMode } from "@/store/types";
import { MatchStatus, Mmr } from "@/store/match/types";
import { Season } from "@/store/ranking/types";
import MatchesGrid from "@/components/matches/MatchesGrid.vue";
import MatchesStatusSelect from "@/components/matches/MatchesStatusSelect.vue";
import GameModeSelect from "@/components/common/GameModeSelect.vue";
import MapSelect from "@/components/common/MapSelect.vue";
import MmrSelect from "@/components/common/MmrSelect.vue";
import SortSelect from "@/components/matches/SortSelect.vue";
import { MatchesOnMapPerSeason } from "@/store/overallStats/types";
import AppConstants from "@/constants";
import { useOverallStatsStore } from "@/store/overallStats/store";
import { useRankingStore } from "@/store/ranking/store";
import { useMatchStore } from "@/store/match/store";
import { MapInfo } from "@/store/common/types";
import SeasonSelect from "@/components/common/SeasonSelect.vue";

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
  },
  setup() {
    const overallStatsStore = useOverallStatsStore();
    const rankingsStore = useRankingStore();
    const matchStore = useMatchStore();
    let _intervalRefreshHandle: NodeJS.Timeout;

    const matches: ComputedRef<Match[]> = computed((): Match[] => matchStore.matches);
    const totalMatches: ComputedRef<number> = computed((): number => matchStore.totalMatches);
    const currentSeason: ComputedRef<Season> = computed((): Season => rankingsStore.seasons[0]);
    const unfinished: ComputedRef<boolean> = computed((): boolean => matchStore.status === MatchStatus.onGoing);
    const gameMode: ComputedRef<EGameMode> = computed((): EGameMode => matchStore.gameMode);
    const map: ComputedRef<string> = computed((): string => matchStore.map);
    const mmr: ComputedRef<Mmr> = computed((): Mmr => matchStore.mmr);

    const maps: ComputedRef<Array<MapInfo>> = computed((): Array<MapInfo> => {
      if (!currentSeason.value) {
        return [];
      }

      const maps = mapsByGameMode.value[gameMode.value] || [];
      return Array.from(maps);
    });

    const disabledGameModes: ComputedRef<Array<EGameMode>> = computed((): Array<EGameMode> => {
      if (matchStore.status === MatchStatus.onGoing) {
        return [
          EGameMode.GM_2ON2_AT,
          EGameMode.GM_4ON4_AT,
          EGameMode.GM_LEGION_4v4_X20_AT,
          EGameMode.GM_DOTA_5ON5_AT,
          EGameMode.GM_DS_AT,
        ];
      }

      return [];
    });

    const mapsByGameMode: ComputedRef<Record<EGameMode, Set<MapInfo>>> = computed(
      (): Record<EGameMode, Set<MapInfo>> => {
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
      }
    );

    async function getMatches(): Promise<void> {
      await matchStore.loadMatches();
    }

    function getMaps(): void {
      overallStatsStore.loadMapsPerSeason();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function onPageChanged(page: number): void {
      getMatches();
    }

    function refreshMatches(): void {
      _intervalRefreshHandle = setInterval(async () => {
        await getMatches();
      }, AppConstants.ongoingMatchesRefreshInterval);
    }

    onMounted(async (): Promise<void> => {
      await rankingsStore.retrieveSeasons();
      rankingsStore.setSeason(rankingsStore.seasons[0]);
      await matchStore.setSeason(rankingsStore.seasons[0]);
      getMaps();
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

    function mmrChanged(mmr: Mmr): void {
      matchStore.setMmr(mmr);
    }
    async function selectSeason(season: Season): Promise<void> {
      await matchStore.setSeason(season);
    }

    return {
      disabledGameModes,
      gameMode,
      gameModeChanged,
      mapChanged,
      maps,
      map,
      mmrChanged,
      mmr,
      selectSeason,
      unfinished,
      matches,
      totalMatches,
      onPageChanged,
    };
  },
});
</script>
