<template>
  <bar-chart
    :chart-data="mmrDistributionChartData"
    :chart-options="mmrDistributionChartOptions"
  />
</template>
<script lang="ts">
import minBy from "lodash/minBy";
import maxBy from "lodash/maxBy";
import clamp from "lodash/clamp";
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
  @Prop() public selectedGameMode!: EGameMode;

  private colors() {
    const colors = [];
    for (let i = 0; i < this.mmrDistribution.distributedMmrs.length; i++) {
      if (
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

  get mmrOfLoggedInPlayer(): number {
    if (!this.gameModeStats) return 0;

    return (
      this.gameModeStats.find(
        (g) =>
          g.gameMode === this.selectedGameMode &&
          g.season === this.selectedSeason?.id
      )?.mmr ?? 0
    );
  }

  get gameModeStats() {
    return this.$store.direct.state.player.gameModeStats;
  }

  get mmrGroupOfLoggedInPlayer(): number {
    if (!this.mmrOfLoggedInPlayer || !this.mmrDistribution.distributedMmrs) {
      return 0;
    }

    const minMMR = minBy(this.mmrDistribution.distributedMmrs, (d) => d.mmr);
    const maxMMR = maxBy(this.mmrDistribution.distributedMmrs, (d) => d.mmr);
    const clampedPlayerMMR = clamp(
      this.mmrOfLoggedInPlayer,
      minMMR!.mmr,
      maxMMR!.mmr
    );
    const mmrGroup = this.mmrDistribution.distributedMmrs.find(
      (d) => Math.abs(d.mmr + 25 - clampedPlayerMMR) <= 25
    );

    return mmrGroup ? mmrGroup.mmr : 0;
  }

  get mmrDistributionTotalPlayers(): number {
    return this.mmrDistribution.distributedMmrs
      .map((d) => d.count)
      .reduce((a, b) => a + b);
  }

  get isTop50percent(): boolean {
    const top50mmr = this.mmrDistribution.distributedMmrs[
      this.mmrDistribution.top50PercentIndex
    ].mmr;
    return this.mmrOfLoggedInPlayer > top50mmr;
  }

  get cumulativeSumData(): number[] {
    return this.mmrDistribution.distributedMmrs
      .slice()
      .reverse()
      .map((d) => d.count)
      .reduce<number[]>((a, e, i) => {
        // a: Accumulator; e: current Element; i: current Index
        return a.length > 0 ? [...a, e + a[i - 1]] : [e];
      }, [])
      .reverse();
  }

  get mmrDistributionChartData(): ChartData {
    if (!this.mmrDistribution.distributedMmrs) {
      return {};
    }

    return {
      labels: this.mmrDistribution.distributedMmrs.map((d) => `> ${d.mmr}`),
      datasets: [
        {
          label: "mmr",
          data: this.mmrDistribution.distributedMmrs.map((d) => d.count),
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          backgroundColor: this.colors,
        },
        {
          label: "cumulative",
          data: this.cumulativeSumData,
          borderColor: "rgb(60,208,88)",
          type: "line",
          yAxisID: "y-axis-1",
          fill: false,
        },
      ],
    };
  }

  get mmrDistributionChartOptions() {
    if (!this.mmrDistribution.distributedMmrs) {
      return null;
    }

    const annotations = this.mmrGroupOfLoggedInPlayer
      ? [
          {
            type: "line",
            mode: "vertical",
            scaleID: "x-axis-0",
            value: `> ${this.mmrGroupOfLoggedInPlayer}`,
            borderColor: "rgb(28,95,47, 0.7)",
            borderWidth: 2,
            borderDash: [10, 10],
            label: {
              content: "Your MMR",
              backgroundColor: "rgb(28,95,47, 0.7)",
              enabled: true,
              yAdjust: 10,
              xAdjust: this.isTop50percent ? 40 : -40, //Move label to left or right of line
              position: "top",
              cornerRadius: 0,
            },
          },
        ]
      : [];

    return {
      legend: {
        display: true,
      },
      tooltips: {
        bodyAlign: "center",
        custom: function (tooltip: { displayColors: boolean }) {
          if (!tooltip) return;
          tooltip.displayColors = false;
        },
        callbacks: {
          label: (tooltipItem: {
            xLabel: any;
            yLabel: any;
            datasetIndex: number;
          }) => {
            if (tooltipItem.datasetIndex === 0) {
              // MMR
              return `${tooltipItem.xLabel} - ${tooltipItem.yLabel}`;
            } else {
              //Cummulative
              const percent =
                100 -
                (tooltipItem.yLabel / this.mmrDistributionTotalPlayers) * 100;
              return `top ${Math.max(percent, 0.1).toFixed(0)}%`;
            }
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
              reverse: true,
            },
          },
        ],
      },
      annotation: {
        annotations,
      },
    };
  }
}
</script>
