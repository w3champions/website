<template>
  <div>
    <v-row align="center">
      <v-col cols="md-2">
        <v-card-text>
          <v-select
            v-model="selectedSeason"
            :items="seasons"
            item-title="id"
            :label="$t(`components_overall-statistics_tabs_mmrdistributiontab.selectseason`)"
            return-object
            variant="outlined"
          />

          <v-select
            v-model="selectedGameMode"
            class="over-chart-select-box"
            :items="activeGameModes()"
            item-title="name"
            item-value="id"
            :label="$t(`components_overall-statistics_tabs_mmrdistributiontab.mode`)"
            variant="outlined"
            @update:model-value="gameModeChanged"
          />
        </v-card-text>
        <v-card-text v-if="!loadingMapAndRaceStats && isGatewayNeeded">
          <gateway-select @gatewayChanged="gatewayChanged" />
        </v-card-text>

        <v-card-text class="w3-gray-text">
          {{ $t("components_overall-statistics_tabs_mmrdistributiontab.stddev") }}
          <div>{{ standardDeviation }}</div>
        </v-card-text>
        <v-card-text class="w3-gray-text">
          {{ $t("components_overall-statistics_tabs_mmrdistributiontab.purplebarsdesc") }}
        </v-card-text>
        <v-card-text v-if="authCode" class="w3-gray-text">
          {{ $t("components_overall-statistics_tabs_mmrdistributiontab.greenbardesc") }}
        </v-card-text>
      </v-col>
      <v-col cols="md-10">
        <div class="text-center my-auto">
          <v-progress-circular v-if="loadingData" indeterminate />
        </div>
        <mmr-distribution-chart
          v-if="!loadingData"
          :mmr-distribution="mmrDistribution"
          :selected-season="selectedSeason"
          :selected-game-mode="selectedGameMode"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { activeGameModes, loadActiveGameModes } from "@/composables/GameModesMixin";
import { Gateways, Season } from "@/store/ranking/types";
import { MmrDistribution, SeasonGameModeGateWayForMMR } from "@/store/overallStats/types";
import { EGameMode } from "@/store/types";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import MmrDistributionChart from "@/components/overall-statistics/MmrDistributionChart.vue";
import { useOauthStore } from "@/store/oauth/store";
import { useOverallStatsStore } from "@/store/overallStats/store";
import { usePlayerStore } from "@/store/player/store";
import { useRankingStore } from "@/store/ranking/store";

export default defineComponent({
  name: "MmrDistributionTab",
  components: {
    MmrDistributionChart,
    GatewaySelect,
  },
  setup() {
    const oauthStore = useOauthStore();
    const overallStatsStore = useOverallStatsStore();
    const player = usePlayerStore();
    const rankingsStore = useRankingStore();

    const selectedGameMode = ref<EGameMode>(EGameMode.GM_1ON1);
    const selectedGateWay = ref<Gateways>(Gateways.Europe);
    const selectedSeasonRef = ref<Season>({ id: 1 });
    const loadingData = ref<boolean>(true);
    const loadingMapAndRaceStats = ref<boolean>(overallStatsStore.loadingMapAndRaceStats);

    const verifiedBtag = computed<string>(() => oauthStore.blizzardVerifiedBtag);
    const authCode = computed<string>(() => oauthStore.token);
    const seasons = computed<Season[]>(() => rankingsStore.seasons);
    const mmrDistribution = computed<MmrDistribution>(() => overallStatsStore.mmrDistribution);
    const standardDeviation = computed<string>(() => mmrDistribution.value?.standardDeviation?.toString() ?? "-");
    const isGatewayNeeded = computed<boolean>(() => selectedSeason.value.id <= 5);

    const selectedSeason = computed<Season>({
      get(): Season {
        return selectedSeasonRef.value;
      },
      async set(season: Season): Promise<void> {
        selectedSeasonRef.value = season;
        loadingData.value = true;
        if (verifiedBtag.value) {
          try {
            await player.loadProfile({
              battleTag: verifiedBtag.value,
              freshLogin: false,
            });
            await player.loadGameModeStats({
              battleTag: verifiedBtag.value,
              season: season.id,
            });
          } catch (error) {
            console.warn("Failed to load profile for season change:", error);
          }
        }
        updateMMRDistribution();
      },
    });

    async function updateMMRDistribution() {
      try {
        const payload: SeasonGameModeGateWayForMMR = {
          season: selectedSeasonRef.value.id,
          gameMode: selectedGameMode.value,
          gateWay: selectedGateWay.value,
        };
        await overallStatsStore.loadMmrDistribution(payload);
      } catch (error) {
        console.warn("Failed to load MMR distribution:", error);
      } finally {
        loadingData.value = false;
      }
    }

    function gameModeChanged(gameMode: EGameMode) {
      selectedGameMode.value = gameMode;
      updateMMRDistribution();
    }

    function gatewayChanged(gateWay: Gateways) {
      selectedGateWay.value = gateWay;
      updateMMRDistribution();
    }

    onMounted(() => init());

    async function init() {
      await loadActiveGameModes();
      await rankingsStore.retrieveSeasons();

      // If user is logged in and has a verified battle tag, ensure their profile is loaded
      if (authCode.value && verifiedBtag.value) {
        const needsProfileLoad = !player.battleTag || player.battleTag !== verifiedBtag.value;
        if (needsProfileLoad) {
          try {
            await player.loadProfile({
              battleTag: verifiedBtag.value,
              freshLogin: false,
            });
            if (player.battleTag === verifiedBtag.value) {
              await player.loadGameModeStats({});
            }
          } catch (error) {
            console.warn("Failed to load user profile for MMR tab:", error);
          }
        }
      }

      selectedSeason.value = seasons.value[0];
    }

    return {
      selectedSeason,
      seasons,
      selectedGameMode,
      gameModeChanged,
      activeGameModes,
      loadingMapAndRaceStats,
      isGatewayNeeded,
      gatewayChanged,
      standardDeviation,
      authCode,
      loadingData,
      mmrDistribution,
    };
  },
});
</script>
