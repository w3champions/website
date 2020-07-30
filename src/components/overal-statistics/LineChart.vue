<script lang="ts">

import { Component, Prop, Mixins } from "vue-property-decorator";
import { Line, mixins } from "vue-chartjs";
import { ChartData } from "chart.js";

@Component({
  mixins: [mixins.reactiveProp],
})
export default class BarChart extends Mixins(Line) {
  @Prop() public chartData!: ChartData;

  private options = {
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
          return `${tooltipItem.xLabel} - ${tooltipItem.yLabel}`;
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
          ticks: {
            beginAtZero: true,
          },
        },
      ],
    },
  };

  mounted() {
    if (this.chartData) {
      this.renderChart(this.chartData, this.options);
    }
  }
}
</script>
