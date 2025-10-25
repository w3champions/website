<template>
  <line-chart :chart-data="chartData" />
</template>
<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useI18n } from "vue-i18n";
import { GameDay } from "@/store/overallStats/types";
import LineChart from "@/components/overall-statistics/LineChart.vue";
import { ChartData } from "chart.js";
import { parseJSON } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

export default defineComponent({
  name: "AmountPerDayChart",
  components: {
    LineChart,
  },
  props: {
    gameDays: {
      type: Array<GameDay>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const gameDayDates = ref<Date[]>(props.gameDays.map((g) => utcToZonedTime(parseJSON(g.date), "UTC")));
    const gameDayCounts = ref<number[]>(props.gameDays.map((g) => g.gamesPlayed));

    const chartData = computed<ChartData<"line">>(() => ({
      labels: gameDayDates.value,
      datasets: [
        {
          label: t("components_overall-statistics_tabs_playeractivitytab.playersperday").toString(),
          data: gameDayCounts.value,
          fill: true,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1.5,
          tension: 0.4, // Smooth line.
          cubicInterpolationMode: "monotone",
        },
      ],
    }));

    return {
      chartData,
    };
  },
});
</script>
