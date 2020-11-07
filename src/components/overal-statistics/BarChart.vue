<script lang="ts">
import { Component, Prop, Mixins, Watch } from "vue-property-decorator";

import { Bar, mixins } from "vue-chartjs";
import { ChartData, ChartOptions } from "chart.js";

@Component({
  mixins: [mixins.reactiveProp],
})
export default class BarChart extends Mixins(Bar) {
  @Prop() public chartData!: ChartData;
  @Prop() public xAxesReversed!: boolean;
  @Prop() public options!: ChartOptions;

  get mergedOptions(): ChartOptions {
    return Object.assign(this.defaultOptions, this.options);
  }

  private defaultOptions: ChartOptions = {
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
            reverse: false,
          },
        },
      ],
    },
  };

  @Watch("options")
  onOptionsUpdated(updated: ChartOptions) {
    this.$data._chart.options = this.options;
    this.updateChart();
  }

  updateChart () {
    this.$data._chart.update();
  }

  mounted() {
    if (this.chartData) {
      if (
        this.mergedOptions != null &&
        this.mergedOptions.scales != null &&
        this.mergedOptions.scales.xAxes != null &&
        this.mergedOptions.scales.xAxes[0].ticks != null
      )
        this.mergedOptions.scales.xAxes[0].ticks.reverse = this.xAxesReversed;
    }

    this.renderChart(this.chartData, this.mergedOptions);
  }
}
</script>
