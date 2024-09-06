<template>
  <v-tabs v-model="selectedTab">
    <v-tabs-slider></v-tabs-slider>
    <v-tab v-for="race of racesWithTotal" :key="race.raceId" :href="`#tab-${race.raceId}`">
      <span v-if="race.raceId === ERaceEnum.TOTAL">
        {{ $t("common.allraces") }}
      </span>
      <race-icon v-else :race="race.raceId" />
    </v-tab>

    <v-tab-item v-for="race of racesWithTotal" :key="race.raceId" :value="'tab-' + race.raceId">
      <v-card-text>
        <v-row>
          <v-col cols="md-12">
            <player-hero-statistics-table :hero-statistics="heroUsages()"></player-hero-statistics-table>
          </v-col>
        </v-row>
      </v-card-text>
    </v-tab-item>
  </v-tabs>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, PropType } from "vue";
import { useI18n } from "vue-i18n";
import { getAsset } from "@/helpers/url-functions";
import RaceIcon from "@/components/player/RaceIcon.vue";
import PlayerHeroStatisticsTable from "@/components/player/PlayerHeroStatisticsTable.vue";
import { PlayerStatsHeroOnMapVersusRace, RaceWinsOnMap, WinLossesOnMap, RaceStat } from "@/store/player/types";
import { ERaceEnum } from "@/store/types";
import { defaultStatsTab } from "@/helpers/profile";
import { racesWithTotal } from "@/helpers/general";
import isEmpty from "lodash/isEmpty";
import { usePlayerStore } from "@/store/player/store";


export default defineComponent({
  name: "PlayerHeroStatistics",
  components: {
    RaceIcon,
    PlayerHeroStatisticsTable,
  },
  props: {
    playerStatsHeroVersusRaceOnMap: {
      type: Object as PropType<PlayerStatsHeroOnMapVersusRace>,
      required: true,
    },
    selectedMap: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const playerStore = usePlayerStore();

    const selectedRace: ComputedRef<number> = computed((): number => Number(selectedTab.value.split("-")[1]));

    const selectedTab: ComputedRef<string> = computed((): string => {
      return defaultStatsTab(playerStore.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch?.All);
    });

    function getImageForTable(heroId: string): string {
      const src: string = getAsset(`heroes/${heroId}.png`);
      return `<img class="mt-1" src="${src}" height="40" width="40" />`;
    }

    function heroUsages() {
      const heroStatsData = [];
      const heroStatsItemList = props.playerStatsHeroVersusRaceOnMap?.heroStatsItemList || [];
      let gamesSum = 0;
      for (const playerHeroStats of heroStatsItemList) {
        const rowObject = {
          id: playerHeroStats.heroId,
          name: t(`heroNames.${playerHeroStats.heroId}`).toString(),
          image: getImageForTable(playerHeroStats.heroId),
          hu: 0,
          orc: 0,
          ne: 0,
          ud: 0,
          rand: 0,
          total: 0,
        };
        playerHeroStats.stats
          .filter((raceWinOnMap: RaceWinsOnMap) => raceWinOnMap.race === selectedRace.value)
          .map((raceWinOnMap: RaceWinsOnMap) => {
            const raceWinOnMapOverallFiltered = raceWinOnMap.winLossesOnMap.filter(
              (winLossesOnMap: WinLossesOnMap) => winLossesOnMap.map === props.selectedMap
            );

            if (raceWinOnMapOverallFiltered.length === 0) return raceWinOnMap;
            raceWinOnMapOverallFiltered[0].winLosses.map((currentValue) => gamesSum += currentValue.games);
            raceWinOnMapOverallFiltered[0].winLosses.map((raceStat) => {
              if (raceStat.race === ERaceEnum.HUMAN) rowObject.hu += raceStat.games;
              else if (raceStat.race === ERaceEnum.ORC) rowObject.orc += raceStat.games;
              else if (raceStat.race === ERaceEnum.NIGHT_ELF) rowObject.ne += raceStat.games;
              else if (raceStat.race === ERaceEnum.UNDEAD) rowObject.ud += raceStat.games;
              else if (raceStat.race === ERaceEnum.RANDOM) rowObject.rand += raceStat.games;
              rowObject.total += raceStat.games;
            });
            return raceWinOnMap;
          });
        heroStatsData.push(rowObject);
      }

      let tableData: any[] = [];

      populateDataForTable(tableData, heroStatsData);

      tableData = sortHeroStatsTableData(tableData);

      return tableData;
    }

    function sortHeroStatsTableData(tableData: any[]): any[] {
      return tableData.sort((a: any, b: any): number => {
        const aTotal = Number(a.total.replace("%", ""));
        const bTotal = Number(b.total.replace("%", ""));
        if (aTotal > bTotal) {
          return -1;
        }
        if (aTotal < bTotal) {
          return 1;
        }
        return 0;
      });
    }

    function populateDataForTable(tableData: any[], heroStatsData: any[]) {
      const totals: { [key: number]: number } = {
        [ERaceEnum.HUMAN]: 0,
        [ERaceEnum.ORC]: 0,
        [ERaceEnum.NIGHT_ELF]: 0,
        [ERaceEnum.UNDEAD]: 0,
        [ERaceEnum.RANDOM]: 0,
        [ERaceEnum.TOTAL]: 0,
      };

      if (isEmpty(heroStatsData)) return;

      const winLossesOnMap = playerStore.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch.All
        .filter((obj: RaceWinsOnMap) => obj.race == selectedRace.value)[0]
        .winLossesOnMap
        .filter((winLossesOnMap: WinLossesOnMap) => winLossesOnMap.map == props.selectedMap)[0];
      if (winLossesOnMap) {
        winLossesOnMap.winLosses
          .map((raceStat: RaceStat) => {
            totals[raceStat.race] += raceStat.games;
            totals[ERaceEnum.TOTAL] += raceStat.games;
          });
      }
      heroStatsData.map((heroStat) => {
        if (heroStat.total === 0) {
          return;
        }
        tableData.push({
          id: heroStat.id,
          name: heroStat.name,
          image: heroStat.image,
          numbers_by_race: {
            hu: { total: totals[ERaceEnum.HUMAN], number: heroStat.hu },
            orc: { total: totals[ERaceEnum.ORC], number: heroStat.orc },
            ud: { total: totals[ERaceEnum.UNDEAD], number: heroStat.ud },
            ne: { total: totals[ERaceEnum.NIGHT_ELF], number: heroStat.ne },
            rand: { total: totals[ERaceEnum.RANDOM], number: heroStat.rand },
            total: { total: totals[ERaceEnum.TOTAL], number: heroStat.total },
          },
          hu: totals[ERaceEnum.HUMAN] > 0 ? String((heroStat.hu * 100 / totals[ERaceEnum.HUMAN]).toFixed(2)) + "%" : "N/A",
          orc: totals[ERaceEnum.ORC] > 0 ? String((heroStat.orc * 100 / totals[ERaceEnum.ORC]).toFixed(2)) + "%" : "N/A",
          ne: totals[ERaceEnum.NIGHT_ELF] > 0 ? String((heroStat.ne * 100 / totals[ERaceEnum.NIGHT_ELF]).toFixed(2)) + "%" : "N/A",
          ud: totals[ERaceEnum.UNDEAD] > 0 ? String((heroStat.ud * 100 / totals[ERaceEnum.UNDEAD]).toFixed(2)) + "%" : "N/A",
          rand: totals[ERaceEnum.RANDOM] > 0 ? String((heroStat.rand * 100 / totals[ERaceEnum.RANDOM]).toFixed(2)) + "%" : "N/A",
          total: totals[ERaceEnum.TOTAL] > 0 ? String((heroStat.total * 100 / totals[ERaceEnum.TOTAL]).toFixed(2)) + "%" : "N/A",
        });
      });
    }

    return {
      selectedTab,
      racesWithTotal,
      ERaceEnum,
      heroUsages,
    };
  },
});
</script>
