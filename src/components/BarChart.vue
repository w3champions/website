<script lang="ts">
import { Component, Prop, Mixins } from "vue-property-decorator";

import { Bar, mixins } from "vue-chartjs";
import { ChartData } from "chart.js";

@Component({
  mixins: [mixins.reactiveProp]
})
export default class BarChart extends Mixins(Bar) {
  @Prop() public chartData!: ChartData;

  mounted() {
    this.renderChart(this.chartData, {
      legend: {
        display: false
      },
      tooltips: {
        custom: function(tooltip) {
          if (!tooltip) return;
          tooltip.displayColors = false;
        },
        callbacks: {
          label: function(tooltipItem) {
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
    });
  }
}
</script>
