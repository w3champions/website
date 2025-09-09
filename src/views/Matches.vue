<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            {{ $t("views_app.matches") }}
          </v-card-title>
          <v-card-text class="d-flex align-center">
            <matches-status-select />
            <game-mode-select
              :disabledModes="disabledGameModes"
              :gameMode="gameMode"
              @gameModeChanged="gameModeChanged"
            ></game-mode-select>
            <map-select @mapChanged="mapChanged" :mapInfo="maps" :map="map"></map-select>
            <mmr-select v-if="unfinished" @mmrChanged="mmrChanged" :mmr="mmr"></mmr-select>
            <sort-select v-if="unfinished"></sort-select>
            <season-select v-if="!unfinished" @seasonSelected="selectSeason"></season-select>
            <hero-select v-if="!unfinished && showHeroSelect" @heroChanged="heroChanged"></hero-select>
            <hero-icon-toggle :showHeroes="showHeroIcons" @update:showHeroes="toggleShowHeroIcons"
              :unfinished="unfinished" />
          </v-card-text>
          <matches-grid
            v-model="filteredMatches"
            :totalMatches="totalMatches"
            @pageChanged="onPageChanged"
            :itemsPerPage="50"
            :unfinished="unfinished"
            :is-player-profile="false"
            :show-heroes="showHeroIcons"
          ></matches-grid>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted } from "vue";
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
import HeroSelect from "@/components/matches/HeroSelect.vue";
import HeroIconToggle from "@/components/matches/HeroIconToggle.vue";
import { useI18n } from "vue-i18n-bridge";
import { useCommonStore } from "@/store/common/store";

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
  },
  setup() {
    const overallStatsStore = useOverallStatsStore();
    const rankingsStore = useRankingStore();
    const matchStore = useMatchStore();
    const commonStore = useCommonStore();
    let _intervalRefreshHandle: NodeJS.Timeout;

    const matches = computed<Match[]>(() => matchStore.matches);
    const filteredMatches = computed<Match[]>(() => {
      const selected = matchStore.selectedHeroFilter;
      if (!selected || selected.length === 0) return matches.value;

      // Build selected hero names set
      const nameSet = new Set(
        commonStore.heroFilters
          .filter((h) => selected.includes(h.type))
          .map((h) => h.name)
      );

      if (nameSet.size === 0) return matches.value;

      // AND operator: every selected hero name must appear at least once across the match players
      return matches.value.filter((m) => {
        const heroesInMatch = new Set<string>();
        m.teams?.forEach((t) =>
          t.players?.forEach((p) =>
            p.heroes?.forEach((h) => heroesInMatch.add(h.name))
          )
        );
        for (const name of nameSet) {
          if (!heroesInMatch.has(name)) return false;
        }
        return true;
      });
    });
    const totalMatches = computed<number>(() => matchStore.totalMatches);
    const currentSeason = computed<Season>(() => rankingsStore.seasons[0]);
    const unfinished = computed<boolean>(() => matchStore.status === MatchStatus.onGoing);
    const gameMode = computed<EGameMode>(() => matchStore.gameMode);
    const map = computed<string>(() => matchStore.map);
    const mmr = computed<Mmr>(() => matchStore.mmr);

    const showHeroIcons = computed<boolean>(() => matchStore.showHeroIcons);
    const showHeroSelect = computed<boolean>(() => gameMode.value === EGameMode.GM_1ON1 || gameMode.value === EGameMode.GM_1ON1_TOURNAMENT);

    const maps = computed<Array<MapInfo>>(() => {
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
      _intervalRefreshHandle = setInterval(async () => {
        await getMatches();
      }, AppConstants.ongoingMatchesRefreshInterval);
    }

    onMounted(async (): Promise<void> => {
      await rankingsStore.retrieveSeasons();
      rankingsStore.setSeason(rankingsStore.seasons[0]);
      await matchStore.setSeason(rankingsStore.seasons[0]);
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

    function mmrChanged(mmr: Mmr): void {
      matchStore.setMmr(mmr);
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
      mmrChanged,
      mmr,
      selectSeason,
      unfinished,
      matches,
      totalMatches,
      onPageChanged,
      showHeroIcons,
      toggleShowHeroIcons,
      showHeroSelect,
      heroChanged,
      filteredMatches,
    };
  },
});
</script>
