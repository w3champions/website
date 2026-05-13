<template>
  <div>
    <v-row>
      <v-col cols="md-4">
        <v-card-text>
          <v-select
            v-model="selectedPatch"
            :items="patches"
            item-title="patchVersion"
            item-value="patch"
            :label="$t(`components_overall-statistics_tabs_winratestab.selectpatch`)"
            variant="outlined"
            color="primary"
            @update:model-value="setSelectedPatch"
          />
          <v-select
            v-model="selectedMap"
            :items="maps"
            item-title="mapName"
            item-value="mapId"
            :label="$t(`components_overall-statistics_tabs_winratestab.selectmap`)"
            variant="outlined"
            color="primary"
            @update:model-value="setSelectedMap"
          />
          <winrates-mmr-range-slider
            :mmr="selectedMmrRange"
            :mmrOptions="mmrBuckets"
            @mmrFilterChanged="setSelectedMmrRange"
          />
        </v-card-text>
      </v-col>
      <v-col cols="md-8">
        <v-card-text>
          <v-data-table
            hide-default-footer
            :headers="headers"
            :items="raceWinrate"
            :mobile-breakpoint="400"
            :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold', 'w3-font-size-small'] }"
          >
            <template v-slot:body="{ items }">
              <tr v-for="item in items" :key="item.race">
                <td>{{ $t("races." + raceEnums[item.race]) }}</td>
                <player-stats-race-versus-race-on-map-table-cell
                  v-for="(winloss, index) in item.winLosses"
                  :key="index"
                  :stats="winloss"
                  :compareRace="item.race"
                  :winThreshold="0.51"
                  :lossThreshold="0.49"
                />
                <player-stats-race-versus-race-on-map-table-cell
                  :stats="item.overall"
                  :compareRace="item.race"
                  :winThreshold="0.51"
                  :lossThreshold="0.49"
                  :ignoreCompareRace="true"
                />
              </tr>
            </template>
          </v-data-table>
        </v-card-text>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { TranslateResult } from "vue-i18n";
import WinratesMmrRangeSlider from "@/components/overall-statistics/tabs/WinratesMmrRangeSlider.vue";
import PlayerStatsRaceVersusRaceOnMapTableCell from "@/components/player/PlayerStatsRaceVersusRaceOnMapTableCell.vue";
import type { RaceWinLoss, Ratio, StatsPerMapAndRace, StatsPerWinrate } from "@/store/overallStats/types";
import { ERaceEnum } from "@/store/types";
import { useOverallStatsStore } from "@/store/overallStats/store";
import type { Mmr } from "@/store/match/types";
import type { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "WinratesTab",
  components: {
    WinratesMmrRangeSlider,
    PlayerStatsRaceVersusRaceOnMapTableCell,
  },
  setup() {
    const { t } = useI18n();
    const overallStatsStore = useOverallStatsStore();
    const raceEnums = ERaceEnum;
    const selectedPatch = ref<string>("All");
    const selectedMmrRange = ref<Mmr>({ min: 0, max: 3000 });
    const selectedMap = ref<TranslateResult>(t("common.overall"));
    const hasAutoSelectedPatch = ref(false);
    const hasAutoSelectedMmrRange = ref(false);
    const hasAutoSelectedMap = ref(false);
    const statsPerRaceAndMap = computed<StatsPerWinrate[]>(() => overallStatsStore.statsPerMapAndRace);

    const mmrBuckets = computed<number[]>(() => {
      return [...new Set(statsPerRaceAndMap.value.map((stats) => stats.mmrRange))].sort((a, b) => a - b);
    });

    function isNumericPatch(patch: string): boolean {
      return patch
        .split(".")
        .every((segment) => /^\d+$/.test(segment));
    }

    function comparePatchesDescending(a: string, b: string): number {
      const aIsNumeric = isNumericPatch(a);
      const bIsNumeric = isNumericPatch(b);

      if (aIsNumeric && !bIsNumeric) return -1;
      if (!aIsNumeric && bIsNumeric) return 1;
      if (!aIsNumeric && !bIsNumeric) return a.localeCompare(b);

      const aSegments = a.split(".").map((segment) => Number.parseInt(segment, 10));
      const bSegments = b.split(".").map((segment) => Number.parseInt(segment, 10));
      const maxLength = Math.max(aSegments.length, bSegments.length);

      for (let i = 0; i < maxLength; i++) {
        const aValue = aSegments[i] ?? 0;
        const bValue = bSegments[i] ?? 0;

        if (aValue !== bValue) {
          return bValue - aValue;
        }
      }

      return bSegments.length - aSegments.length;
    }

    const headers: DataTableHeader[] = [
      {
        title: "",
        sortable: false,
      },
      {
        title: t("components_overall-statistics_tabs_winratestab.vshu"),
        sortable: false,
        align: "end",
      },
      {
        title: t("components_overall-statistics_tabs_winratestab.vsorc"),
        sortable: false,
        align: "end",
      },
      {
        title: t("components_overall-statistics_tabs_winratestab.vsne"),
        sortable: false,
        align: "end",
      },
      {
        title: t("components_overall-statistics_tabs_winratestab.vsud"),
        sortable: false,
        align: "end",
      },
      {
        title: t("components_overall-statistics_tabs_winratestab.vsrdm"),
        sortable: false,
        align: "end",
      },
      {
        title: t("common.overall"),
        sortable: false,
        align: "end",
      },
    ];

    const maps = computed<{ mapId: string; mapName: TranslateResult }[]>(() => {
      const stats = statsPerRaceAndMap.value[0];
      if (!stats) return [];
      const patchStats = stats.patchToStatsPerModes[selectedPatch.value];
      if (!patchStats) return [];

      return patchStats.map((r) => {
        return { mapId: r.mapName, mapName: t("mapNames." + r.mapName) };
      });
    });

    const sortByRaceWithRandomLast = (a: { race: ERaceEnum }, b: { race: ERaceEnum }): number => {
      if (a.race === ERaceEnum.RANDOM) return 1;
      if (b.race === ERaceEnum.RANDOM) return -1;
      return a.race - b.race;
    };

    const raceWinrate = computed<(Ratio & { overall: RaceWinLoss })[]>(() => {
      if (!statsPerRaceAndMap.value || !statsPerRaceAndMap.value[0] || !statsPerRaceAndMap.value[0].patchToStatsPerModes[selectedPatch.value]) {
        return [];
      }

      const ratioByRace = new Map<ERaceEnum, Map<ERaceEnum, RaceWinLoss>>();

      const selectedBuckets = mmrBuckets.value;
      if (!selectedBuckets.length) {
        return [];
      }

      const rangeMinBucket = selectedBuckets[0];
      const highestBucket = selectedBuckets[selectedBuckets.length - 1];
      const firstRealBucket = selectedBuckets.find((bucket) => bucket > 0);
      const isFullRangeSelection = selectedMmrRange.value.min === rangeMinBucket && selectedMmrRange.value.max === highestBucket;
      const isFirstVisibleBucketOnlySelection =
        selectedMmrRange.value.min === rangeMinBucket &&
        selectedMmrRange.value.max === rangeMinBucket &&
        firstRealBucket !== undefined;

      const selectedStats = statsPerRaceAndMap.value.filter((stats) => {
        if (isFullRangeSelection) {
          return stats.mmrRange === 0;
        }

        if (isFirstVisibleBucketOnlySelection) {
          return stats.mmrRange === firstRealBucket;
        }

        if (stats.mmrRange === 0) {
          return false;
        }

        if (selectedMmrRange.value.max === highestBucket) {
          return stats.mmrRange >= selectedMmrRange.value.min;
        }

        return stats.mmrRange >= selectedMmrRange.value.min && stats.mmrRange <= selectedMmrRange.value.max;
      });

      for (const stats of selectedStats) {
        const patchStats = stats.patchToStatsPerModes[selectedPatch.value];
        if (!patchStats) {
          continue;
        }

        const statsPerMapAndRace = patchStats.find((mapStats) => mapStats.mapName === selectedMap.value);
        if (!statsPerMapAndRace) {
          continue;
        }

        for (const ratio of statsPerMapAndRace.ratio) {
          if (!ratioByRace.has(ratio.race)) {
            ratioByRace.set(ratio.race, new Map<ERaceEnum, RaceWinLoss>());
          }

          const winLossByOpponentRace = ratioByRace.get(ratio.race)!;
          for (const winLoss of ratio.winLosses) {
            const existing = winLossByOpponentRace.get(winLoss.race);
            if (existing) {
              const wins = existing.wins + winLoss.wins;
              const losses = existing.losses + winLoss.losses;
              const games = existing.games + winLoss.games;

              winLossByOpponentRace.set(winLoss.race, {
                race: winLoss.race,
                wins,
                losses,
                games,
                winrate: games > 0 ? wins / games : 0,
              });
            } else {
              winLossByOpponentRace.set(winLoss.race, {
                ...winLoss,
              });
            }
          }
        }
      }

      const aggregatedRatios: Ratio[] = Array.from(ratioByRace.entries()).map(([race, winLossByOpponentRace]) => ({
        race,
        winLosses: Array.from(winLossByOpponentRace.values()),
      }));

      // Sort both the rows and columns by race.
      return aggregatedRatios
        .sort(sortByRaceWithRandomLast)
        .map((item) => {
          const winLosses = [...item.winLosses].sort(sortByRaceWithRandomLast);

          return {
            ...item,
            winLosses,
            overall: buildOverallWinLoss(item.race, winLosses),
          };
        });
    });

    function buildOverallWinLoss(race: ERaceEnum, winLosses: RaceWinLoss[]): RaceWinLoss {
      const wins = winLosses.reduce((total, entry) => total + entry.wins, 0);
      const losses = winLosses.reduce((total, entry) => total + entry.losses, 0);
      const games = winLosses.reduce((total, entry) => total + entry.games, 0);

      return {
        race,
        wins,
        losses,
        games,
        winrate: games > 0 ? wins / games : 0,
      };
    }

    const patches = computed<string[]>(() => {
      if (statsPerRaceAndMap.value[0]) {
        const allowedPatches = [];
        const patches = Object.keys(
          statsPerRaceAndMap.value[0].patchToStatsPerModes
        );
        for (const key in patches) {
          const patch = patches[key];
          const numberOfMatches = getNumberOfMatches(statsPerRaceAndMap.value[0].patchToStatsPerModes[patch]);

          if (numberOfMatches > 10000) {
            allowedPatches.push(patch);
          }
        }

        const sortedPatches = allowedPatches
          .filter((patch) => patch !== "All")
          .sort(comparePatchesDescending);

        return ["All", ...sortedPatches];
      }
      return [];
    });

    watch(
      patches,
      (availablePatches) => {
        if (hasAutoSelectedPatch.value || availablePatches.length === 0) {
          return;
        }

        const latestNumericPatch = availablePatches.find((patch) => isNumericPatch(patch));
        selectedPatch.value = latestNumericPatch ?? availablePatches[0];
        hasAutoSelectedPatch.value = true;
      },
      { immediate: true }
    );

    watch(
      mmrBuckets,
      (availableBuckets) => {
        if (hasAutoSelectedMmrRange.value || availableBuckets.length === 0) {
          return;
        }

        selectedMmrRange.value = {
          min: availableBuckets[0],
          max: availableBuckets[availableBuckets.length - 1],
        };
        hasAutoSelectedMmrRange.value = true;
      },
      { immediate: true }
    );

    watch(
      maps,
      (availableMaps) => {
        if (!availableMaps.length) {
          return;
        }

        const hasSelectedMap = availableMaps.some((map) => map.mapId === selectedMap.value);
        if (!hasSelectedMap || !hasAutoSelectedMap.value) {
          selectedMap.value = availableMaps[0].mapId;
          hasAutoSelectedMap.value = true;
        }
      },
      { immediate: true }
    );

    function getNumberOfMatches(patchStats: StatsPerMapAndRace[]) {
      const dict: { [key: string]: number } = {};
      let total = 0;

      patchStats[0].ratio.map((r: Ratio) => {
        r.winLosses.map((wL) => {
          const keys = Object.keys(dict);
          if (keys.length == 0) {
            dict[r.race.toString() + wL.race.toString()] = wL.games;
          }
          let found = false;
          for (const k in keys) {
            const charArray = keys[k].split("");
            const k0 = charArray[0] || "0";
            const k1 = charArray[1] || "0";

            if (
              (k0 == r.race.toString() && k1 == wL.race.toString()) ||
              (k1 == r.race.toString() && k0 == wL.race.toString())
            ) {
              found = true;
              break;
            }
          }

          if (!found) {
            dict[r.race.toString() + wL.race.toString()] = wL.games;
            total += wL.games;
          }
        });
      });
      return total;
    }

    function setSelectedMap(map: string): void {
      selectedMap.value = map;
    }

    function setSelectedMmrRange(mmr: Mmr): void {
      selectedMmrRange.value = mmr;
    }

    function setSelectedPatch(patch: string): void {
      selectedPatch.value = patch;
    }

    return {
      raceEnums,
      headers,
      maps,
      selectedMap,
      setSelectedMap,
      selectedMmrRange,
      mmrBuckets,
      setSelectedMmrRange,
      patches,
      selectedPatch,
      setSelectedPatch,
      raceWinrate,
    };
  },
});
</script>
