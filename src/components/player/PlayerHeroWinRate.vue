<template>
  <v-tabs v-model="selectedTab">
    <v-tabs-slider />
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
            <div>
              <v-simple-table>
                <template #:default>
                  <thead>
                    <tr>
                      <th v-for="header in headers" :key="header.value" :class="`text-${header.align}`">
                        {{ header.text }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in heroStatsCurrentPage" :key="item.hero">
                      <td v-html="item.image"></td>
                      <td v-html="item.name"></td>
                      <v-tooltip v-for="header in headersWithoutImageAndName" :key="header.value" top>
                        <template #:activator="{ on }">
                          <td :class="[...getWinRateClass(item, header.value), 'text-right']" v-on="on" v-html="item[header.value]"></td>
                        </template>
                        <div v-if="item.numbers_by_race[header.value]">
                          <span class="number-text won">{{ item.numbers_by_race[header.value].number }}W</span>
                          -
                          <span class="number-text lost">{{ item.numbers_by_race[header.value].total - item.numbers_by_race[header.value].number }}L</span>
                          &nbsp;&nbsp;
                          {{ $t("common.total") }} <span class="number-text">{{ item.numbers_by_race[header.value].total }}</span>
                        </div>
                      </v-tooltip>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>

              <v-pagination
                v-if="pageLength > 1"
                v-model="page"
                :length="pageLength"
                :prev-icon="mdiMenuLeft"
                :next-icon="mdiMenuRight"
              />
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-tab-item>
  </v-tabs>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { getAsset } from "@/helpers/url-functions";
import RaceIcon from "@/components/player/RaceIcon.vue";
import { PlayerStatsHeroOnMapVersusRace, PlayerHeroWinRateForStatisticsTab, RaceWinsOnMap } from "@/store/player/types";
import { ERaceEnum } from "@/store/types";
import { defaultStatsTab } from "@/helpers/profile";
import { racesWithTotal } from "@/helpers/general";
import { usePlayerStore } from "@/store/player/store";
import { mdiMenuLeft, mdiMenuRight } from "@mdi/js";

export default defineComponent({
  name: "PlayerHeroWinRate",
  components: {
    RaceIcon,
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
    winThreshold: {
      type: Number,
      required: false,
      default: undefined,
    },
    lossThreshold: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const playerStore = usePlayerStore();
    const paginationSize = 16;
    const page = ref<number>(1);
    const selectedRace = computed(() => Number(selectedTab.value.split("-")[1]));
    const pageOffset = computed(() => paginationSize * page.value);
    const pageLength = computed(() => Math.ceil(heroWinRates().length / paginationSize));
    const heroStatsCurrentPage = computed(() => heroWinRates().slice((pageOffset.value - paginationSize), pageOffset.value));

    const selectedTab = ref<string>(defaultStatsTab(playerStore.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch?.All));

    watch(() => playerStore.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch?.All,
        (newData: RaceWinsOnMap[]) => {
          selectedTab.value = defaultStatsTab(newData);
        }
    );

    function getWinRateClass(heroStats: PlayerHeroWinRateForStatisticsTab, raceEnum: ERaceEnum): string[] {
      const classes: string[] = [];
      const raceStats = heroStats.numbers_by_race[raceEnum];

      if (!raceStats || raceStats.total === 0) {
        classes.push("stats-empty");
        return classes;
      }

      const winrate = raceStats.number / raceStats.total;
      if (winrate > (props.winThreshold || 0.6)) {
        classes.push("won");
      }
      if (winrate < (props.lossThreshold || 0.4)) {
        classes.push("lost");
      }

      return classes;
    }

    const headers = [
      { text: "", value: "image", align: "left" },
      { text: "Hero", value: "name", align: "left" },
      { text: "Total", value: ERaceEnum.TOTAL, align: "right" },
      { text: "vs. Human", value: ERaceEnum.HUMAN, align: "right" },
      { text: "vs. Orc", value: ERaceEnum.ORC, align: "right" },
      { text: "vs. Night Elf", value: ERaceEnum.NIGHT_ELF, align: "right" },
      { text: "vs. Undead", value: ERaceEnum.UNDEAD, align: "right" },
      { text: "vs. Random", value: ERaceEnum.RANDOM, align: "right" },
    ];

    const headersWithoutImageAndName = headers.slice(2) as { text: string; value: ERaceEnum; align: "left" | "center" | "right" }[];

    function getImageForTable(heroId: string): string {
      const src: string = getAsset(`heroes/${heroId}.png`);
      return `<img class="mt-1" src="${src}" height="40" width="40" />`;
    }

    function heroWinRates(): PlayerHeroWinRateForStatisticsTab[] {
      const heroStatsItemList = props.playerStatsHeroVersusRaceOnMap.heroStatsItemList;
      if (!heroStatsItemList) {
        return [];
      }
      let hasData = false;
      heroStatsItemList.map((item) => {
        const filteredByMap = item.stats
          .filter((byRace) => byRace.race == selectedRace.value)[0]
          .winLossesOnMap.filter((byMap) => byMap.map == props.selectedMap)[0];
        hasData = hasData || Boolean(filteredByMap);
      });
      if (!hasData) {
        return [];
      }
      const resp: PlayerHeroWinRateForStatisticsTab[] = [];
      heroStatsItemList.map((item) => {
        let total = 0;
        let wins = 0;
        const playerWinRate = {
          hero: item.heroId,
          name: t(`heroNames.${item.heroId}`).toString(),
          image: getImageForTable(item.heroId),
          numbers_by_race: {
            [ERaceEnum.UNDEAD]: { number: 0, total: 0 },
            [ERaceEnum.ORC]: { number: 0, total: 0 },
            [ERaceEnum.NIGHT_ELF]: { number: 0, total: 0 },
            [ERaceEnum.HUMAN]: { number: 0, total: 0 },
            [ERaceEnum.RANDOM]: { number: 0, total: 0 },
            [ERaceEnum.TOTAL]: { number: 0, total: 0 },
            [ERaceEnum.STARTER]: { number: 0, total: 0 },
          },
          [ERaceEnum.TOTAL]: "",
          [ERaceEnum.UNDEAD]: "",
          [ERaceEnum.ORC]: "",
          [ERaceEnum.HUMAN]: "",
          [ERaceEnum.NIGHT_ELF]: "",
          [ERaceEnum.RANDOM]: "",
          [ERaceEnum.STARTER]: "",
        };
        const filtered = item.stats
          .filter((byRace) => byRace.race == selectedRace.value)[0]
          .winLossesOnMap
          .filter((byMap) => byMap.map == props.selectedMap)[0];
        if (!filtered) {
          return;
        }
        filtered
          .winLosses
          .map((winLoss) => {
            playerWinRate.numbers_by_race[winLoss.race] = {
              number: winLoss.wins,
              total: winLoss.games,
            };
            playerWinRate[winLoss.race] = "-";
            if (winLoss.games > 0) {
              playerWinRate[winLoss.race] = `${(winLoss.winrate * 100).toFixed(2)}%`;
            }
            total += winLoss.games;
            wins += winLoss.wins;
          });
        playerWinRate[ERaceEnum.TOTAL] = `${((wins / total) * 100).toFixed(2)}%`;
        playerWinRate.numbers_by_race[ERaceEnum.TOTAL] = {
          number: wins,
          total: total,
        };
        resp.push(playerWinRate);
      }) || [];
      return resp.sort((a, b) => b.numbers_by_race[ERaceEnum.TOTAL].total - a.numbers_by_race[ERaceEnum.TOTAL].total);
    }

    return {
      mdiMenuLeft,
      mdiMenuRight,
      ERaceEnum,
      racesWithTotal,
      selectedTab,
      heroStatsCurrentPage,
      headers,
      headersWithoutImageAndName,
      page,
      pageLength,
      getWinRateClass,
    };
  },
});
</script>
