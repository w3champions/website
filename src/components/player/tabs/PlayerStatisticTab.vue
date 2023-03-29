<template>
  <div>
    <div>
      <v-row v-if="selectedSeason.id === 0">
        <v-card-text class="text-center">
          {{ $t("components_player_tabs_playerprofiletab.betaText") }}
        </v-card-text>
      </v-row>
    </div>
    <v-card-title>
      {{ $t("components_player_tabs_playerstatistictab.title") }}
    </v-card-title>
    <v-row v-if="selectedSeason.id !== 0">
      <v-col cols="md-3">
        <v-card-text>
          <v-select
            :items="patches"
            item-text="patchVersion"
            item-value="patch"
            v-model="selectedPatch"
            @change="setSelectedPatch"
            label="Select Patch"
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="md-9">
        <player-stats-race-versus-race-on-map
          v-if="selectedSeason.id !== 0"
          :stats="raceWithoutRandom"
        />
      </v-col>
    </v-row>
    <v-card-title>
      {{ $t("components_player_tabs_playerstatistictab.playermmrtimeline") }}
    </v-card-title>
    <v-row v-if="selectedSeason.id !== 0">
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            :items="activeGameModes"
            item-text="name"
            item-value="id"
            v-model="selectedGameMode"
            @change="setTimelineMode"
            label="Select Mode"
            outlined
          />
          <v-select
            :items="races"
            :item-text="translateRaceName"
            item-value="raceId"
            v-model="selectedRace"
            @change="setTimelineRace"
            label="Select Race"
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="12" md="10">
        <v-card-text v-if="!loadingMmrRpTimeline">
          <player-mmr-rp-timeline-chart
            v-if="!isPlayerMmrRpTimelineEmpty"
            style="position: relative"
            :mmrRpTimeline="playerMmrRpTimeline"
          />
          <v-card-text v-else>
            {{ $t("components_player_tabs_playerstatistictab.playerhasnomatches") }}
          </v-card-text>
        </v-card-text>
      </v-col>
    </v-row>
    <v-card-title>
      {{ $t("components_player_tabs_playerstatistictab.playerheroesstatisticstitle") }}
    </v-card-title>
    <v-row v-if="selectedSeason.id !== 0">
      <v-col cols="md-2">
        <v-card-text class="player-hero-usage-statistics__selects">
          <v-select
            v-model="selectedMap"
            :items="maps"
            item-text="mapName"
            item-value="mapId"
            label="Map"
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="md-10">
        <player-hero-statistics
          v-if="selectedSeason.id !== 0"
          :selectedMap="selectedMap"
          :playerStatsHeroVersusRaceOnMap="playerStatsHeroVersusRaceOnMap"
        />
      </v-col>
    </v-row>
    <v-card-title>
      {{ $t("components_player_tabs_playerstatistictab.playerherowinratetitle") }}
    </v-card-title>
    <v-row v-if="selectedSeason.id !== 0">
      <v-col cols="md-2">
        <v-card-text class="player-hero-usage-statistics__selects">
          <v-select
            v-model="selectedMapHeroWinRate"
            :items="maps"
            item-text="mapName"
            item-value="mapId"
            label="Map"
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="md-10">
        <player-hero-win-rate
          v-if="selectedSeason.id !== 0"
          :key="updatePlayerHeroStatsKey"
          :selectedMap="selectedMapHeroWinRate"
          :playerStatsHeroVersusRaceOnMap="playerStatsHeroVersusRaceOnMap"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Watch, Mixins } from "vue-property-decorator";
import GameModesMixin from "@/mixins/GameModesMixin";
import MatchesGrid from "@/components/matches/MatchesGrid.vue";
import { EGameMode, ERaceEnum } from "@/store/types";
import {
  PlayerMmrRpTimeline,
  PlayerStatsHeroOnMapVersusRace,
  PlayerStatsRaceOnMapVersusRace,
  RaceWinsOnMap,
} from "@/store/player/types";
import PlayerStatsRaceVersusRaceOnMap from "@/components/player/PlayerStatsRaceVersusRaceOnMap.vue";
import PlayerMmrRpTimelineChart from "@/components/player/PlayerMmrRpTimelineChart.vue";
import PlayerHeroStatistics from "@/components/player/PlayerHeroStatistics.vue";
import PlayerHeroWinRate from "@/components/player/PlayerHeroWinRate.vue";
import { races } from "@/helpers/profile";
import { TranslateResult } from "vue-i18n";
import { useOverallStatsStore } from "@/store/overallStats/store";
import { usePlayerStore } from "@/store/player/store";

@Component({
  components: {
    PlayerStatsRaceVersusRaceOnMap,
    PlayerMmrRpTimelineChart,
    PlayerHeroStatistics,
    PlayerHeroWinRate,
    MatchesGrid,
  },
})
export default class PlayerStatisticTab extends Mixins(GameModesMixin) {
  private player = usePlayerStore();

  public selectedPatch = "All";
  public selectedGameMode = this.player.gameMode;
  public selectedRace = this.player.race;
  public updatePlayerHeroStatsKey = 0;
  public selectedMap = "Overall";
  public selectedMapHeroWinRate = "Overall";
  public races = races;
  private overallStatsStore = useOverallStatsStore();

  get selectedSeason() {
    return this.player.selectedSeason;
  }

  get playerStatsRaceVersusRaceOnMap(): PlayerStatsRaceOnMapVersusRace {
    return this.player.playerStatsRaceVersusRaceOnMap;
  }

  get playerStatsHeroVersusRaceOnMap(): PlayerStatsHeroOnMapVersusRace {
    return this.player.playerStatsHeroVersusRaceOnMap ?? [];
  }

  get loadingMmrRpTimeline(): boolean {
    return this.player.loadingMmrRpTimeline;
  }

  get playerMmrRpTimeline(): PlayerMmrRpTimeline | undefined {
    return this.player.mmrRpTimeline;
  }

  get isPlayerMmrRpTimelineEmpty(): boolean {
    return this.player.mmrRpTimeline == undefined;
  }

  get isPlayerInitialized(): boolean {
    return this.player.isInitialized;
  }

  async mounted(): Promise<void> {
    this.getMaps();
    await this.loadActiveGameModes();
  }

  // Use activated() instead of mounted() to trigger when navigating directly from one profile to another.
  activated(): void {
    if (this.isPlayerInitialized) {
      this.initMmrRpTimeline();
    }
  }

  // When loading the statistics tab via URL directly, due to Lifecycle Hooks the mounted() here
  // is called before mounted of player, which this depends on. For this case isPlayerInitialized
  // is being watched to init the mmrRpTimeline once player.vue init() has finished.
  @Watch("isPlayerInitialized")
  onPlayerInitialized(): void {
    this.initMmrRpTimeline();
  }

  private async initMmrRpTimeline() {
    const raceStats = this.player.raceStats;
    let maxRace = ERaceEnum.HUMAN;
    let maxGames = 0;
    raceStats.forEach((r) => {
      if (r.games > maxGames) {
        maxGames = r.wins;
        maxRace = r.race;
      }
    });
    await this.player.SET_GAMEMODE(EGameMode.GM_1ON1);
    await this.player.SET_RACE(maxRace);
    this.selectedGameMode = EGameMode.GM_1ON1;
    this.selectedRace = maxRace;

    this.player.loadPlayerMmrRpTimeline();
  }

  private async setTimelineMode(mode: EGameMode) {
    this.player.SET_GAMEMODE(mode);
    this.player.loadPlayerMmrRpTimeline();
  }
  private async setTimelineRace(race: ERaceEnum) {
    this.player.SET_RACE(race);
    this.player.loadPlayerMmrRpTimeline();
  }

  get patches() {
    if (
      !this.playerStatsRaceVersusRaceOnMap ||
      !this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch
    ) {
      return [];
    }
    const patches = ["All"];

    Object.keys(this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch).map(
      (p) => patches.push(p)
    );

    return patches;
  }

  public setSelectedPatch(patch: string) {
    this.selectedPatch = patch;
  }

  get raceWithoutRandom(): RaceWinsOnMap[] {
    if (
      !this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch ||
      !(
        this.selectedPatch in
        this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch
      )
    ) {
      return [];
    }

    return this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch[
      this.selectedPatch
    ].filter((r: { race: ERaceEnum }) => r.race !== ERaceEnum.RANDOM);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public translateRaceName(race: any): TranslateResult {
    return this.$t(`races.${race.raceName}`);
  }

  public getMaps(): void {
    this.overallStatsStore.loadMapsPerSeason();
  }

  get maps() {
    const maps = [{
      mapName: "Overall",
      mapId: "Overall",
    }];
    const mapsList: string[] = [];
    this.player.playerStatsHeroVersusRaceOnMap.heroStatsItemList?.map((heroItemList) => {
      heroItemList.stats.map((stats) => {
        stats.winLossesOnMap.map((winLossOnMap) => {
          const map = winLossOnMap.map;
          if (!mapsList.includes(map)) {
            mapsList.push(map);
          }
        });
      });
    });
    mapsList.forEach((map) => maps.push({ mapName: map, mapId: map }));
    return maps;
  }
}
</script>

<style lang="scss" scoped>
.player-hero-usage-statistics__selects {
  margin-top: 48px;
}
</style>
