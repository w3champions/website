<template>
  <div>
    <line-chart
      ref="chart"
      :chart-data="mmrRpChartData"
      :chart-options="chartOptions"
    />
  </div>
</template>
<script lang="ts">
import { PlayerMmrRpTimeline } from "@/store/player/types";
import { ChartData } from "chart.js";
import { ChartOptions } from "chart.js/auto";
import { parseJSON, startOfDay } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { Component, Prop } from "vue-property-decorator";
import LineChart, { defaultOptions, defaultOptionsXAxis } from "@/components/overall-statistics/LineChart.vue";
import Vue from "vue";

@Component({
  components: { LineChart },
})
export default class PlayerMmrRpTimelineChart extends Vue {
  @Prop() public mmrRpTimeline!: PlayerMmrRpTimeline;

  get mmrValues(): number[] {
    return this.mmrRpTimeline.mmrRpAtDates.map((m) => m.mmr);
  }

  get rpValues(): number[] {
    return this.mmrRpTimeline.mmrRpAtDates.map((m) => m.rp);
  }

  get Dates(): Date[] {
    // Workaround: prevent dates from moving into the next day due to timezone conversion.
    return this.mmrRpTimeline.mmrRpAtDates.map((m) => startOfDay(utcToZonedTime(parseJSON(m.date), "UTC")));
  }

  get chartOptions(): ChartOptions {
    const options: ChartOptions = {
      scales: {
        x: defaultOptionsXAxis,
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: "MMR",
          },
        },
        y1: {
          position: "right",
          beginAtZero: false,
          title: {
            display: true,
            text: "RP",
          },
        },
      },
    };
    return { ...defaultOptions(), ...options };
  }

  get mmrRpChartData(): ChartData {
    return {
      labels: this.Dates,
      datasets: [
        {
          yAxisID: "y",
          label: "MMR",
          data: this.mmrValues,
          borderColor: "rgba(54, 162, 235, 1)",
          fill: true,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderWidth: 1.0,
          pointStyle: "circle",
          pointRadius: 1.2,
          pointBorderWidth: 1.8,
          tension: 0.4, // Smooth line.
        },
        {
          yAxisID: "y1",
          label: "RP",
          data: this.rpValues,
          borderColor: "rgba(150, 80, 100, 1)",
          fill: true,
          backgroundColor: "rgba(150, 80, 100, 0.2)",
          borderWidth: 1.0,
          pointStyle: "circle",
          pointRadius: 1.2,
          pointBorderWidth: 1.8,
          tension: 0.4, // Smooth line.
        },
      ],
    };
  }
}
</script>
