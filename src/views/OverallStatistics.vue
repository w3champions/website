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
            <v-tab class="profileTab" :href="`#tab-1`">Games Per Day</v-tab>
            <v-tab class="profileTab" :href="`#tab-2`">Players Per Day</v-tab>
            <v-tab class="profileTab" :href="`#tab-3`">Winrates</v-tab>
            <v-tab-item :value="'tab-1'">
              <v-card-text v-if="!loadingGamesPerDayStats">
                <amount-per-day-chart
                  class="ammount-per-day-chart"
                  :game-days="gameDays"
                />
              </v-card-text>
            </v-tab-item>
            <v-tab-item :value="'tab-2'">
              <v-card-text v-if="!loadingPlayersPerDayStats">
                <amount-per-day-chart
                  class="ammount-per-day-chart"
                  :game-days="playersPerDay"
                />
              </v-card-text>
            </v-tab-item>
            <v-tab-item :value="'tab-3'">
              <v-row>
                <v-col cols="3">
                  <v-card-text v-if="!loadingMapAndRaceStats">
                    <v-select
                      :items="maps"
                      @change="setSelectedMap"
                      label="Select Map"
                      outlined
                    />
                  </v-card-text>
                </v-col>
                <v-col cols="9">
                  <v-card-text v-if="!loadingMapAndRaceStats">
                    <v-data-table
                      hide-default-footer
                      :headers="headers"
                      :items="raceWinrateWithoutRandom"
                    >
                      <template v-slot:body="{ items }">
                        <tbody>
                          <tr v-for="item in items" :key="item.race">
                            <td>{{ $t("races." + raceEnums[item.race]) }}</td>
                            <td>{{ winrateText(item.winLosses[1]) }}</td>
                            <td>{{ winrateText(item.winLosses[2]) }}</td>
                            <td>{{ winrateText(item.winLosses[3]) }}</td>
                            <td>{{ winrateText(item.winLosses[4]) }}</td>
                          </tr>
                        </tbody>
                      </template>
                    </v-data-table>
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
import AmountPerDayChart from "@/components/AmountPerDayChart.vue";
import Vue from "vue";
import { Component } from "vue-property-decorator";
import {
  GameDay,
  Ratio,
  StatsPerMapAndRace,
  WinLoss
} from "@/store/overallStats/types";
import { ERaceEnum } from "@/store/typings";

@Component({
  components: {
    AmountPerDayChart
  }
})
export default class OverallStatisticsView extends Vue {
  public raceEnums = ERaceEnum;

  public selectedMap = "Overall";

  public setSelectedMap(map: string) {
    this.selectedMap = map;
  }

  public winrateText(item: WinLoss) {
    return `${(item.winrate * 100).toFixed(1)}% (${item.wins}/${item.losses})`;
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

  get statsPerRaceAndMap(): StatsPerMapAndRace[] {
    return this.$store.direct.state.overallStatistics.statsPerMapAndRace;
  }

  get raceWinrateWithoutRandom(): Ratio[] {
    return this.statsPerRaceAndMap
      .filter(r => r.mapName == this.selectedMap)[0]
      .ratio.slice(1, 5);
  }

  get maps() {
    return this.statsPerRaceAndMap.map(r => r.mapName);
  }

  mounted() {
    this.init();
  }

  private async init() {
    await this.$store.direct.dispatch.overallStatistics.loadGamesPerDayStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadPlayersPerDayStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadMapAndRaceStatistics();
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

<style type="text/css">
.ammount-per-day-chart {
  height: 650px;
}
</style>
