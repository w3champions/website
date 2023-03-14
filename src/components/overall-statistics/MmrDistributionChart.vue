<template>
  <bar-chart
    :chart-data="mmrDistributionChartData"
    :chart-options="mmrDistributionChartOptions"
  />
</template>
<script lang="ts">
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { MmrDistribution } from "@/store/overallStats/types";
import { Season } from "@/store/ranking/types";
import { EGameMode } from "@/store/typings";
import { ChartOptions } from "chart.js";
import { AnnotationOptions } from "chartjs-plugin-annotation";
import clamp from "lodash/clamp";
import maxBy from "lodash/maxBy";
import minBy from "lodash/minBy";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({
  components: { BarChart },
})
export default class MmrDistributionChart extends Vue {
  @Prop() public mmrDistribution!: MmrDistribution;
  @Prop() public selectedSeason!: Season;
  @Prop() public selectedGameMode!: EGameMode;

  private colors(): string[] {
    const colors: string[] = [];
    for (let i = 0; i < this.mmrDistribution.distributedMmrs.length; i++) {
      if (
        i === this.mmrDistribution.top2PercentIndex ||
        i === this.mmrDistribution.top5PercentIndex ||
        i === this.mmrDistribution.top10PercentIndex ||
        i === this.mmrDistribution.top25PercentIndex ||
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

    const minMMR = minBy(
      this.mmrDistribution.distributedMmrs,
      (d) => d.mmr
    ) || { mmr: 0, count: 0 };
    const maxMMR = maxBy(
      this.mmrDistribution.distributedMmrs,
      (d) => d.mmr
    ) || { mmr: 0, count: 0 };

    const clampedPlayerMMR = clamp(
      this.mmrOfLoggedInPlayer,
      minMMR.mmr,
      maxMMR.mmr
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
    const top50mmr =
      this.mmrDistribution.distributedMmrs[
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

// get mmrDistributionChartData(): ChartData<"bar" | "line", unknown> | null { // FIXME
  get mmrDistributionChartData(): unknown | null {
    if (!this.mmrDistribution.distributedMmrs) {
      return null;
    }

    return {
      labels: this.mmrDistribution.distributedMmrs.map((d) => `> ${d.mmr}`),
      datasets: [
        {
          type: "bar",
          yAxisID: "y-axis-0",
          label: "MMR",
          data: this.mmrDistribution.distributedMmrs.map((d) => d.count),
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          backgroundColor: this.colors,
        },
        {
          type: "line",
          yAxisID: "y-axis-1",
          label: "Cumulative",
          data: this.cumulativeSumData,
          borderColor: "rgb(60,208,88)",
          fill: false,
        },
      ],
    };
  }

  get mmrDistributionChartOptions(): ChartOptions | null {
    if (!this.mmrDistribution.distributedMmrs) {
      return null;
    }
    const annotations: { [key: string]: AnnotationOptions } = this.mmrGroupOfLoggedInPlayer
        ? {
          x: {
            type: "line",
            scaleID: "x",
            value: `> ${this.mmrGroupOfLoggedInPlayer}`,
            borderColor: "rgb(28,95,47, 0.7)",
            borderWidth: 2,
            borderDash: [10, 10],
            label: {
              display: true,
              content: "Your MMR",
              backgroundColor: "rgb(28,95,47, 0.7)",
              yAdjust: 10,
              xAdjust: this.isTop50percent ? 40 : -40, //Move label to left or right of line
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
                const percent = 100 - (value / this.mmrDistributionTotalPlayers) * 100;
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
  }
}
</script>
