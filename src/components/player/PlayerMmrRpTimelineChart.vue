<template>
  <div>
    <line-chart
      ref="chart"
      :chart-data="mmrRpChartData"
      :custom-y-axes="YAxesSettings"
    />
  </div>
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { PlayerMmrRpTimeline } from "@/store/player/types";
import LineChart from "@/components/overall-statistics/LineChart.vue";
import Vue from "vue";
import { ChartData } from "chart.js";
import { parseJSON } from "date-fns";

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
    // TODO? moment: utcOffset(0) prevents dates from moving into the next day due to timezone conversion
    return this.mmrRpTimeline.mmrRpAtDates.map((m) => parseJSON(m.date));
  }

  get YAxesSettings() {
    return [
      {
        id: "y-axis-0",
        ticks: {
          beginAtZero: false,
        },
        scaleLabel: {
          display: true,
          labelString: "MMR",
        },
      },
      {
        id: "y-axis-1",
        position: "right",
        ticks: {
          beginAtZero: false,
        },
        scaleLabel: {
          display: true,
          labelString: "RP",
        },
      },
    ];
  }

  get mmrRpChartData(): ChartData {
    return {
      labels: this.Dates,
      datasets: [
        {
          label: "MMR",
          data: this.mmrValues,
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1.0,
          pointStyle: "circle",
          pointRadius: 1.2,
          pointBorderWidth: 1.8,
        },
        {
          label: "RP",
          data: this.rpValues,
          borderColor: "rgba(150, 80, 100, 1)",
          backgroundColor: "rgba(126,126,126,0.08)",
          borderWidth: 1.0,
          pointStyle: "circle",
          pointRadius: 1.2,
          pointBorderWidth: 1.8,
          yAxisID: "y-axis-1",
        },
      ],
    };
  }
}
</script>
