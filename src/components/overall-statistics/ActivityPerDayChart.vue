<template>
  <line-chart :chart-data="gameHourChartData" />
</template>
<script lang="ts">
import { Component, Prop, Vue, toNative } from "vue-facing-decorator";
import GameModesMixin from "@/mixins/GameModesMixin";
import { GameDayPerMode } from "@/store/overallStats/types";
import LineChart, { getBackgroundColor } from "@/components/overall-statistics/LineChart.vue";
import { ChartData, ScriptableContext } from "chart.js";
import { EGameMode } from "@/store/types";
import { parseJSON } from "date-fns";

@Component({
  components: { LineChart },
  mixins: [toNative(GameModesMixin)]
})
export default class ActivityPerDayChart extends Vue {
  @Prop() public gameDays!: GameDayPerMode[];
  @Prop() public selectedGameMode!: EGameMode;

  get gameDayDates(): Date[] {
    return this.allSet.gameDays.map((g) => parseJSON(g.date));
  }

  get allSet(): GameDayPerMode {
    return this.gameDays.filter((g) => g.gameMode == EGameMode.GM_1ON1)[0];
  }

  get gameHourChartData(): ChartData<"line", unknown> {
    return {
      labels: this.gameDayDates,
      datasets: this.gameDays
        .filter((c) => {
          // Filter out inactive gamemodes, but show total games, which is EGameMode.UNDEFINED.
          return this.activeGameModes
            .map((m) => m.id)
            .includes(c.gameMode) || c.gameMode === EGameMode.UNDEFINED;
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
                  x: parseJSON(g.date),
                  y: g.gamesPlayed * this.multiplier(c.gameMode),
                };
              })
              .splice(0, c.gameDays.length - 1),
            fill: true,
            backgroundColor: (context: ScriptableContext<"line">) => getBackgroundColor(context, this.mapColor(c.gameMode)),
            borderColor: this.mapColor(c.gameMode),
            borderWidth: 1.5,
            tension: 0.4, // Smooth line.
          };
        }),
    };
  }

  private mapColor(gameMode: EGameMode): string {
    switch (gameMode) {
      case EGameMode.GM_1ON1:
        return "rgb(41,128,101)";

      case EGameMode.UNDEFINED:
        return "rgb(54, 162, 235)";

      case EGameMode.GM_2ON2:
        return "rgb(163,54,255)";

      case EGameMode.GM_3ON3:
        return "rgb(255,255,0)";

      case EGameMode.GM_4ON4:
        return "rgb(237, 0, 8)";

      case EGameMode.GM_FFA:
        return "rgb(255,114,20)";

      case EGameMode.GM_LEGION_4v4_X20:
        return "rgb(191, 121, 0)";

      case EGameMode.GM_LEGION_1v1_x20:
        return "rgb(13, 13, 189)";

      case EGameMode.GM_ROC_1ON1:
        return "rgb(120, 0, 4)";

      case EGameMode.GM_ATR_1ON1:
        return "rgb(21, 189, 124)";

      case EGameMode.GM_DOTA_5ON5:
        return "rgb(58, 58, 186)";

      case EGameMode.GM_SC_FFA_4:
        return "rgb(46, 230, 58)";

      case EGameMode.GM_LTW_FFA:
        return "rgb(255,99,240)";

      default:
        return "rgb(54, 162, 235)";
    }
  }

  private multiplier(gameMode: EGameMode): number {
    switch (gameMode) {
      case EGameMode.GM_1ON1:
        return 1;

      case EGameMode.UNDEFINED:
        return 1;

      case EGameMode.GM_2ON2:
        return 2;

      case EGameMode.GM_3ON3:
        return 3;

      case EGameMode.GM_4ON4:
        return 4;

      case EGameMode.GM_FFA:
        return 2;

      case EGameMode.GM_LEGION_4v4_X20:
        return 4;

      case EGameMode.GM_LEGION_1v1_x20:
        return 1;

      case EGameMode.GM_ROC_1ON1:
        return 1;

      case EGameMode.GM_ATR_1ON1:
        return 1;

      case EGameMode.GM_DOTA_5ON5:
        return 5;

      case EGameMode.GM_SC_FFA_4:
        return 2;

      case EGameMode.GM_LTW_FFA:
        return 2.5;

      default:
        return 1;
    }
  }
}
</script>
