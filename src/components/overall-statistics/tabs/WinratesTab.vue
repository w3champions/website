<template>
  <div>
    <v-row>
      <v-col cols="md-4">
        <v-card-text>
          <v-select
            v-model="selectedMap"
            :items="maps"
            item-text="mapName"
            item-value="mapId"
            :label="$t(`components_overall-statistics_tabs_winratestab.selectmap`)"
            outlined
            @change="setSelectedMap"
          />
          <v-select
            v-model="selectedMmr"
            :items="mmrs"
            item-text="league"
            item-value="mmr"
            :label="$t(`components_overall-statistics_tabs_winratestab.selectmmr`)"
            outlined
            @change="setSelectedMmr"
          />
          <v-select
            v-model="selectedPatch"
            :items="patches"
            item-text="patchVersion"
            item-value="patch"
            :label="$t(`components_overall-statistics_tabs_winratestab.selectpatch`)"
            outlined
            @change="setSelectedPatch"
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
          >
            <template v-slot:body="{ items }">
              <tbody>
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
                </tr>
              </tbody>
            </template>
          </v-data-table>
        </v-card-text>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { TranslateResult } from "vue-i18n";
import PlayerStatsRaceVersusRaceOnMapTableCell from "@/components/player/PlayerStatsRaceVersusRaceOnMapTableCell.vue";
import { Ratio, StatsPerMapAndRace, StatsPerWinrate } from "@/store/overallStats/types";
import { ERaceEnum } from "@/store/types";
import { useOverallStatsStore } from "@/store/overallStats/store";

interface WinratesTabHeader {
  text: TranslateResult;
  sortable: boolean;
  align?: "left" | "center" | "right";
}

export default defineComponent({
  name: "WinratesTab",
  components: {
    PlayerStatsRaceVersusRaceOnMapTableCell,
  },
  setup() {
    const { t } = useI18n();
    const overallStatsStore = useOverallStatsStore();
    const raceEnums = ERaceEnum;
    const selectedPatch = ref<string>("All");
    const selectedMmr = ref<number>(0);
    const selectedMap = ref<TranslateResult>(t("common.overall"));
    const statsPerRaceAndMap = computed<StatsPerWinrate[]>(() => overallStatsStore.statsPerMapAndRace);

    const headers: WinratesTabHeader[] = [
      {
        text: "",
        sortable: false,
      },
      {
        text: t("components_overall-statistics_tabs_winratestab.vshu"),
        sortable: false,
        align: "right",
      },
      {
        text: t("components_overall-statistics_tabs_winratestab.vsorc"),
        sortable: false,
        align: "right",
      },
      {
        text: t("components_overall-statistics_tabs_winratestab.vsne"),
        sortable: false,
        align: "right",
      },
      {
        text: t("components_overall-statistics_tabs_winratestab.vsud"),
        sortable: false,
        align: "right",
      },
      {
        text: t("components_overall-statistics_tabs_winratestab.vsrdm"),
        sortable: false,
        align: "right",
      },
    ];

    const mmrs = computed<{ league: TranslateResult; mmr: number }[]>(() => {
      const mmrsSorted = statsPerRaceAndMap.value
        .map((r) => r.mmrRange)
        .sort()
        .reverse();
      const mapped = mmrsSorted.map((m) => ({
        league: t("mmrLeagueRanges.MMR_" + m),
        mmr: m,
      }));
      return mapped;
    });

    const maps = computed<{ mapId: string; mapName: TranslateResult }[]>(() => {
      const stats = statsPerRaceAndMap.value[0];
      if (!stats) return [];
      return stats.patchToStatsPerModes[selectedPatch.value].map((r) => {
        return { mapId: r.mapName, mapName: t("mapNames." + r.mapName) };
      });
    });

    const sortByRaceWithRandomLast = (a: { race: ERaceEnum }, b: { race: ERaceEnum }): number => {
      if (a.race === ERaceEnum.RANDOM) return 1;
      if (b.race === ERaceEnum.RANDOM) return -1;
      return a.race - b.race;
    };

    const raceWinrate = computed<Ratio[]>(() => {
      if (!statsPerRaceAndMap.value || !statsPerRaceAndMap.value[0] || !statsPerRaceAndMap.value[0].patchToStatsPerModes[selectedPatch.value]) {
        return [];
      }

      const statsPerMapAndRace = statsPerRaceAndMap.value
        .filter((r) => r.mmrRange === selectedMmr.value)[0]
        .patchToStatsPerModes[selectedPatch.value].filter(
          (r) => r.mapName === selectedMap.value
        )[0];

      if (!statsPerMapAndRace) return [];

      // Sort both the rows and columns by race.
      return statsPerMapAndRace.ratio
        .sort(sortByRaceWithRandomLast)
        .map((item) => ({ ...item, winLosses: [...item.winLosses].sort(sortByRaceWithRandomLast) }));
    });

    const patches = computed<string[]>(() => {
      if (statsPerRaceAndMap.value[0]) {
        const allowedPatches = ["All"];
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

        return allowedPatches;
      }
      return [];
    });

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

    function setSelectedMmr(mmr: number): void {
      selectedMmr.value = mmr;
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
      mmrs,
      selectedMmr,
      setSelectedMmr,
      patches,
      selectedPatch,
      setSelectedPatch,
      raceWinrate,
    };
  },
});
</script>
