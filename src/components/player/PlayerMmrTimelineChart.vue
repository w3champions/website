<template>
  <div>
    <line-chart
      ref="chart"
      :chart-data="mmrChartData"
      :begin-y-axis-at-zero="false"
    />
  </div>
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { PlayerMmrTimeline } from "@/store/player/types";
import moment from "moment";
import LineChart from "@/components/overal-statistics/LineChart.vue";
import Vue from "vue";
import { ChartData } from "chart.js";

@Component({
  components: { LineChart },
})
export default class PlayerMmrTimelineChart extends Vue {
  @Prop() public mmrTimeline!: PlayerMmrTimeline;

  get mmrValues(): number[] {
    return this.mmrTimeline.mmrAtTimes.map((m) => m.mmr);
  }

  get mmrDates(): string[] {
    return this.mmrTimeline.mmrAtTimes.map((m) =>
      moment(m.mmrTime).format("LL")
    );
  }

  get mmrChartData(): ChartData {
    return {
      labels: this.mmrDates,
      datasets: [
        {
          label: "MMR",
          data: this.mmrValues,
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1.0,
          pointStyle: "circle",
          pointRadius: 1.2,
          pointBorderWidth: 1.8,
          lineTension: 0.0,
        },
      ],
    };
  }
}
</script>
