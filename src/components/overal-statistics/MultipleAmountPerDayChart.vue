<template>
  <line-chart :chart-data="gameHourChartData" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { GameDayPerMode } from "@/store/overallStats/types";
import moment from "moment";
import LineChart from "@/components/overal-statistics/LineChart.vue";
import Vue from "vue";
import { ChartData } from "chart.js";
import { EGameMode } from "@/store/typings";

@Component({
  components: { LineChart },
})
export default class MultipleAmountPerDayChart extends Vue {
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
      datasets: this.gameDays.map((c) => {
        return {
          label: this.$t(`gameModes.${EGameMode[c.gameMode]}`).toString(),
          data: c.gameDays
            .map((g) => g.gamesPlayed * this.multiplier(c.gameMode))
            .splice(0, c.gameDays.length - 1),
          backgroundColor: "rgba(126,126,126,0.08)",
          borderColor: this.mapColor(c.gameMode),
          borderWidth: 1,
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
        return "rgb(60,208,88)";

      case EGameMode.GM_FFA:
        return "rgb(255,114,20)";

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

      default:
        return 1;
    }
  }
}
</script>
