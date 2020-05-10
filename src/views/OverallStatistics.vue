<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            <span>Statistics of W3Champions</span>
          </v-card-title>
          <v-tabs>
            <v-tabs-slider />
            <v-tab class="profileTab" :href="`#tab-games-per-day`"
              >Games Per Day</v-tab
            >
            <v-tab class="profileTab" :href="`#tab-players-per-day`"
              >Players Per Day</v-tab
            >
            <v-tab class="profileTab" :href="`#tab-winrates-per-race-and-map`"
              >Winrates</v-tab
            >
            <v-tab class="profileTab" :href="`#tab-heroes`"
              >Heroes</v-tab
            >
<!--            <v-tab class="profileTab" :href="`#tab-heroes-winrates`"-->
<!--              >Heroe Winrates</v-tab-->
<!--            >-->
            <v-tab class="profileTab" :href="`#tab-gametimes`"
              >Gamelengths</v-tab
            >
            <v-tab class="profileTab" :href="`#tab-popular-game-hours`"
              >Popular Hours</v-tab
            >
            <v-tab-item :value="'tab-games-per-day'">
              <v-card-text v-if="!loadingGamesPerDayStats">
                <amount-per-day-chart
                  class="ammount-per-day-chart"
                  :game-days="gameDays"
                />
              </v-card-text>
            </v-tab-item>
            <v-tab-item :value="'tab-players-per-day'">
              <v-card-text v-if="!loadingPlayersPerDayStats">
                <amount-per-day-chart
                  class="ammount-per-day-chart"
                  :game-days="playersPerDay"
                />
              </v-card-text>
            </v-tab-item>
            <v-tab-item :value="'tab-winrates-per-race-and-map'">
              <v-row>
                <v-col cols="md-3">
                  <v-card-text v-if="!loadingMapAndRaceStats">
                    <v-select
                      :items="maps"
                      item-text="mapName"
                      item-value="mapId"
                      @change="setSelectedMap"
                      label="Select Map"
                      outlined
                    />
                  </v-card-text>
                </v-col>
                <v-col cols="md-9">
                  <v-card-text v-if="!loadingMapAndRaceStats">
                    <v-data-table
                      hide-default-footer
                      :headers="headers"
                      :items="raceWinrateWithoutRandom"
                      :mobile-breakpoint="400"
                    >
                      <template v-slot:body="{ items }">
                        <tbody>
                          <tr v-for="item in items" :key="item.race">
                            <td>{{ $t("races." + raceEnums[item.race]) }}</td>
                            <v-tooltip top>
                              <template v-slot:activator="{ on }">
                                <td v-on="on" class="number-text">{{ winrateText(item.winLosses[1]) }}</td>
                              </template>
                              <div>
                                {{ winAndLossText(item.winLosses[1]) }}
                              </div>
                            </v-tooltip>
                            <v-tooltip top>
                              <template v-slot:activator="{ on }">
                                <td v-on="on" class="number-text">{{ winrateText(item.winLosses[2]) }}</td>
                              </template>
                              <div>
                                {{ winAndLossText(item.winLosses[2]) }}
                              </div>
                            </v-tooltip>
                            <v-tooltip top>
                              <template v-slot:activator="{ on }">
                                <td v-on="on" class="number-text">{{ winrateText(item.winLosses[3]) }}</td>
                              </template>
                              <div>
                                {{ winAndLossText(item.winLosses[3]) }}
                              </div>
                            </v-tooltip>
                            <v-tooltip top>
                              <template v-slot:activator="{ on }">
                                <td v-on="on" class="number-text">{{ winrateText(item.winLosses[4]) }}</td>
                              </template>
                              <div>
                                {{ winAndLossText(item.winLosses[4]) }}
                              </div>
                            </v-tooltip>
                          </tr>
                        </tbody>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-col>
              </v-row>
            </v-tab-item>
            <v-tab-item :value="'tab-heroes'">
              <v-row>
                <v-col cols="md-6">
                  <v-card-text class="over-chart-select-box-container">
                    <v-select
                            class="mr-5"
                            :items="gameModes"
                            item-text="modeName"
                            item-value="modeId"
                            @change="setSelectedHeroesPlayedMode"
                            label="Mode"
                            outlined
                    />
                    <v-select
                            class="ml-5"
                            :items="picks"
                            item-text="pickName"
                            item-value="pickId"
                            @change="setSelectedHeroesPlayedPick"
                            label="Pick"
                            outlined
                    />
                  </v-card-text>
                </v-col>
                <v-col cols="md-12">
                    <v-card-text>
                        <played-heroes-chart :played-heroes="selectedPlayedHeroes"/>
                    </v-card-text>
                </v-col>
              </v-row>
            </v-tab-item>
<!--            <v-tab-item :value="'tab-heroes-winrates'">-->
<!--              <v-row>-->
<!--                <v-col cols="12">-->
<!--                  <hero-winrate />-->
<!--                </v-col>-->
<!--              </v-row>-->
<!--            </v-tab-item>-->
            <v-tab-item :value="'tab-gametimes'">
              <v-row>
                <v-col cols="md-3">
                  <v-card-text>
                    <v-select
                            :items="gameModes"
                            item-text="modeName"
                            item-value="modeId"
                            @change="setSelectedLengthMode"
                            label="Select Mode"
                            outlined
                    />
                  </v-card-text>
                </v-col>
                <v-col cols="md-12">
                  <v-card-text>
                    <game-length-chart
                            class="ammount-per-day-chart"
                            :game-length="selectedGameLength"
                    />
                  </v-card-text>
                </v-col>
              </v-row>
            </v-tab-item>
            <v-tab-item :value="'tab-popular-game-hours'">
              <v-row>
                <v-col cols="md-3">
                  <v-card-text>
                    <v-select
                            :items="gameModes"
                            item-text="modeName"
                            item-value="modeId"
                            @change="setSelectedModeGameHour"
                            label="Select Mode"
                            outlined
                    />
                  </v-card-text>
                </v-col>
                <v-col cols="md-12">
                  <v-card-text>
                    <popular-game-time-chart
                            :popular-game-hour="selectedGameHours"
                    />
                  </v-card-text>
                </v-col>
              </v-row>
            </v-tab-item>
          </v-tabs>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import AmountPerDayChart from "@/components/overal-statistics/AmountPerDayChart.vue";
import Vue from "vue";
import { Component } from "vue-property-decorator";
import {
  GameDay,
  GameLength,
  PlayedHero,
  PopularGameHour,
  RaceWinLoss,
  Ratio,
  StatsPerMapAndRace
} from "@/store/overallStats/types";
import { EGameMode, EPick, ERaceEnum } from "@/store/typings";
import GameLengthChart from "@/components/overal-statistics/GameLengthChart.vue";
import PopularGameTimeChart from "@/components/overal-statistics/PopularGameTimeChart.vue";
import PlayedHeroesChart from "@/components/overal-statistics/PlayedHeroesChart.vue";
import HeroWinrate from "@/components/overal-statistics/HeroWinrate.vue";

@Component({
  components: {
    HeroWinrate,
    PlayedHeroesChart,
    PopularGameTimeChart,
    AmountPerDayChart,
    GameLengthChart
  }
})
export default class OverallStatisticsView extends Vue {
  public raceEnums = ERaceEnum;

  public selectedMap = "Overall";
  public selectedLengthMode = EGameMode.GM_1ON1;
  public selectedPopularHourMode = EGameMode.GM_1ON1;
  public selectedHeroesPlayedMode = EGameMode.GM_1ON1;
  public selectedHeroesPlayedPick = 0;

  public setSelectedMap(map: string) {
    this.selectedMap = map;
  }

  public setSelectedHeroesPlayedPick(pick: number) {
    this.selectedHeroesPlayedPick = pick;
  }

  public setSelectedHeroesPlayedMode(mode: EGameMode) {
    this.selectedHeroesPlayedMode = mode;
  }

  public setSelectedLengthMode(mode: EGameMode) {
    this.selectedLengthMode = mode;
  }

  public setSelectedModeGameHour(mode: EGameMode) {
    this.selectedPopularHourMode = mode;
  }

  public winrateText(item: RaceWinLoss) {
    return `${(item.winrate * 100).toFixed(1)}%`;
  }

  public winAndLossText(item: RaceWinLoss) {
    return `(${item.wins}/${item.losses})`;
  }

  get loadingMapAndRaceStats(): boolean {
    return this.$store.direct.state.overallStatistics.loadingMapAndRaceStats;
  }

  get loadingGamesPerDayStats(): boolean {
    return this.$store.direct.state.overallStatistics.loadingGamesPerDayStats;
  }

  get loadingPlayersPerDayStats(): boolean {
    return this.$store.direct.state.overallStatistics.loadingPlayersPerDayStats;
  }

  get gameDays(): GameDay[] {
    return this.$store.direct.state.overallStatistics.gamesPerDay.reverse();
  }

  get playersPerDay(): GameDay[] {
    return this.$store.direct.state.overallStatistics.playersPerDay.reverse();
  }

  get gameLength(): GameLength[] {
    return this.$store.direct.state.overallStatistics.gameLengths;
  }

  get popularGameHours(): PopularGameHour[] {
    return this.$store.direct.state.overallStatistics.popularGameHours;
  }

  get selectedGameLength(): GameLength {
    return this.gameLength.filter(g => g.gameMode == this.selectedLengthMode)[0];
  }

  get selectedGameHours(): PopularGameHour {
    return this.popularGameHours.filter(
      g => g.gameMode == this.selectedPopularHourMode
    )[0];
  }

  get selectedPlayedHeroes(): PlayedHero[] {
    const heroes = this.$store.direct.state.overallStatistics.playedHeroes;
    if (heroes.length === 0) return [];
    return heroes.filter(g => g.gameMode == this.selectedHeroesPlayedMode)[0].orderedPicks[this.selectedHeroesPlayedPick].stats ?? [];
  }

  get statsPerRaceAndMap(): StatsPerMapAndRace[] {
    return this.$store.direct.state.overallStatistics.statsPerMapAndRace;
  }

  get raceWinrateWithoutRandom(): Ratio[] {
    return this.statsPerRaceAndMap
      .filter(r => r.mapName == this.selectedMap)[0]
      .ratio.slice(1, 5);
  }

  get maps() {
    return this.statsPerRaceAndMap.map(r => {
      return { mapId: r.mapName, mapName: this.$t("mapNames." + r.mapName) };
    });
  }

  get gameModes() {
    return [
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_1ON1]}`),
        modeId: EGameMode.GM_1ON1
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2_AT]}`),
        modeId: EGameMode.GM_2ON2_AT
      },
      // {
      //   modeName: "4vs4",
      //   modeId: EGameMode.GM_4ON4
      // },
      // {
      //   modeName: "FFA",
      //   modeId: EGameMode.GM_FFA
      // }
    ];
  }

  get picks() {
    return [
      {
        pickName: "overall",
        pickId: EPick.OVERALL
      },
      {
        pickName: "first",
        pickId: EPick.FIRST
      },
      {
        pickName: "second",
        pickId: EPick.SECOND
      },
      {
        pickName: "third",
        pickId: EPick.THIRD
      },
    ];
  }

  mounted() {
    this.init();
  }

  private async init() {
    await this.$store.direct.dispatch.overallStatistics.loadGamesPerDayStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadPlayersPerDayStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadMapAndRaceStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadGameLengthStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadpopularGameHours();
    await this.$store.direct.dispatch.overallStatistics.loadPlayedHeroes();
  }

  public headers = [
    {
      text: "",
      align: "start",
      sortable: false,
      value: "race"
    },
    {
      text: "VS Human",
      align: "start",
      sortable: false
    },
    {
      text: "VS Orc",
      align: "start",
      sortable: false
    },
    {
      text: "VS Undead",
      align: "start",
      sortable: false
    },
    {
      text: "VS Night Elf",
      align: "start",
      sortable: false
    }
  ];
}
</script>

<style type="text/css" scoped>
.over-chart-select-box {
  position: absolute;
  z-index: 10;
  margin-left: 80px !important;
  width: 100px;
}

.over-chart-select-box-container {
  display: flex;
  flex-direction: row;
}
</style>
