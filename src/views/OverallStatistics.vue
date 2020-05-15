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
              >Player Activity</v-tab
            >
            <v-tab class="profileTab" :href="`#tab-mmr-distribution`"
              >MMR</v-tab
            >
            <v-tab class="profileTab" :href="`#tab-winrates-per-race-and-map`"
              >Winrates</v-tab
            >
            <v-tab class="profileTab" :href="`#tab-heroes-winrates`"
              >Heroes</v-tab
            >
            <v-tab-item :value="'tab-games-per-day'">
              <v-card-title>Games per Day</v-card-title>
              <v-card-text v-if="!loadingGamesPerDayStats">
                <amount-per-day-chart
                  class="ammount-per-day-chart"
                  :game-days="gameDays"
                />
              </v-card-text>
              <v-card-title>Players per Day</v-card-title>

              <v-card-text v-if="!loadingPlayersPerDayStats">
              <amount-per-day-chart
                      class="ammount-per-day-chart"
                      :game-days="playersPerDay"
                />
              </v-card-text>

              <v-card-title>Popular Hours</v-card-title>
              <v-row>
                <v-col cols="12" md="2">
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
                <v-col cols="12" md="10">
                  <v-card-text>
                    <popular-game-time-chart
                            :popular-game-hour="selectedGameHours"
                    />
                  </v-card-text>
                </v-col>
              </v-row>

              <v-card-title>Game Lengths</v-card-title>
              <v-row>
                <v-col cols="12" md="2">
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
                <v-col cols="12" md="10">
                  <v-card-text>
                    <popular-game-time-chart
                            :popular-game-hour="selectedGameHours"
                    />
                  </v-card-text>
                </v-col>
              </v-row>
            </v-tab-item>
            <v-tab-item :value="'tab-mmr-distribution'">
              <v-row>
                <v-col cols="md-2">
                  <v-card-text v-if="!loadingMapAndRaceStats">
                    <v-select
                      :items="seasons"
                      item-text="id"
                      @change="setSelectedSeason"
                      label="Select Season"
                      return-object
                      outlined
                    />
                  </v-card-text>
                  <v-card-text>
                    Pink bars mark top 3%, 5%, 10%, 25% and 50% of players, green is you
                  </v-card-text>
                </v-col>
                <v-col cols="md-10">
                  <mmr-distribution-chart :mmr-distribution="mmrDistribution" :selected-season="selectedSeason"/>
                </v-col>
              </v-row>
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
                    <v-select
                      :items="mmrs"
                      item-text="league"
                      item-value="mmr"
                      @change="setSelectedMMR"
                      label="Select MMR"
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
                            <player-stats-race-versus-race-on-map-table-cell :stats="item.winLosses[1]" :compareRace="item.race" :winThreshold="0.51" :lossThreshold="0.49" />
                            <player-stats-race-versus-race-on-map-table-cell :stats="item.winLosses[2]" :compareRace="item.race" :winThreshold="0.51" :lossThreshold="0.49" />
                            <player-stats-race-versus-race-on-map-table-cell :stats="item.winLosses[3]" :compareRace="item.race" :winThreshold="0.51" :lossThreshold="0.49" />
                            <player-stats-race-versus-race-on-map-table-cell :stats="item.winLosses[4]" :compareRace="item.race" :winThreshold="0.51" :lossThreshold="0.49" />
                          </tr>
                        </tbody>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-col>
              </v-row>
            </v-tab-item>
            <v-tab-item :value="'tab-heroes-winrates'">
              <v-row>
                <v-col cols="12">
                  <hero-winrate />
                </v-col>
              </v-row>
              <v-card-title>Picked Heroes</v-card-title>
              <v-row>
                <v-col cols="12" md="2">
                  <v-card-text>
                    <v-select
                            :items="gameModes"
                            item-text="modeName"
                            item-value="modeId"
                            @change="setSelectedHeroesPlayedMode"
                            label="Mode"
                            outlined
                    />
                    <v-select
                            :items="picks"
                            item-text="pickName"
                            item-value="pickId"
                            @change="setSelectedHeroesPlayedPick"
                            label="Pick"
                            outlined
                    />
                  </v-card-text>
                </v-col>
                <v-col cols="12" md="10">
                  <v-card-text>
                    <played-heroes-chart :played-heroes="selectedPlayedHeroes"/>
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
  Ratio,
  StatsPerWinrate
} from "@/store/overallStats/types";
import { EGameMode, EPick, ERaceEnum } from "@/store/typings";
import GameLengthChart from "@/components/overal-statistics/GameLengthChart.vue";
import PopularGameTimeChart from "@/components/overal-statistics/PopularGameTimeChart.vue";
import PlayedHeroesChart from "@/components/overal-statistics/PlayedHeroesChart.vue";
import HeroWinrate from "@/components/overal-statistics/HeroWinrate.vue";
import PlayerStatsRaceVersusRaceOnMapTableCell from "@/components/player/PlayerStatsRaceVersusRaceOnMapTableCell.vue";
import {Season} from "@/store/ranking/types";
import MmrDistributionChart from "@/components/overal-statistics/MmrDistributionChart.vue";

@Component({
  components: {
    MmrDistributionChart,
    HeroWinrate,
    PlayedHeroesChart,
    PopularGameTimeChart,
    AmountPerDayChart,
    GameLengthChart,
    PlayerStatsRaceVersusRaceOnMapTableCell
  }
})
export default class OverallStatisticsView extends Vue {
  public raceEnums = ERaceEnum;

  public selectedMap = "Overall";
  public selectedMmr = 0;
  public selectedSeason: Season = {id: 0};
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

  get seasons() {
    return this.$store.direct.state.rankings.seasons;
  }

  public async setSelectedSeason(season: Season) {
    this.selectedSeason = season;
    await this.$store.direct.dispatch.overallStatistics.loadMmrDistribution(season.id);
  }

  get mmrDistribution() {
    return this.$store.direct.state.overallStatistics.mmrDistribution;
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

  get statsPerRaceAndMap(): StatsPerWinrate[] {
    return this.$store.direct.state.overallStatistics.statsPerMapAndRace;
  }

  get raceWinrateWithoutRandom(): Ratio[] {
    return this.statsPerRaceAndMap
      .filter(r => r.mmrRange === this.selectedMmr)[0]
      .statsPerModes.filter(r => r.mapName === this.selectedMap)[0]
      .ratio.slice(1, 5);
  }

  get mmrs() {
    const mmrsSorted = this.statsPerRaceAndMap.map(r => r.mmrRange).sort().reverse();
    const mapped = mmrsSorted.map(m => ({ league: this.$t("mmrLeagueRanges.MMR_" + m), mmr: m }));
    return mapped;
  }

  public setSelectedMMR(mmr: number) {
    this.selectedMmr = mmr;
  }

  get maps() {
    const stats = this.statsPerRaceAndMap[0];
    if (!stats) return []
    return stats.statsPerModes.map(r => {
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
    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    this.selectedSeason = this.seasons[0];

    await this.$store.direct.dispatch.overallStatistics.loadGamesPerDayStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadPlayersPerDayStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadMapAndRaceStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadGameLengthStatistics();
    await this.$store.direct.dispatch.overallStatistics.loadpopularGameHours();
    await this.$store.direct.dispatch.overallStatistics.loadPlayedHeroes();
    await this.$store.direct.dispatch.overallStatistics.loadMmrDistribution(this.$store.direct.state.rankings.selectedSeason.id);
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
