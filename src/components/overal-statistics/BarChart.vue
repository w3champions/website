<script lang="ts">
import { Component, Prop, Mixins } from "vue-property-decorator";

import { Bar, mixins } from "vue-chartjs";
import { ChartData } from "chart.js";

@Component({
  mixins: [mixins.reactiveProp],
})
export default class BarChart extends Mixins(Bar) {
  @Prop() public chartData!: ChartData;
  @Prop() public xAxesReversed!: boolean;

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
      xAxes: [
        {
          ticks: {
            reverse: false
          },
        },
      ],
    },
  };
  
  mounted() {
    if (this.chartData) {
      this.options.scales.xAxes[0].ticks.reverse = this.xAxesReversed;
      this.renderChart(this.chartData, this.options);
    }
  }
}
</script>
