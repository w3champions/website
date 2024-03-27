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
import { ChartData , ChartOptions, ScriptableContext } from "chart.js";
import { parseJSON, startOfDay } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { Component, Prop, Vue } from "vue-facing-decorator";
import LineChart, { defaultOptions, defaultOptionsXAxis, getBackgroundColor } from "@/components/overall-statistics/LineChart.vue";

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
          borderColor: "rgb(54, 162, 235)",
          fill: true,
          backgroundColor: (context: ScriptableContext<"line">) => getBackgroundColor(context, "rgb(54, 162, 235)"),
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
          borderColor: "rgb(150, 80, 100)",
          fill: true,
          backgroundColor: (context: ScriptableContext<"line">) => getBackgroundColor(context, "rgb(150, 80, 100)"),
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
