<template>
  <v-tabs v-model="selectedTab">
    <v-tabs-slider></v-tabs-slider>
    <v-tab v-for="race of races" :key="race.raceId" :href="`#tab-${race.raceId}`">
      <span v-if="race.raceId === raceEnums.TOTAL">
        {{ $t("common.allraces") }}
      </span>
      <race-icon :race="race.raceId" />
    </v-tab>

    <v-tab-item
      v-for="race of races"
      :key="race.raceId"
      :value="'tab-' + race.raceId"
    >
      <v-card-text>
        <v-row>
          <v-col cols="md-12">
            <player-hero-statistics-table :hero-statistics="heroUsages"></player-hero-statistics-table>
          </v-col>
        </v-row>
      </v-card-text>
    </v-tab-item>
  </v-tabs>
</template>

<script lang="ts">
import Vue from "vue";
import RaceIcon from "@/components/player/RaceIcon.vue";
import PlayerHeroStatisticsTable from "@/components/player/PlayerHeroStatisticsTable.vue"
import { Component, Prop, Watch } from "vue-property-decorator";
import { getAsset } from "@/helpers/url-functions"
import { PlayerStatsHeroOnMapVersusRace, RaceWinsOnMap, WinLossesOnMap, RaceStat } from "@/store/player/types";
import { ERaceEnum } from "@/store/typings";

@Component({
  components: { RaceIcon, PlayerHeroStatisticsTable },
})
export default class PlayerHeroStatistics extends Vue {
  public selectedTab = "tab-16";
  public raceEnums = ERaceEnum;
  @Prop() playerStatsHeroVersusRaceOnMap!: PlayerStatsHeroOnMapVersusRace;
  @Prop() selectedMap!: string;

  get selectedRace() {
    return Number(this.selectedTab.split('-')[1]);
  }

  get isPlayerInitialized(): boolean {
    return this.$store.direct.state.player.isInitialized;
  }

  get heroUsages() {
    const heroStatsData = [];
    const heroStatsItemList = this.playerStatsHeroVersusRaceOnMap?.heroStatsItemList || [];
    let gamesSum = 0;
    for (const playerHeroStats of heroStatsItemList) {
      const rowObject = {
        id: playerHeroStats.heroId, 
        name: this.$t(`heroNames.${playerHeroStats.heroId}`).toString(),
        image: this.getImageForTable(playerHeroStats.heroId),
        hu: 0,
        orc: 0,
        ne: 0,
        ud: 0,
        rand: 0,
        total: 0,
      };
      playerHeroStats.stats.filter((raceWinOnMap: RaceWinsOnMap) => raceWinOnMap.race === this.selectedRace).map((raceWinOnMap: RaceWinsOnMap) => {
        const raceWinOnMapOverallFiltered = raceWinOnMap.winLossesOnMap.filter((winLossesOnMap: WinLossesOnMap) => winLossesOnMap.map === this.selectedMap);
        if (raceWinOnMapOverallFiltered.length === 0) return raceWinOnMap;
        raceWinOnMapOverallFiltered[0].winLosses.map((currentValue) => gamesSum += currentValue.games)
        raceWinOnMapOverallFiltered[0].winLosses.map(raceStat => {
          if(raceStat.race===ERaceEnum.HUMAN) rowObject.hu += raceStat.games
          else if(raceStat.race===ERaceEnum.ORC) rowObject.orc += raceStat.games
          else if(raceStat.race===ERaceEnum.NIGHT_ELF) rowObject.ne += raceStat.games
          else if(raceStat.race===ERaceEnum.UNDEAD) rowObject.ud += raceStat.games
          else if(raceStat.race===ERaceEnum.RANDOM) rowObject.rand += raceStat.games
          rowObject.total += raceStat.games
        })
        return raceWinOnMap;
      })
      heroStatsData.push(rowObject);
    }

    let tableData: any[] = [];

    this.populateDataForTable(tableData, heroStatsData, gamesSum);

    tableData = this.sortHeroStatsTableData(tableData);

    return tableData;
  }
  
  sortHeroStatsTableData(tableData: any[]) {
    return tableData.sort((a: any, b: any): number => {
      const aTotal = Number(a.total.replace('%', ''));
      const bTotal = Number(b.total.replace('%', ''));
      if (aTotal > bTotal) {
        return -1;
      }
      if (aTotal < bTotal) {
        return 1;
      }
      return 0;
    });
  }

  populateDataForTable(tableData: any[], heroStatsData: any[], gamesSum: number) {
    const totals: { [key: number]: number; } = {
      [ERaceEnum.HUMAN]: 0,
      [ERaceEnum.ORC]: 0,
      [ERaceEnum.NIGHT_ELF]: 0,
      [ERaceEnum.UNDEAD]: 0,
      [ERaceEnum.RANDOM]: 0,
      [ERaceEnum.TOTAL]: 0,
    };
    if (this.selectedRace != ERaceEnum.TOTAL) {
      const winLossesOnMap = this.$store.direct.state.player.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch.All
        .filter((obj: any) => obj.race == this.selectedRace)[0]
        .winLossesOnMap
        .filter((winLossesOnMap: WinLossesOnMap) => winLossesOnMap.map == this.selectedMap)[0];
      if (winLossesOnMap) {
        winLossesOnMap.winLosses
          .map((raceStat: RaceStat) => {
            totals[raceStat.race] += raceStat.games;
            totals[ERaceEnum.TOTAL] += raceStat.games;
          });
      }
    } else {
      this.$store.direct.state.player.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch.All
        .map((obj: any) => {
          const selectedMapData = obj.winLossesOnMap
            .filter((winLossesOnMap: WinLossesOnMap) => winLossesOnMap.map == this.selectedMap)[0]
            if (selectedMapData) {
              selectedMapData.winLosses
                .map((raceStat: RaceStat) => {
                  totals[raceStat.race] += raceStat.games;
                  totals[ERaceEnum.TOTAL] += raceStat.games;
              });
            }
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
        hu: totals[ERaceEnum.HUMAN] > 0 ? String((heroStat.hu*100/totals[ERaceEnum.HUMAN]).toFixed(2)) + '%' : 'N/A',
        orc: totals[ERaceEnum.ORC] > 0 ? String((heroStat.orc*100/totals[ERaceEnum.ORC]).toFixed(2)) + '%' : 'N/A',
        ne: totals[ERaceEnum.NIGHT_ELF] > 0 ? String((heroStat.ne*100/totals[ERaceEnum.NIGHT_ELF]).toFixed(2)) + '%' : 'N/A',
        ud: totals[ERaceEnum.UNDEAD] > 0 ? String((heroStat.ud*100/totals[ERaceEnum.UNDEAD]).toFixed(2)) + '%' : 'N/A',
        rand: totals[ERaceEnum.RANDOM] > 0 ? String((heroStat.rand*100/totals[ERaceEnum.RANDOM]).toFixed(2)) + '%' : 'N/A',
        total: totals[ERaceEnum.TOTAL] > 0 ? String((heroStat.total*100/totals[ERaceEnum.TOTAL]).toFixed(2)) + '%' : 'N/A',
      })
    });
  }

  getImageForTable(heroId: string) {
    const src: string = getAsset(`heroes/${heroId}.png`)
    return `<img class="player-hero-statistics-table__hero-image" src="${src}" height="40" width="40" />`
  }

  getHeroCell(name: string, heroId: string) {
    return `<span>${this.getImageForTable(heroId)}${name}</span>`
  }

  get races() {
    return [
      {
        raceName: this.$t(`races.${ERaceEnum[ERaceEnum.HUMAN]}`),
        raceId: ERaceEnum.HUMAN,
      },
      {
        raceName: this.$t(`races.${ERaceEnum[ERaceEnum.ORC]}`),
        raceId: ERaceEnum.ORC,
      },
      {
        raceName: this.$t(`races.${ERaceEnum[ERaceEnum.NIGHT_ELF]}`),
        raceId: ERaceEnum.NIGHT_ELF,
      },
      {
        raceName: this.$t(`races.${ERaceEnum[ERaceEnum.UNDEAD]}`),
        raceId: ERaceEnum.UNDEAD,
      },
      {
        raceName: this.$t(`races.${ERaceEnum[ERaceEnum.RANDOM]}`),
        raceId: ERaceEnum.RANDOM,
      },
      {
        raceName: this.$t(`races.${ERaceEnum[ERaceEnum.TOTAL]}`),
        raceId: ERaceEnum.TOTAL,
      },
    ];
  }
}
</script>
