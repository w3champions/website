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
import moment, { Moment } from "moment";
import LineChart from "@/components/overal-statistics/LineChart.vue";
import Vue from "vue";
import { ChartData } from "chart.js";

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

  get Dates(): string[] {
    return this.mmrRpTimeline.mmrRpAtDates.map((m) =>
      // utcOffset(0) prevents dates from moving into the next day
      // due to timezone conversion
      moment(m.date).utcOffset(0).format("MMM DD, YYYY")
    );
  }

  get YAxesSettings(): any {
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
