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
            v-model="selectedPatch"
            :items="patches"
            item-text="patchVersion"
            item-value="patch"
            label="Select Patch"
            outlined
            @change="setSelectedPatch"
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
            v-model="selectedGameMode"
            :items="activeGameModes()"
            item-text="name"
            item-value="id"
            label="Select Mode"
            outlined
          />
          <v-select
            v-model="selectedRace"
            :items="races()"
            item-text="raceName"
            item-value="raceId"
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
          :selectedMap="selectedMapHeroWinRate"
          :playerStatsHeroVersusRaceOnMap="playerStatsHeroVersusRaceOnMap"
        />
      </v-col>
    </v-row>
    <v-card-title>
      {{ $t("components_player_tabs_playerstatistictab.playergamelengthtitle") }}
    </v-card-title>
    <v-row v-if="selectedSeason.id !== 0">
      <v-col cols="md-2">
        <v-card-text>
          <v-select
            v-model="selectedGameLengthOpponentRace"
            :items="gameLengthOpponentRaces"
            item-text="opponentRace"
            item-value="raceId"
            label="Opponent Race"
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="md-10">
        <player-game-length-stats
          v-if="selectedSeason.id !== 0"
          :selectedOpponentRace="selectedGameLengthOpponentRace"
          :selectedOpponentRaceName="gameLengthOpponentRaces.filter(e => e.raceId === selectedGameLengthOpponentRace)[0].opponentRace"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { activeGameModes, loadActiveGameModes } from "@/mixins/GameModesMixin";
import { EGameMode, ERaceEnum } from "@/store/types";
import { PlayerMmrRpTimeline, PlayerStatsHeroOnMapVersusRace, PlayerStatsRaceOnMapVersusRace, RaceWinsOnMap } from "@/store/player/types";
import PlayerStatsRaceVersusRaceOnMap from "@/components/player/PlayerStatsRaceVersusRaceOnMap.vue";
import PlayerMmrRpTimelineChart from "@/components/player/PlayerMmrRpTimelineChart.vue";
import PlayerHeroStatistics from "@/components/player/PlayerHeroStatistics.vue";
import PlayerHeroWinRate from "@/components/player/PlayerHeroWinRate.vue";
import PlayerGameLengthStats from "@/components/player/PlayerGameLengthStats.vue";
import { races } from "@/helpers/general";
import { useOverallStatsStore } from "@/store/overallStats/store";
import { usePlayerStore } from "@/store/player/store";
import { Season } from "@/store/ranking/types";
import isEmpty from "lodash/isEmpty";

export default defineComponent({
  name: "PlayerStatisticTab",
  components: {
    PlayerStatsRaceVersusRaceOnMap,
    PlayerMmrRpTimelineChart,
    PlayerHeroStatistics,
    PlayerHeroWinRate,
    PlayerGameLengthStats,
  },
  setup() {
    const { t } = useI18n();
    const playerStore = usePlayerStore();
    const overallStatsStore = useOverallStatsStore();

    const selectedMap = ref<string>("Overall");
    const selectedMapHeroWinRate = ref<string>("Overall");
    const selectedGameLengthOpponentRace = ref<ERaceEnum>(ERaceEnum.TOTAL);
    const selectedPatch = ref<string>("All");

    const selectedSeason = computed<Season>(() => playerStore.selectedSeason);
    const playerStatsRaceVersusRaceOnMap = computed<PlayerStatsRaceOnMapVersusRace>(() => playerStore.playerStatsRaceVersusRaceOnMap);
    const playerStatsHeroVersusRaceOnMap = computed<PlayerStatsHeroOnMapVersusRace>(() => playerStore.playerStatsHeroVersusRaceOnMap ?? []);
    const loadingMmrRpTimeline = computed<boolean>(() => playerStore.loadingMmrRpTimeline);
    const playerMmrRpTimeline = computed<PlayerMmrRpTimeline>(() => playerStore.mmrRpTimeline);
    const isPlayerMmrRpTimelineEmpty = computed<boolean>(() => isEmpty(playerStore.mmrRpTimeline));

    const selectedGameMode = computed<EGameMode>({
      get(): EGameMode {
        return playerStore.profileStatisticsGameMode;
      },
      set(val: EGameMode): void {
        playerStore.SET_PROFILE_STATISTICS_GAME_MODE(val);
        playerStore.loadPlayerMmrRpTimeline();
      },
    });

    const selectedRace = computed<ERaceEnum>({
      get(): ERaceEnum {
        return playerStore.profileStatisticsRace;
      },
      set(val: ERaceEnum): void {
        playerStore.SET_PROFILE_STATISTICS_RACE(val);
        playerStore.loadPlayerMmrRpTimeline();
      },
    });

    function setSelectedPatch(patch: string) {
      selectedPatch.value = patch;
    }

    onMounted(async (): Promise<void> => {
      await overallStatsStore.loadMatchesOnMapsPerSeason();
      await loadActiveGameModes();
    });

    const patches = computed<string[]>(() => {
      if (!playerStatsRaceVersusRaceOnMap.value || !playerStatsRaceVersusRaceOnMap.value.raceWinsOnMapByPatch) {
        return [];
      }
      const patches = ["All"];

      Object.keys(playerStatsRaceVersusRaceOnMap.value.raceWinsOnMapByPatch).map(
        (p) => patches.push(p)
      );

      return patches;
    });

    const raceWithoutRandom = computed<RaceWinsOnMap[]>(() => {
      if (
        !playerStatsRaceVersusRaceOnMap.value.raceWinsOnMapByPatch ||
        !(
          selectedPatch.value in
          playerStatsRaceVersusRaceOnMap.value.raceWinsOnMapByPatch
        )
      ) {
        return [];
      }

      return playerStatsRaceVersusRaceOnMap.value.raceWinsOnMapByPatch[selectedPatch.value]
        .filter((r: { race: ERaceEnum }) => r.race !== ERaceEnum.RANDOM);
    });

    const maps = computed<{ mapName: string; mapId: string }[]>(() => {
      const maps = [{ mapName: "Overall", mapId: "Overall" }];
      const mapsList: string[] = [];
      playerStore.playerStatsHeroVersusRaceOnMap.heroStatsItemList?.map((heroItemList) => {
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
    });

    const gameLengthOpponentRaces = [
      { opponentRace: t("components_player_tabs_playerstatistictab.opponentall"), raceId: ERaceEnum.TOTAL },
      { opponentRace: t("components_player_tabs_playerstatistictab.opponentrandom"), raceId: ERaceEnum.RANDOM },
      { opponentRace: t("components_player_tabs_playerstatistictab.opponenthuman"), raceId: ERaceEnum.HUMAN },
      { opponentRace: t("components_player_tabs_playerstatistictab.opponentorc"), raceId: ERaceEnum.ORC },
      { opponentRace: t("components_player_tabs_playerstatistictab.opponentnightelf"), raceId: ERaceEnum.NIGHT_ELF },
      { opponentRace: t("components_player_tabs_playerstatistictab.opponentundead"), raceId: ERaceEnum.UNDEAD },
    ];

    return {
      activeGameModes,
      races,
      selectedSeason,
      patches,
      selectedPatch,
      setSelectedPatch,
      raceWithoutRandom,
      selectedGameMode,
      selectedRace,
      loadingMmrRpTimeline,
      isPlayerMmrRpTimelineEmpty,
      playerMmrRpTimeline,
      selectedMap,
      maps,
      playerStatsHeroVersusRaceOnMap,
      selectedMapHeroWinRate,
      selectedGameLengthOpponentRace,
      gameLengthOpponentRaces,
    };
  },
});
</script>

<style lang="scss" scoped>
.player-hero-usage-statistics__selects {
  margin-top: 48px;
}
</style>
