<template>
  <div v-if="mmrDistribution.distributedMmrs">
    <bar-chart :chart-data="mmrDistributionChartData" :chart-options="mmrDistributionChartOptions" />
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { MmrDistribution } from "@/store/overallStats/types";
import { Season } from "@/store/ranking/types";
import { EGameMode } from "@/store/types";
import { ChartData, ChartOptions } from "chart.js";
import { AnnotationOptions } from "chartjs-plugin-annotation";
import clamp from "lodash/clamp";
import maxBy from "lodash/maxBy";
import minBy from "lodash/minBy";
import { usePlayerStore } from "@/store/player/store";
import { useOauthStore } from "@/store/oauth/store";
import { ModeStat } from "@/store/player/types";

export default defineComponent({
  name: "MmrDistributionChart",
  components: {
    BarChart,
  },
  props: {
    mmrDistribution: {
      type: Object as PropType<MmrDistribution>,
      required: true,
    },
    selectedSeason: {
      type: Object as PropType<Season>,
      required: true,
    },
    selectedGameMode: {
      type: Number as PropType<EGameMode>,
      required: true,
    },
  },
  setup(props) {
    const playerStore = usePlayerStore();
    const oauthStore = useOauthStore();
    const gameModeStats = computed<ModeStat[]>(() => playerStore.gameModeStats);

    const isLoggedInUserProfile = computed<boolean>(() => {
      const isLoggedIn = Boolean(oauthStore.token);
      const isOwnProfile = playerStore.battleTag === oauthStore.blizzardVerifiedBtag;
      return isLoggedIn && isOwnProfile;
    });

    const colors = computed(() => {
      const colors: string[] = [];
      for (let i = 0; i < props.mmrDistribution.distributedMmrs.length; i++) {
        if (
          i === props.mmrDistribution.top2PercentIndex ||
          i === props.mmrDistribution.top5PercentIndex ||
          i === props.mmrDistribution.top10PercentIndex ||
          i === props.mmrDistribution.top25PercentIndex ||
          i === props.mmrDistribution.top50PercentIndex
        ) {
          colors.push("rgb(120, 45, 160, 0.8)");
        } else {
          colors.push("rgba(54, 162, 235, 0.5)");
        }
      }
      return colors;
    });

    const mmrOfLoggedInPlayer = computed<number>(() => {
      if (!gameModeStats.value) return 0;

      return (
        gameModeStats.value.find(
          (g) =>
            g.gameMode === props.selectedGameMode &&
            g.season === props.selectedSeason?.id
        )?.mmr ?? 0
      );
    });

    const mmrGroupOfLoggedInPlayer = computed<number>(() => {
      if (!mmrOfLoggedInPlayer.value || !props.mmrDistribution.distributedMmrs) {
        return 0;
      }

      const minMMR = minBy(
        props.mmrDistribution.distributedMmrs,
        (d) => d.mmr
      ) || { mmr: 0, count: 0 };
      const maxMMR = maxBy(
        props.mmrDistribution.distributedMmrs,
        (d) => d.mmr
      ) || { mmr: 0, count: 0 };

      const clampedPlayerMMR = clamp(
        mmrOfLoggedInPlayer.value,
        minMMR.mmr,
        maxMMR.mmr
      );
      const mmrGroup = props.mmrDistribution.distributedMmrs.find(
        (d) => Math.abs(d.mmr + 25 - clampedPlayerMMR) <= 25
      );

      return mmrGroup ? mmrGroup.mmr : 0;
    });

    const mmrDistributionTotalPlayers = computed<number>(() => {
      return props.mmrDistribution.distributedMmrs
        .map((d) => d.count)
        .reduce((a, b) => a + b);
    });

    const isTop50percent = computed<boolean>(() => {
      const top50mmr =
        props.mmrDistribution.distributedMmrs[
          props.mmrDistribution.top50PercentIndex
        ].mmr;
      return mmrOfLoggedInPlayer.value > top50mmr;
    });

    const cumulativeSumData = computed<number[]>(() => {
      return props.mmrDistribution.distributedMmrs
        .slice()
        .reverse()
        .map((d) => d.count)
        .reduce<number[]>((a, e, i) => {
          // a: Accumulator; e: current Element; i: current Index
          return a.length > 0 ? [...a, e + a[i - 1]] : [e];
        }, [])
        .reverse();
    });

    const mmrDistributionChartData = computed<ChartData<"bar" | "line">>(() => {
      return {
        labels: props.mmrDistribution.distributedMmrs.map((d) => `> ${d.mmr}`),
        datasets: [
          {
            type: "bar",
            yAxisID: "y-axis-0",
            label: "MMR",
            data: props.mmrDistribution.distributedMmrs.map((d) => d.count),
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
            backgroundColor: colors.value,
          },
          {
            type: "line",
            yAxisID: "y-axis-1",
            label: "Cumulative",
            data: cumulativeSumData.value,
            borderColor: "rgb(60,208,88)",
            fill: false,
          },
        ],
      };
    });

    const mmrDistributionChartOptions = computed<ChartOptions>(() => {
      const isValidMMR = mmrGroupOfLoggedInPlayer.value > 0 && isLoggedInUserProfile.value;
      const annotations: { [key: string]: AnnotationOptions } = isValidMMR
        ? {
          x: {
            type: "line",
            scaleID: "x",
            value: `> ${mmrGroupOfLoggedInPlayer.value}`,
            borderColor: "rgb(28,95,47, 0.7)",
            borderWidth: 2,
            borderDash: [10, 10],
            label: {
              display: true,
              content: "Your MMR",
              backgroundColor: "rgb(28,95,47, 0.7)",
              yAdjust: 10,
              xAdjust: isTop50percent.value ? 40 : -40, //Move label to left or right of line
              position: "start",
              borderRadius: 0,
            },
          },
        }
        : {};

      return {
        plugins: {
          legend: {
            display: true,
          },
          tooltip: {
            bodyAlign: "center",
            displayColors: false,
            callbacks: {
              label: (tooltipItem: { label: string; formattedValue: string; datasetIndex: number; raw: unknown }) => {
                if (tooltipItem.datasetIndex === 0) {
                  // MMR
                  return `${tooltipItem.label} - ${tooltipItem.formattedValue}`;
                } else {
                  // Cumulative
                  const value: number = tooltipItem.raw as number;
                  const percent = 100 - (value / mmrDistributionTotalPlayers.value) * 100;
                  return `top ${Math.max(percent, 0.1).toFixed(0)}%`;
                }
              },
              title: () => {
                return "";
              },
            },
          },
          annotation: {
            annotations: annotations,
          },
        },
        maintainAspectRatio: true,
        scales: {
          "y-axis-0": {
            beginAtZero: true,
          },
          "y-axis-1": {
            position: "right",
            beginAtZero: true,
          },
          x: {
            reverse: true,
          },
        },
      };
    });

    return {
      mmrDistributionChartData,
      mmrDistributionChartOptions,
    };
  },
});
</script>
