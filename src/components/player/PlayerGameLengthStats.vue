<template>
  <div>
    {{ $t("components_player_tabs_playerstatistictab.playergamelengthaveragelabel") }} {{ selectedOpponentRaceName }}: {{ averageAgainstRace }}
    <bar-chart class="player-game-length" :chart-data="playerGameLengthChartData" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useI18n } from "vue-i18n-bridge";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { usePlayerStore } from "@/store/player/store";
import { ERaceEnum } from "@/store/types";
import { formatSecondsToDuration } from "@/helpers/date-functions";
import { ChartData } from "chart.js";
import { TranslateResult } from "vue-i18n";

export default defineComponent({
  name: "PlayerGameLengthStats",
  components: {
    BarChart,
  },
  props: {
    selectedOpponentRace: {
      type: Number as PropType<ERaceEnum>,
      required: true,
    },
    selectedOpponentRaceName: {
      type: String as PropType<TranslateResult>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const playerStore = usePlayerStore();

    const averageAgainstRace = computed<string>(() => {
      const lengthState = playerStore.playerGameLengthStats;
      const average = lengthState?.averageGameLengthByOpponentRace?.[props.selectedOpponentRace] || 0;
      return formatSecondsToDuration(average);
    });

    const lengths = computed<Record<number, number>>(() => {
      const lengthStatsIntervals = playerStore.playerGameLengthStats?.playerGameLengthIntervalByOpponentRace;
      const lengths = lengthStatsIntervals?.[props.selectedOpponentRace]?.lengths || {};
      fillNonExistingIntervals(lengths);
      return lengths;
    });

    function fillNonExistingIntervals(lengths: Record<number, number>): void {
      const lengthsKeys = Object.keys(lengths);

      // fill non existent intervals with 0 games
      if (lengthsKeys.length) {
        const maxNumberOfIntervals = 60;
        for (let i = 0; i < maxNumberOfIntervals; i++) {
          const key: number = i * 60;
          const shouldAdd = !(key in lengths);
          if ( shouldAdd ) {
            lengths[key] = 0;
          }
        }
      }
    }

    const intervals = computed<string[]>(() => {
      const intervals = Object.keys(lengths.value).map((e) => formatSecondsToDuration(parseInt(e)));
      // games in the last position have 60 min or more, so add + as suffix
      intervals[intervals.length - 1] = intervals[intervals.length - 1] + "+";
      return intervals.slice(2); // slicing to ignoring first 2 min of game
    });

    const games = computed<number[]>(() => Object.values(lengths.value).slice(2)); // slicing to ignoring first 2 min of game

    const playerGameLengthChartData = computed<ChartData>(() => {
      return {
        labels: intervals.value,
        datasets: [
          {
            label: String(t("components_overall-statistics_gamelengthchart.amountofgames")),
            data: games.value,
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      };
    });

    return {
      averageAgainstRace,
      playerGameLengthChartData,
    };
  },
});
</script>

<style lang="scss" scoped>
.player-game-length {
  margin-right: 24px;
  margin-bottom: 24px;
}
</style>
