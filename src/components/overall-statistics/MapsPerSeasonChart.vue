<template>
  <bar-chart :chart-data="barChartData" />
</template>
<script lang="ts">
import { computed, ComputedRef, defineComponent } from "vue";
import { useI18n } from "vue-i18n";
import { ChartData } from "chart.js";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { MapCount } from "@/store/overallStats/types";

export default defineComponent({
  name: "MapsPerSeasonChart",
  components: {
    BarChart,
  },
  props: {
    mapsPerSeason: {
      type: Array<MapCount>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const mapNames: ComputedRef<string[]> = computed((): string[] => props.mapsPerSeason.map((m) => m.mapName ?? m.map));
    const gamesCount: ComputedRef<number[]> = computed((): number[] => props.mapsPerSeason.map((m) => m.count));

    const barChartData: ComputedRef<ChartData> = computed((): ChartData => {
      return {
        labels: mapNames.value,
        datasets: [
          {
            label: String(t("components_overall-statistics_mapsperseasonchart.playedmaps")),
            data: gamesCount.value,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      };
    });

    return {
      barChartData,
    };
  },
});
</script>
