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
          // Filter out gameMode 9 as it does not exist
          // and gameMode 6 as it is 2v2 AT which has been merged with 2v2 RT
          return c.gameMode !== 9 && c.gameMode !== 6;
        })
        .map((c) => {
          return {
            label: this.$t(`gameModes.${EGameMode[c.gameMode]}`).toString(),
            data: c.gameDays
              .map((g) => g.gamesPlayed * this.multiplier(c.gameMode))
              .splice(0, c.gameDays.length - 1),
            backgroundColor: "rgba(126,126,126,0.08)",
            borderColor: this.mapColor(c.gameMode),
            borderWidth: 1.5,
          };
        }),
    };
  }

  private mapColor(gameMode: EGameMode) {
    switch (gameMode) {
      case EGameMode.GM_1ON1:
        return "rgb(41,128,101)";

      case EGameMode.UNDEFINED:
        return "rgba(54, 162, 235, 1)";

      case EGameMode.GM_2ON2:
        return "rgb(163,54,255)";

      case EGameMode.GM_2ON2_AT:
        return "rgb(255,99,240)";

      case EGameMode.GM_4ON4:
        return "rgb(237, 0, 8)";

      case EGameMode.GM_FFA:
        return "rgb(255,114,20)";
      
      case EGameMode.GM_4ON4_AT:
        return "rgb(21, 189, 124)";

      case EGameMode.GM_FOOTMEN_FRENZY:
        return "rgb(230, 46, 92)";

      case EGameMode.GM_LEGION_4v4_X3:
        return "rgb(131, 51, 0)";

      case EGameMode.GM_LEGION_4v4_X20:
        return "rgb(191, 121, 0)";

      case EGameMode.GM_LEGION_1v1_x20:
        return "rgb(13, 13, 189)";

      case EGameMode.GM_LEGION_4v4_x20_AT:
        return "rgb(58, 58, 186)";

      case EGameMode.GM_ROC_1ON1:
        return "rgb(120, 0, 4)";

      case EGameMode.GM_LTW_1ON1:
        return "rgb(89, 76, 76)";

      case EGameMode.GM_FROSTCRAFT_4ON4:
        return "rgb(33, 33, 117)";

      default:
        return "rgba(54, 162, 235, 1)";
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

      case EGameMode.GM_2ON2_AT:
        return 2;

      case EGameMode.GM_4ON4:
        return 4;

      case EGameMode.GM_FFA:
        return 2;
      
      case EGameMode.GM_4ON4_AT:
        return 4;

      case EGameMode.GM_FOOTMEN_FRENZY:
        return 4;

      case EGameMode.GM_LEGION_4v4_X3:
        return 4;

      case EGameMode.GM_LEGION_4v4_X20:
        return 4;

      case EGameMode.GM_LEGION_1v1_x20:
        return 1;

      case EGameMode.GM_LEGION_4v4_x20_AT:
        return 4;

      case EGameMode.GM_ROC_1ON1:
        return 1;

      case EGameMode.GM_LTW_1ON1:
        return 1;

      case EGameMode.GM_FROSTCRAFT_4ON4:
        return 4;

      default:
        return 1;
    }
  }
}
</script>
