<template>
  <line-chart :chart-data="gameHourChartData" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { GameDayPerMode } from "@/store/overallStats/types";
import moment from "moment";
import LineChart from "@/components/overall-statistics/LineChart.vue";
import Vue from "vue";
import { ChartData } from "chart.js";
import { EGameMode } from "@/store/typings";

@Component({
  components: { LineChart },
})
export default class ActivityPerDayChart extends Vue {
  @Prop() public gameDays!: GameDayPerMode[];
  @Prop() public selectedGameMode!: EGameMode;

  get gameDayDates() {
    return this.allSet.gameDays.map((g) => moment(g.date).format("LL"));
  }

  get allSet() {
    return this.gameDays.filter((g) => g.gameMode == EGameMode.GM_1ON1)[0];
  }

  get gameHourChartData(): ChartData {
    return {
      labels: this.gameDayDates,
      datasets: this.gameDays
        .filter((c) => {
          // Filter out all game modes that are not present in enum "EGameMode"
          // and other old game modes.
          return (
            Object.values(EGameMode).includes(c.gameMode) && !this.disabledGameModes.includes(c.gameMode)
          );
        })
        // then only show the data that user selected
        .filter((c) => {
          return (
            this.selectedGameMode === EGameMode.UNDEFINED ||
            c.gameMode === this.selectedGameMode
          );
        })
        .map((c) => {
          return {
            label: this.$t(`gameModes.${EGameMode[c.gameMode]}`).toString(),
            data: c.gameDays
              .map((g) => {
                return {
                  x: moment(g.date).format("LL"),
                  y: g.gamesPlayed * this.multiplier(c.gameMode),
                };
              })
              .splice(0, c.gameDays.length - 1),
            backgroundColor: "rgba(126,126,126,0.08)",
            borderColor: this.mapColor(c.gameMode),
            borderWidth: 1.5,
          };
        }),
    };
  }

  get disabledGameModes(): Array<number> {
    return [
      EGameMode.GM_2ON2_AT,
      EGameMode.GM_4ON4_AT,
      EGameMode.GM_LEGION_4v4_X20_AT,
      EGameMode.GM_LTW_1ON1,
      EGameMode.GM_FROSTCRAFT_4ON4,
    ];
  }

  private mapColor(gameMode: EGameMode) {
    switch (gameMode) {
      case EGameMode.GM_1ON1:
        return "rgb(41,128,101)";

      case EGameMode.UNDEFINED:
        return "rgb(54, 162, 235)";

      case EGameMode.GM_2ON2:
        return "rgb(163,54,255)";

      case EGameMode.GM_4ON4:
        return "rgb(237, 0, 8)";

      case EGameMode.GM_FFA:
        return "rgb(255,114,20)";

      case EGameMode.GM_LEGION_4v4_X20:
        return "rgb(191, 121, 0)";

      case EGameMode.GM_LEGION_1v1_x20:
        return "rgb(13, 13, 189)";

      case EGameMode.GM_LEGION_2v2_X20:
        return "rgb(255,99,240)";

      case EGameMode.GM_ROC_1ON1:
        return "rgb(120, 0, 4)";

      case EGameMode.GM_ATR_1ON1:
        return "rgb(21, 189, 124)";

      case EGameMode.GM_BANJOBALL_4ON4:
        return "rgb(58, 58, 186)";

      case EGameMode.GM_PTR_1ON1:
        return "rgb(46, 230, 58)";

      default:
        return "rgb(54, 162, 235)";
    }
  }

  private multiplier(gameMode: EGameMode) {
    switch (gameMode) {
      case EGameMode.GM_1ON1:
        return 1;

      case EGameMode.UNDEFINED:
        return 1;

      case EGameMode.GM_2ON2:
        return 2;

      case EGameMode.GM_4ON4:
        return 4;

      case EGameMode.GM_FFA:
        return 2;

      case EGameMode.GM_LEGION_4v4_X20:
        return 4;

      case EGameMode.GM_LEGION_1v1_x20:
        return 1;

      case EGameMode.GM_LEGION_2v2_X20:
        return 2;

      case EGameMode.GM_ROC_1ON1:
        return 1;

      case EGameMode.GM_ATR_1ON1:
        return 1;

      case EGameMode.GM_BANJOBALL_4ON4:
        return 4;

      case EGameMode.GM_PTR_1ON1:
        return 1;

      default:
        return 1;
    }
  }
}
</script>
