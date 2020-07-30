<template>
  <div>
    <v-card-title>Games per Day</v-card-title>
    <v-card-text v-if="!loadingGamesPerDayStats">
      <v-row>
        <v-col cols="12" md="2">
          <v-card-text>
            <v-select
              :items="gameModesWithAll"
              item-text="modeName"
              item-value="modeId"
              @change="setSelectedGamesPerDayMode"
              label="Select Mode"
              outlined
            />
          </v-card-text>
        </v-col>
        <v-col cols="12" md="10">
          <amount-per-day-chart
            v-if="!isAllMode"
            style="position: relative;"
            :game-days="gameSelectedDays"
          />
          <multiple-amount-per-day-chart
            v-if="isAllMode"
            style="position: relative;"
            :game-days="gameDays"
          />
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-title>Players per Day</v-card-title>
    <v-card-text v-if="!loadingPlayersPerDayStats">
      <amount-per-day-chart
        style="position: relative;"
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
          <popular-game-time-chart :popular-game-hour="selectedGameHours" />
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
            @change="setSelectedLengthMode"
            label="Select Mode"
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
import { GameDay, GameLength, PopularGameHour } from "@/store/overallStats/types";
import Component from "vue-class-component";
import GameLengthChart from "@/components/overal-statistics/GameLengthChart.vue";
import AmountPerDayChart from "@/components/overal-statistics/AmountPerDayChart.vue";
import PopularGameTimeChart from "@/components/overal-statistics/PopularGameTimeChart.vue";
import { EGameMode } from "@/store/typings";
import MultipleAmountPerDayChart from "@/components/overal-statistics/MultipleAmountPerDayChart.vue";

@Component({
  components: {
    MultipleAmountPerDayChart,
    GameLengthChart,
    AmountPerDayChart,
    PopularGameTimeChart,
  },
})
export default class PlayerActivityTab extends Vue {
  public selectedLengthMode = EGameMode.GM_1ON1;
  public selectedPopularHourMode = EGameMode.GM_1ON1;
  public selectedGamesPerDayMode = EGameMode.UNDEFINED;

  public setSelectedLengthMode(mode: EGameMode) {
    this.selectedLengthMode = mode;
  }

  public setSelectedGamesPerDayMode(mode: EGameMode) {
    this.selectedGamesPerDayMode = mode;
  }

  public setSelectedModeGameHour(mode: EGameMode) {
    this.selectedPopularHourMode = mode;
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
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2_AT]}`),
        modeId: EGameMode.GM_2ON2_AT,
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

  get loadingPlayersPerDayStats(): boolean {
    return this.$store.direct.state.overallStatistics.loadingPlayersPerDayStats;
  }

  get gameDays(): GameDay[] {
    return this.$store.direct.state.overallStatistics.gamesPerDay;
  }

  get gameSelectedDays(): GameDay[] {
    return this.$store.direct.state.overallStatistics.gamesPerDay.filter(
      (g) => g.gameMode == this.selectedGamesPerDayMode
    )[0].gameDays;
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
}
</script>
