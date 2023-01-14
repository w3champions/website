<template>
  <v-tabs v-model="selectedTab">
    <v-tabs-slider></v-tabs-slider>
    <v-tab v-for="race of races" :key="race.raceId" :href="`#tab-${race.raceId}`">
      <span v-if="race.raceId === raceEnums.TOTAL">
        {{ $t("common.allraces") }}
      </span>
      <race-icon v-else :race="race.raceId" />
    </v-tab>

    <v-tab-item v-for="race of races" :key="race.raceId" :value="'tab-' + race.raceId">
      <v-card-text>
        <v-row>
          <v-col cols="md-12">
            <div>
              <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th v-for="header in headers" :key="header.value" class="text-left">
                        {{ header.text }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in heroStatsCurrentPage" :key="item.hero">
                      <td v-for="header in headers" :key="header.value" v-html="item[header.value]"></td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>

              <v-pagination
                v-model="page"
                :length="pageLength"
                prev-icon="mdi-menu-left"
                next-icon="mdi-menu-right"
              ></v-pagination>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-tab-item>
  </v-tabs>
</template>

<script lang="ts">
import Vue from "vue";
import RaceIcon from "@/components/player/RaceIcon.vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { getAsset } from "@/helpers/url-functions";
import { PlayerStatsHeroOnMapVersusRace, PlayerHeroWinRateForStatisticsTab } from "@/store/player/types";
import { ERaceEnum } from "@/store/typings";

@Component({
  components: { RaceIcon },
})
export default class PlayerHeroWinRate extends Vue {
  public selectedTab = "tab-16";
  public raceEnums = ERaceEnum;
  public page = 1;
  public paginationSize = 10;
  @Prop() playerStatsHeroVersusRaceOnMap!: PlayerStatsHeroOnMapVersusRace;
  @Prop() selectedMap!: string;

  @Watch("isPlayerInitialized")
  onPlayerInitialized(): void {
    this.setSelectedTab();
  }

  setSelectedTab(): void {
    let maxRace = ERaceEnum.RANDOM;
    let maxGames = 0;
    this.$store.direct.state.player.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch.All
      .filter((s: any) => s.race !== ERaceEnum.TOTAL)
      .forEach((s: any) =>
        s.winLossesOnMap.forEach((w: any) => {
          const gamesOfRace = w.winLosses
            .map((wl: any) => wl.games)
            .reduce((a: any, b:any) => a + b, 0);

          if (maxGames < gamesOfRace) {
            maxRace = s.race;
            maxGames = gamesOfRace;
          }
        })
      );
    this.selectedTab = `tab-${maxRace}`;
  }

  get selectedRace() {
    return Number(this.selectedTab.split("-")[1]);
  }

  get isPlayerInitialized(): boolean {
    return this.$store.direct.state.player.isInitialized;
  }

  get headers() {
    return [
      { text: "", value: "image" },
      { text: "Hero", value: "name" },
      { text: "Total", value: ERaceEnum.TOTAL },
      { text: "vs. Human", value: ERaceEnum.HUMAN },
      { text: "vs. Orc", value: ERaceEnum.ORC },
      { text: "vs. Undead", value: ERaceEnum.UNDEAD },
      { text: "vs. Night Elf", value: ERaceEnum.NIGHT_ELF },
      { text: "vs. Random", value: ERaceEnum.RANDOM },
    ];
  }

  get pageOffset(): number {
    return this.paginationSize * this.page;
  }

  get pageLength(): number {
    return Math.ceil(this.heroWinRates.length / this.paginationSize);
  }

  get heroStatsCurrentPage(): PlayerHeroWinRateForStatisticsTab[] {
    return this.heroWinRates.slice((this.pageOffset - this.paginationSize), this.pageOffset);
  }

  get heroWinRates(): PlayerHeroWinRateForStatisticsTab[] {
    const heroStatsItemList = this.playerStatsHeroVersusRaceOnMap.heroStatsItemList;
    if (!heroStatsItemList) {
      return [];
    }
    let hasData = false;
    heroStatsItemList.map((item) => {
      const filteredByMap = item.stats
        .filter((byRace) => byRace.race == this.selectedRace)[0]
        .winLossesOnMap.filter((byMap) => byMap.map == this.selectedMap)[0];
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
        name: this.$t(`heroNames.${item.heroId}`).toString(),
        image: this.getImageForTable(item.heroId),
        [ERaceEnum.TOTAL]: "",
        [ERaceEnum.UNDEAD]: "",
        [ERaceEnum.ORC]: "",
        [ERaceEnum.HUMAN]: "",
        [ERaceEnum.NIGHT_ELF]: "",
        [ERaceEnum.RANDOM]: "",
        [ERaceEnum.STARTER]: "",
      };
      const filtered = item.stats
        .filter((byRace) => byRace.race == this.selectedRace)[0]
        .winLossesOnMap
        .filter((byMap) => byMap.map == this.selectedMap)[0];
      if (!filtered) {
        return;
      }
      filtered
        .winLosses
        .map((winLoss) => {
          playerWinRate[winLoss.race] = "-";
          if (winLoss.games > 0) {
            playerWinRate[winLoss.race] = `${(winLoss.winrate * 100).toFixed(2)}%`;
          }
          total += winLoss.games;
          wins += winLoss.wins;
        });
      playerWinRate[ERaceEnum.TOTAL] = `${((wins / total) * 100).toFixed(2)}%`;
      resp.push(playerWinRate);
    }) || [];
    return resp;
  }

  getImageForTable(heroId: string) {
    const src: string = getAsset(`heroes/${heroId}.png`);
    return `<img class="player-hero-statistics-table__hero-image" src="${src}" height="40" width="40" />`;
  }

  getHeroCell(name: string, heroId: string) {
    return `<span>${this.getImageForTable(heroId)}${name}</span>`;
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
