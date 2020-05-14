<template>
  <bar-chart :chart-data="gameHourChartData" :chart-options="chartOptions" />
</template>
<script lang="ts">
  import {Component, Prop} from "vue-property-decorator";

  import {MmrDistribution} from "@/store/overallStats/types";
  import {ChartData, ChartOptions} from "chart.js";
  import Vue from "vue";
  import BarChart from "@/components/overal-statistics/BarChart.vue";
  import {EGameMode} from "@/store/typings";
  import {Season} from "@/store/ranking/types";

  @Component({
  components: { BarChart }
})
export default class MmrDistributionChart extends Vue {
  @Prop() public mmrDistribution!: MmrDistribution;
  @Prop() public selectedSeason!: Season;

  get colors() {
    const colors = [];
    for (let i = 0; i < this.mmrDistribution.distributedMmrs.length; i++) {
      if (i === this.mmrDistribution.top2PercentIndex
       || i === this.mmrDistribution.top5PercentIndex
       || i === this.mmrDistribution.top10PercentIndex
       || i === this.mmrDistribution.top25ercentIndex
       || i === this.mmrDistribution.top50PercentIndex) {
        colors.push("rgb(66,23,63)");
      }
      else {
        colors.push("rgba(54, 162, 235, 0.2)");
      }

      if (this.isYou(i)) {
        colors.pop()
        colors.push("rgb(28,95,47)");
      }
    }
    return colors;
  }

  get mmrOfLoggedInPlayer() {
    if (!this.$store.direct.state.player.playerProfile.gateWayStats) {
      if (this.$store.direct.state.oauth.blizzardVerifiedBtag) {
        this.$store.direct.dispatch.player.loadProfile(this.$store.direct.state.oauth.blizzardVerifiedBtag);
      }
      return 0;
    }
    const gateWayStat = this.$store.direct.state.player.playerProfile.gateWayStats.filter(g => g.season === this.selectedSeason.id);

    if (!gateWayStat) return 0;
    const mmrs = gateWayStat.map(f => f.gameModeStats.filter(g => g.mode === EGameMode.GM_1ON1)[0].mmr)
    return Math.max(...mmrs);
  }

  public isYou(index: number) {
    return Math.abs(this.mmrDistribution.distributedMmrs[index].mmr + 25 - this.mmrOfLoggedInPlayer) < 12
  }

  get gameHourChartData(): ChartData {
    return {
      labels: this.mmrDistribution.distributedMmrs.map(d => `> ${d.mmr}`),
      datasets: [
        {
          label: "mmr",
          data: this.mmrDistribution.distributedMmrs.map(d => d.count),
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          backgroundColor: this.colors
        }
      ]
    };
  }

  get chartOptions(): ChartOptions {
  return  {
      legend: {
        display: true
      },
      tooltips: {
        custom: function(tooltip: { displayColors: boolean; }) {
          if (!tooltip) return;
          tooltip.displayColors = false;
        },
        callbacks: {
          label: function(tooltipItem: { xLabel: any; yLabel: any; }) {
            return `${tooltipItem.xLabel} - ${tooltipItem.yLabel}`;
          },
          title: function() {
            return "";
          }
        }
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true
            }
          }
        ]
      }
    };
  }
}
</script>
