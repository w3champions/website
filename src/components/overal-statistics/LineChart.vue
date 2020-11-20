<script lang="ts">
import { Component, Prop, Mixins } from "vue-property-decorator";
import { Line, mixins } from "vue-chartjs";
import { ChartData } from "chart.js";

@Component({
  mixins: [mixins.reactiveProp],
})
export default class LineChart extends Mixins(Line) {
  @Prop() public chartData!: ChartData;
  @Prop() public beginYAxisAtZero?: boolean;

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
    let gradient = this.$refs.canvas
      .getContext("2d")
      .createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0.1, "rgba(54, 162, 235, 0.5)");
    gradient.addColorStop(0.3, "rgba(54, 162, 235, 0.25)");
    gradient.addColorStop(0.6, "rgba(54, 162, 235, 0.1)");
    gradient.addColorStop(0.85, "rgba(54, 162, 235, 0.0)");
    if (this.chartData.datasets) {
      this.chartData.datasets[0].backgroundColor = gradient;
    }
    if (this.beginYAxisAtZero !== undefined) {
      this.options.scales.yAxes[0].ticks.beginAtZero = this.beginYAxisAtZero;
    }
    if (this.chartData) {
      this.renderChart(this.chartData, this.options);
    }
  }
}
</script>
