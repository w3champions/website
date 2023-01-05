<template>
  <div>
    <v-card-title>Games per Day</v-card-title>
    <v-card-text v-if="!loadingGamesPerDayStats">
      <v-row>
        <v-col cols="12" md="2">
          <v-card-text>
            <v-select
              v-model="selectedGamesPerDayMode"
              :items="gameModesWithAll"
              item-text="modeName"
              item-value="modeId"
              @change="setSelectedGamesPerDayMode"
              :label="
                $t(
                  `components_overall-statistics_tabs_playeractivitytab.selectmode`
                )
              "
              outlined
            />
          </v-card-text>
          <div v-if="isAllMode">
            {{
              $t(
                "components_overall-statistics_tabs_playeractivitytab.gamemodedesc1"
              )
            }}
            <br />
            {{
              $t(
                "components_overall-statistics_tabs_playeractivitytab.gamemodedesc2"
              )
            }}
          </div>
        </v-col>
        <v-col cols="12" md="10">
          <activity-per-day-chart
            style="position: relative"
            :selectedGameMode="selectedGamesPerDayMode"
            :game-days="gameDays"
          />
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-title>
      {{
        $t("components_overall-statistics_tabs_playeractivitytab.playersperday")
      }}
    </v-card-title>

    <v-card-text v-if="!loadingPlayersPerDayStats">
      <amount-per-day-chart
        style="position: relative"
        :game-days="playersPerDay"
      />
    </v-card-text>

    <v-card-title>
      {{
        $t("components_overall-statistics_tabs_playeractivitytab.playedmaps")
      }}
    </v-card-title>
    <v-row>
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            v-model="selectedModeForMaps"
            :items="gameModes"
            item-text="modeName"
            item-value="modeId"
            @change="setSelectedModeForMaps"
            :label="
              $t(
                `components_overall-statistics_tabs_playeractivitytab.selectmode`
              )
            "
            outlined
          />
          <v-select
            v-model="selectedSeasonForMaps"
            :items="seasons"
            item-text="id"
            item-value="id"
            @change="setSelectedSeasonForMaps"
            :label="
              $t(
                `components_overall-statistics_tabs_playeractivitytab.selectseason`
              )
            "
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="12" md="10">
        <v-card-text>
          <maps-per-season-chart
            style="position: relative"
            :maps-per-season="mapsPerSeason"
          />
        </v-card-text>
      </v-col>
    </v-row>

    <v-card-title>
      {{
        $t(`components_overall-statistics_tabs_playeractivitytab.popularhours`)
      }}
    </v-card-title>
    <v-row>
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
          v-model="selectedPopularHourMode"
            :items="gameModes"
            item-text="modeName"
            item-value="modeId"
            @change="setSelectedModeGameHour"
            :label="
              $t(
                `components_overall-statistics_tabs_playeractivitytab.selectmode`
              )
            "
            outlined
          />
        </v-card-text>
        <div style="padding: 15px; font-size: 14px">
          Graph adjusted to your timezone
        </div>
      </v-col>
      <v-col cols="12" md="10">
        <v-card-text>
          <popular-game-time-chart :popular-game-hour="selectedGameHours" />
        </v-card-text>
      </v-col>
    </v-row>

    <v-card-title>
      {{
        $t(`components_overall-statistics_tabs_playeractivitytab.gamelengths`)
      }}
    </v-card-title>
    <v-row>
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            v-model="selectedLengthMode"
            :items="gameModes"
            item-text="modeName"
            item-value="modeId"
            @change="setSelectedLengthMode"
            :label="
              $t(
                `components_overall-statistics_tabs_playeractivitytab.selectmode`
              )
            "
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="12" md="10">
        <v-card-text>
          <game-length-chart :game-length="selectedGameLength" />
        </v-card-text>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import {
  GameDay,
  GameDayPerMode,
  GameLength,
  MapCount,
  PopularGameHour,
} from "@/store/overallStats/types";
import Component from "vue-class-component";
import GameLengthChart from "@/components/overall-statistics/GameLengthChart.vue";
import AmountPerDayChart from "@/components/overall-statistics/AmountPerDayChart.vue";
import PopularGameTimeChart from "@/components/overall-statistics/PopularGameTimeChart.vue";
import { EGameMode } from "@/store/typings";
import ActivityPerDayChart from "@/components/overall-statistics/ActivityPerDayChart.vue";
import MapsPerSeasonChart from "@/components/overall-statistics/MapsPerSeasonChart.vue";

@Component({
  components: {
    MapsPerSeasonChart,
    ActivityPerDayChart,
    GameLengthChart,
    AmountPerDayChart,
    PopularGameTimeChart,
  },
})
export default class PlayerActivityTab extends Vue {
  public selectedLengthMode = EGameMode.GM_1ON1;
  public selectedPopularHourMode = EGameMode.GM_1ON1;
  public selectedGamesPerDayMode = EGameMode.UNDEFINED;
  public selectedSeasonForMaps = "All";
  public overWrittenOnce = false;
  public selectedModeForMaps = EGameMode.GM_1ON1;

  public setSelectedLengthMode(mode: EGameMode) {
    this.selectedLengthMode = mode;
  }

  public setSelectedModeForMaps(mode: EGameMode) {
    this.selectedModeForMaps = mode;
  }

  public setSelectedSeasonForMaps(season: string) {
    this.selectedSeasonForMaps = season;
  }

  public setSelectedGamesPerDayMode(mode: EGameMode) {
    this.selectedGamesPerDayMode = mode;
  }

  public setSelectedModeGameHour(mode: EGameMode) {
    this.selectedPopularHourMode = mode;
  }

  get seasons() {
    return [
      "All",
      ...this.$store.direct.state.rankings.seasons.map((s) => s.id.toString()),
    ];
  }

  get selectedGameLength(): GameLength {
    return (
      this.gameLength?.filter(
        (g) => g.gameMode == this.selectedLengthMode
      )[0] ?? { lengths: [] }
    );
  }

  get gameModesWithAll() {
    return [
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.UNDEFINED]}`),
        modeId: EGameMode.UNDEFINED,
      },
      ...this.gameModes,
    ];
  }

  get selectedSeasonForMapsInitial() {
    return this.$store.direct.state.rankings.seasons[0]?.id?.toString() ?? "";
  }

  get isAllMode() {
    return this.selectedGamesPerDayMode === EGameMode.UNDEFINED;
  }

  get gameModes() {
    return [
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_1ON1]}`),
        modeId: EGameMode.GM_1ON1,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2]}`),
        modeId: EGameMode.GM_2ON2,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_4ON4]}`),
        modeId: EGameMode.GM_4ON4,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_FFA]}`),
        modeId: EGameMode.GM_FFA,
      },
    ];
  }

  get selectedGameHours(): PopularGameHour {
    return this.popularGameHours.filter(
      (g) => g.gameMode == this.selectedPopularHourMode
    )[0];
  }

  get loadingGamesPerDayStats(): boolean {
    return this.$store.direct.state.overallStatistics.loadingGamesPerDayStats;
  }

  get mapsPerSeason(): MapCount[] {
    if (this.selectedSeasonForMapsInitial && !this.overWrittenOnce) {
      this.selectedSeasonForMaps = this.selectedSeasonForMapsInitial;
      this.overWrittenOnce = true;
    }

    const selectedSeasonMaps =
      this.$store.direct.state.overallStatistics.matchesOnMapPerSeason.filter(
        (m) =>
          m.season ===
          (this.selectedSeasonForMaps === "All"
            ? -1
            : parseInt(this.selectedSeasonForMaps))
      )[0];
    if (!selectedSeasonMaps) return [];
    return (
      selectedSeasonMaps?.matchesOnMapPerModes?.filter(
        (m) => m.gameMode === this.selectedModeForMaps
      )[0]?.maps ?? []
    );
  }

  get loadingPlayersPerDayStats(): boolean {
    return this.$store.direct.state.overallStatistics.loadingPlayersPerDayStats;
  }

  get gameDays(): GameDayPerMode[] {
    return this.$store.direct.state.overallStatistics.gamesPerDay[0];
  }

  get gameDaysForGateways(): GameDayPerMode[][] {
    const all = this.$store.direct.state.overallStatistics.gamesPerDay[0];
    const us = this.$store.direct.state.overallStatistics.gamesPerDay[1];
    const eu = this.$store.direct.state.overallStatistics.gamesPerDay[2];
    const filterForCurrentMode = (all: GameDayPerMode[]) => {
      return all.filter((g) => g.gameMode === this.selectedGamesPerDayMode);
    };

    const gameDayPerModes = filterForCurrentMode(all);
    const gameDayPerModes1 = filterForCurrentMode(eu);
    const gameDayPerModes2 = filterForCurrentMode(us);
    return [gameDayPerModes, gameDayPerModes1, gameDayPerModes2];
  }

  get playersPerDay(): GameDay[] {
    return (
      this.$store.direct.state.overallStatistics.playersPerDay
        .reverse()
        ?.splice(
          0,
          this.$store.direct.state.overallStatistics.playersPerDay.length - 1
        ) ?? []
    );
  }

  get gameLength(): GameLength[] {
    return this.$store.direct.state.overallStatistics.gameLengths;
  }

  get popularGameHours(): PopularGameHour[] {
    return this.$store.direct.state.overallStatistics.popularGameHours;
  }
}
</script>
