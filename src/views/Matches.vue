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
            <map-select
              @mapChanged="mapChanged"
              :mapInfo="maps"
              :map="map"
            ></map-select>
            <mmr-select
              @mmrChanged="mmrChanged"
              :mmr="mmr"
            ></mmr-select>
            <sort-select v-if="unfinished"></sort-select>
          </v-card-text>
          <matches-grid
            v-model="matches"
            :totalMatches="totalMatches"
            @pageChanged="onPageChanged"
            :itemsPerPage="50"
            :unfinished="unfinished"
          ></matches-grid>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-facing-decorator";

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

@Component({
  components: {
    MatchesGrid,
    MatchesStatusSelect,
    GameModeSelect,
    MapSelect,
    MmrSelect,
    SortSelect,
  },
})
export default class MatchesView extends Vue {
  private overallStatsStore = useOverallStatsStore();
  private rankingsStore = useRankingStore();
  private matchStore = useMatchStore();

  onPageChanged(page: number): void {
    this.getMatches(page);
  }

  get disabledGameModes(): Array<EGameMode> {
    if (this.matchStore.status == MatchStatus.onGoing) {
      return [
        EGameMode.GM_2ON2_AT,
        EGameMode.GM_4ON4_AT,
        EGameMode.GM_LEGION_4v4_X20_AT,
        EGameMode.GM_DOTA_5ON5_AT,
      ];
    }

    return [];
  }

  get totalMatches(): number {
    return this.matchStore.totalMatches;
  }

  get matches(): Match[] {
    return this.matchStore.matches;
  }

  get currentSeason(): Season {
    return this.rankingsStore.seasons[0];
  }

  get maps() {
    if (!this.currentSeason) {
      return [];
    }

    const maps = this.mapsByGameMode[this.gameMode] || [];
    return Array.from(maps);
  }

  get mapsByGameMode() {
    const filterSeasons =
      this.matchStore.status == MatchStatus.onGoing
        ? (matchesOnMapPerSeason: MatchesOnMapPerSeason) =>
          matchesOnMapPerSeason.season === this.currentSeason.id
        : (matchesOnMapPerSeason: MatchesOnMapPerSeason) =>
          matchesOnMapPerSeason.season >= 0;

    return this.overallStatsStore.matchesOnMapPerSeason
      .filter(filterSeasons)
      .reduce<Record<EGameMode, Set<unknown>>>(
      (mapsByMode, matchesOnMapPerSeason) => {
        for (const modes of matchesOnMapPerSeason.matchesOnMapPerModes) {
          // just get the map name and ignore the count
          const mapsInfos = modes.maps.map(({ map, mapName }) => ({ map, mapName }));

          if (!mapsByMode[modes.gameMode]) {
            mapsByMode[modes.gameMode] = new Set(mapsInfos);
          } else {
            // combine this seasons mode maps with other seasons modes maps without dupes
            mapsByMode[modes.gameMode] = new Set([
              ...mapsByMode[modes.gameMode],
              ...mapsInfos,
            ]);
          }
        }
        return mapsByMode;
      }, {} as Record<EGameMode, Set<unknown>>
    );
  }

  get unfinished(): boolean {
    return this.matchStore.status == MatchStatus.onGoing;
  }

  get gameMode(): EGameMode {
    return this.matchStore.gameMode;
  }

  get map(): string {
    return this.matchStore.map;
  }

  get mmr(): Mmr {
    return this.matchStore.mmr;
  }

  public async getMatches(page?: number): Promise<void> {
    await this.matchStore.loadMatches(page);
  }

  public getMaps(): void {
    this.overallStatsStore.loadMapsPerSeason();
  }

  _intervalRefreshHandle?: number = undefined;

  private refreshMatches(): void {
    this._intervalRefreshHandle = setInterval(async () => {
      await this.getMatches();
    }, AppConstants.ongoingMatchesRefreshInterval);
  }

  async mounted() {
    await this.rankingsStore.retrieveSeasons();
    this.rankingsStore.setSeason(this.rankingsStore.seasons[0]);
    this.getMatches(1);
    this.getMaps();
    this.refreshMatches();
  }

  destroyed(): void {
    clearInterval(this._intervalRefreshHandle);
  }

  gatewayChanged(): void {
    this.getMatches(1);
  }

  gameModeChanged(gameMode: EGameMode): void {
    this.matchStore.setGameMode(gameMode);
  }

  mapChanged(map: string): void {
    this.matchStore.setMap(map);
  }

  mmrChanged(mmr: Mmr): void {
    this.matchStore.setMmr(mmr);
  }
}
</script>
