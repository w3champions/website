<template>
  <line-chart :chart-data="gameHourChartData" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { activeGameModes } from "@/mixins/GameModesMixin";
import { GameDay, GameDayPerMode } from "@/store/overallStats/types";
import LineChart, { getBackgroundColor } from "@/components/overall-statistics/LineChart.vue";
import { ChartData, ChartDataset, Point } from "chart.js";
import { EGameMode } from "@/store/types";
import { parseJSON } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

export default defineComponent({
  name: "ActivityPerDayChart",
  components: {
    LineChart,
  },
  props: {
    gameDays: {
      type: Array<GameDayPerMode>,
      required: true,
    },
    selectedGameMode: {
      type: Number as PropType<EGameMode>,
      required: true,
    },
    normalized: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    // Get the "All" set, or an empty set if it doesn't exist
    const allSet = computed(() => props.gameDays
      .find((g) => g.gameMode == EGameMode.UNDEFINED) ?? {
        gameMode: EGameMode.UNDEFINED,
        gameDays: [] as GameDay[],
      } as GameDayPerMode
    );

    // Get the list of dates for the x-axis
    const gameDayDates = computed(() => allSet.value.gameDays
      .slice(0, allSet.value.gameDays.length - 1) // Drop today's data (last entry)
      .map((g) => utcToZonedTime(parseJSON(g.date), "UTC"))
    );

    // Recompute the "All" set using all the other game modes,
    // using each mode's normalizing multiplier (the backend doesn't normalize)
    const normalizedAllSet = computed(() => props.gameDays
      .filter((g) => g.gameMode !== EGameMode.UNDEFINED)
      .reduce((acc: GameDayPerMode, curr: GameDayPerMode) => ({
        ...acc,
        gameDays: acc.gameDays.map((g, i) => {
          const mult = normalizingMultiplier(curr.gameMode);
          const normalizedGamesPlayed = (curr.gameDays[i]?.gamesPlayed ?? 0) * mult;
          return { ...g, gamesPlayed: g.gamesPlayed + normalizedGamesPlayed };
        }),
      }), {
        gameMode: EGameMode.UNDEFINED,
        gameDays: allSet.value.gameDays.map((g) => ({ ...g, gamesPlayed: 0 })),
      } satisfies GameDayPerMode)
    );

    const gameHourChartData = computed<ChartData<"line">>(() => {
      const activeGameModeIds = activeGameModes().map((m) => m.id);
      return {
        labels: gameDayDates.value,
        datasets: props.gameDays
          // Use the calculated total for "All" (UNDEFINED) if normalized is on
          .map((c) => c.gameMode == EGameMode.UNDEFINED && props.normalized ? normalizedAllSet.value : c)
          // Filter out inactive gamemodes, but show total games (UNDEFINED)
          .filter((c) => activeGameModeIds.includes(c.gameMode) || c.gameMode === EGameMode.UNDEFINED)
          // Only show the mode that user selected (but "All" shows everything)
          .filter((c) =>
            props.selectedGameMode === EGameMode.UNDEFINED
            || c.gameMode === props.selectedGameMode
          )
          .map((c) => ({
            label: t(`gameModes.${EGameMode[c.gameMode]}`).toString(),
            data: c.gameDays
              // Drop today's data (last entry), as it's incomplete (day isn't over)
              .slice(0, c.gameDays.length - 1)
              // Produce the data points, normalizing if needed
              .map((g) => ({
                // The date is midnight UTC, but parseJSON returns it in local time,
                // so we need to convert it back to UTC
                x: utcToZonedTime(parseJSON(g.date), "UTC").getTime(),
                // If on, normalize the games played by the mode's multiplier
                y: g.gamesPlayed * (props.normalized ? normalizingMultiplier(c.gameMode) : 1),
              } satisfies Point)),
            fill: true,
            backgroundColor: (context) => getBackgroundColor(context, mapColor(c.gameMode)),
            borderColor: mapColor(c.gameMode),
            borderWidth: 1.5,
            tension: 0.4, // Smooth line.
            pointHitRadius: 6,
          } satisfies ChartDataset<"line">)),
      };
    });

    function mapColor(gameMode: EGameMode): string {
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

        case EGameMode.GM_SC_OZ:
          return "rgb(28,133,32)";

        case EGameMode.GM_LTW_FFA:
          return "rgb(255,99,240)";

        case EGameMode.GM_DS:
          return "rgb(150, 150, 20)";

        case EGameMode.GM_WARHAMMER_1ON1:
          return "rgb(255, 0, 192)";

        case EGameMode.GM_CF:
          return "rgb(44,196,196)";

        case EGameMode.GM_CF_AT:
          return "rgb(44,196,196)";

        default:
          return "rgb(54, 162, 235)";
      }
    }

    function normalizingMultiplier(gameMode: EGameMode): number {
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

        case EGameMode.GM_SC_OZ:
          return 2;

        case EGameMode.GM_LTW_FFA:
          return 2.5;

        case EGameMode.GM_DS:
          return 3;

        case EGameMode.GM_WARHAMMER_1ON1:
          return 1;

        case EGameMode.GM_CF:
          return 3;

        default:
          return 1;
      }
    }
    return {
      gameHourChartData,
    };
  },
});
</script>
