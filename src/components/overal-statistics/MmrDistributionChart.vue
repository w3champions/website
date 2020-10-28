<template>
  <bar-chart :chartData="mmrDistributionChartData" :xAxesReversed="true" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";

import { MmrDistribution } from "@/store/overallStats/types";
import { ChartData } from "chart.js";
import Vue from "vue";
import BarChart from "@/components/overal-statistics/BarChart.vue";
import { EGameMode } from "@/store/typings";
import { Season } from "@/store/ranking/types";

@Component({
  components: { BarChart },
})
export default class MmrDistributionChart extends Vue {
  @Prop() public mmrDistribution!: MmrDistribution;
  @Prop() public selectedSeason!: Season;

  private colors() {
    const colors = [];
    for (let i = 0; i < this.mmrDistribution.distributedMmrs.length; i++) {
      if (this.isYou(i)) {
        colors.push("rgb(28,95,47, 0.7)");
      } else if (
        i === this.mmrDistribution.top2PercentIndex ||
        i === this.mmrDistribution.top5PercentIndex ||
        i === this.mmrDistribution.top10PercentIndex ||
        i === this.mmrDistribution.top25ercentIndex ||
        i === this.mmrDistribution.top50PercentIndex
      ) {
        colors.push("rgb(66,23,63, 0.7)");
      } else {
        colors.push("rgba(54, 162, 235, 0.2)");
      }
    }
    return colors;
  }

  get mmrOfLoggedInPlayer() {
    if (!this.gameModeStats) return 0;

    return (
      this.gameModeStats.filter(
        (g) =>
          g.gameMode === EGameMode.GM_1ON1 &&
          g.season === this.selectedSeason?.id
      )[0]?.mmr ?? 0
    );
  }

  get gameModeStats() {
    return this.$store.direct.state.player.gameModeStats;
  }

  public isYou(index: number) {
    return (
      Math.abs(
        this.mmrDistribution.distributedMmrs[index].mmr +
          25 -
          this.mmrOfLoggedInPlayer
      ) < 12
    );
  }

  get mmrDistributionChartData(): ChartData {
    if (!this.mmrDistribution.distributedMmrs) {
      return null;
    }

    const totalSum = this.mmrDistribution.distributedMmrs
      .map((d) => d.count)
      .reduce((a, b) => a + b);
    const maxCount = Math.max(
      ...this.mmrDistribution.distributedMmrs.map((d) => d.count)
    );

    return {
      labels: this.mmrDistribution.distributedMmrs.map((d) => `> ${d.mmr}`),
      datasets: [
        {
          label: "mmr",
          data: this.mmrDistribution.distributedMmrs
            .slice()
            .reverse()
            .map((d) => d.count),
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          backgroundColor: this.colors,
        },
        {
          label: "cumulative",
          data: this.mmrDistribution.distributedMmrs
            .slice()
            .reverse()
            .map((d) => d.count)
            .reduce((a, e, i) => {
              // a: Accumulator; e: current Element; i: current Index
              return a.length > 0 ? [...a, e + a[i - 1]] : [e];
            }, [])
            .reverse(),
          borderColor: "rgb(60,208,88)",
          type: "line",
          yAxisID: "y-axis-1",
        },
      ],
    };
  }

  get mmrDistributionChartOptions() {
    return {
      legend: {
        display: true,
      },
      tooltips: {
        custom: function (tooltip: { displayColors: boolean }) {
          if (!tooltip) return;
          tooltip.displayColors = false;
        },
        callbacks: {
          label: function (tooltipItem: { xLabel: any; yLabel: any }) {
            return `75.3%`;
          },
          title: function () {
            return "";
          },
        },
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            id: "y-axis-0",
            ticks: {
              beginAtZero: true,
            },
          },
          {
            id: "y-axis-1",
            position: "right",
            ticks: {
              beginAtZero: true,
            },
          },
        ],
        xAxes: [
          {
            ticks: {
              reverse: false,
            },
          },
        ],
      },
      annotation: {
        annotations: [
          {
            type: "line",
            mode: "vertical",
            scaleID: "x-axis-0",
            value: "> 1250",
            borderColor: "rgb(28,95,47, 0.7)",
            borderWidth: 2,
            borderDash: [10, 10],
            label: {
              content: "Your MMR",
              backgroundColor: "rgb(28,95,47, 0.7)",
              enabled: true,
              yAdjust: 10,
              xAdjust: -40,
              position: "top",
              cornerRadius: 0,
            },
          },
        ],
      },
    };
  }
}
</script>
