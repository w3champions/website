<template>
  <div>
    <bar-chart class="matchup-length" :chart-data="matchupLengthChartData"></bar-chart>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { useOverallStatsStore } from "@/store/overallStats/store";
import { formatSecondsToDuration } from "@/helpers/date-functions";
import { useI18n } from "vue-i18n-bridge";
import { ChartData } from "chart.js";

export default defineComponent({
  name: "PlayerGameLengthStats",
  components: {
    BarChart,
  },
  setup() {
    const { t } = useI18n();
    const statsStore = useOverallStatsStore();

    const lengths = computed(() => {
      const mmrRange = statsStore.matchupMmrRange;
      return statsStore.matchupLength?.lengthsByMmrRange?.[mmrRange] || [];
    });

    // slicing to ignoring first 2 min of game
    const games = computed(() => lengths.value.slice(4).map((e) => e.games));

    const intervals = computed(() => {
      const intervals = lengths.value.map((e) => formatSecondsToDuration(e.seconds));
      // games in the last position have 60 min or more, so add + as suffix
      intervals[intervals.length - 1] = intervals[intervals.length - 1] + "+";
      return intervals.slice(4); // slicing to ignoring first 2 min of game
    });

    const matchupLengthChartData = computed<ChartData<"bar">>(() => {
      return {
        labels: intervals.value,
        datasets: [
          {
            label: String(t("components_overall-statistics_gamelengthchart.amountofgames")),
            data: games.value,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      };
    });

    return {
      matchupLengthChartData,
    };
  },
});
</script>

<style lang="scss" scoped>
.matchup-length {
  margin-right: 24px;
  margin-bottom: 24px;
}
</style>
