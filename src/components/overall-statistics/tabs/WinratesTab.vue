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
            @change="setSelectedMap"
            :label="$t(`components_overall-statistics_tabs_winratestab.selectmap`)"
            outlined
          />
          <v-select
            v-model="selectedMmr"
            :items="mmrs"
            item-text="league"
            item-value="mmr"
            @change="setSelectedMmr"
            :label="$t(`components_overall-statistics_tabs_winratestab.selectmmr`)"
            outlined
          />
          <v-select
            :items="patches"
            item-text="patchVersion"
            item-value="patch"
            v-model="selectedPatch"
            @change="setSelectedPatch"
            :label="$t(`components_overall-statistics_tabs_winratestab.selectpatch`)"
            outlined
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
                    :stats="item.winLosses[1]"
                    :compareRace="item.race"
                    :winThreshold="0.51"
                    :lossThreshold="0.49"
                  />
                  <player-stats-race-versus-race-on-map-table-cell
                    :stats="item.winLosses[2]"
                    :compareRace="item.race"
                    :winThreshold="0.51"
                    :lossThreshold="0.49"
                  />
                  <player-stats-race-versus-race-on-map-table-cell
                    :stats="item.winLosses[3]"
                    :compareRace="item.race"
                    :winThreshold="0.51"
                    :lossThreshold="0.49"
                  />
                  <player-stats-race-versus-race-on-map-table-cell
                    :stats="item.winLosses[4]"
                    :compareRace="item.race"
                    :winThreshold="0.51"
                    :lossThreshold="0.49"
                  />
                  <player-stats-race-versus-race-on-map-table-cell
                    :stats="item.winLosses[0]"
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
import { computed, ComputedRef, defineComponent, ref } from "vue";
import { i18n } from "@/main";
import { TranslateResult } from "vue-i18n";
import PlayerStatsRaceVersusRaceOnMapTableCell from "@/components/player/PlayerStatsRaceVersusRaceOnMapTableCell.vue";
import { Ratio, StatsPerMapAndRace, StatsPerWinrate } from "@/store/overallStats/types";
import { ERaceEnum } from "@/store/types";
import { useOverallStatsStore } from "@/store/overallStats/store";

interface WinratesTabHeader {
  text: TranslateResult;
  align: string;
  sortable: boolean;
}

export default defineComponent({
  name: "WinratesTab",
  components: {
    PlayerStatsRaceVersusRaceOnMapTableCell,
  },
  props: {},
  setup() {
    const overallStatsStore = useOverallStatsStore();
    const raceEnums = ERaceEnum;
    const selectedPatch = ref<string>("All");
    const selectedMmr = ref<number>(0);
    const selectedMap = ref<TranslateResult>(i18n.t("common.overall"));
    const statsPerRaceAndMap: ComputedRef<StatsPerWinrate[]> = computed((): StatsPerWinrate[] => overallStatsStore.statsPerMapAndRace);

    const headers: WinratesTabHeader[] = [
      {
        text: "",
        align: "start",
        sortable: false,
      },
      {
        text: i18n.t("components_overall-statistics_tabs_winratestab.vshu"),
        align: "start",
        sortable: false,
      },
      {
        text: i18n.t("components_overall-statistics_tabs_winratestab.vsorc"),
        align: "start",
        sortable: false,
      },
      {
        text: i18n.t("components_overall-statistics_tabs_winratestab.vsud"),
        align: "start",
        sortable: false,
      },
      {
        text: i18n.t("components_overall-statistics_tabs_winratestab.vsne"),
        align: "start",
        sortable: false,
      },
      {
        text: i18n.t("components_overall-statistics_tabs_winratestab.vsrdm"),
        align: "start",
        sortable: false,
      },
    ];

    const mmrs: ComputedRef<{ league: TranslateResult; mmr: number }[]> = computed((): { league: TranslateResult; mmr: number }[] => {
      const mmrsSorted = statsPerRaceAndMap.value
        .map((r) => r.mmrRange)
        .sort()
        .reverse();
      const mapped = mmrsSorted.map((m) => ({
        league: i18n.t("mmrLeagueRanges.MMR_" + m),
        mmr: m,
      }));
      return mapped;
    });

    const maps: ComputedRef<{ mapId: string; mapName: TranslateResult }[]> = computed((): { mapId: string; mapName: TranslateResult }[] => {
      const stats = statsPerRaceAndMap.value[0];
      if (!stats) return [];
      return stats.patchToStatsPerModes[selectedPatch.value].map((r) => {
        return { mapId: r.mapName, mapName: i18n.t("mapNames." + r.mapName) };
      });
    });

    const raceWinrate: ComputedRef<Ratio[]> = computed((): Ratio[] => {
      if (!statsPerRaceAndMap.value || !statsPerRaceAndMap.value[0] || !statsPerRaceAndMap.value[0].patchToStatsPerModes[selectedPatch.value]) {
        return [];
      }

      const statsPerMapAndRace = statsPerRaceAndMap.value
        .filter((r) => r.mmrRange === selectedMmr.value)[0]
        .patchToStatsPerModes[selectedPatch.value].filter(
          (r) => r.mapName === selectedMap.value
        )[0];

      if (!statsPerMapAndRace) return [];

      return statsPerMapAndRace.ratio.slice(1, 5).concat(statsPerMapAndRace.ratio[0]);
    });

    const patches: ComputedRef<string[]> = computed((): string[] => {
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

    function setSelectedMmr(mmr: number) {
      selectedMmr.value = mmr;
    }

    function setSelectedPatch(patch: string) {
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
