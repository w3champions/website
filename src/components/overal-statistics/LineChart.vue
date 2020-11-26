<script lang="ts">
import { Component, Prop, Mixins } from "vue-property-decorator";
import { Line, mixins } from "vue-chartjs";
import { ChartData, TimeUnit } from "chart.js";

@Component({
  mixins: [mixins.reactiveProp],
})
export default class LineChart extends Mixins(Line) {
  @Prop() public chartData!: ChartData;
  @Prop() public customYAxes?: any;

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
          type: "time",
          time: {
            // Cast prevents a bug
            unit: "day" as TimeUnit,
            displayFormats: {
              day: "MMM DD, YYYY",
            },
          },
        },
      ],
    },
  };

  mounted() {
    // For each line in graph, create gradient backgroundColor
    if (this.chartData.datasets) {
      const canv = document.getElementById("line-chart") as HTMLCanvasElement;
      for (var _i = 0; _i < this.chartData.datasets.length; _i++) {
        let color = this.chartData.datasets[_i]?.borderColor as string;
        if (color) {
          const gradient = canv
            .getContext("2d")
            ?.createLinearGradient(0, 0, 0, canv.height);
          // regex takes "(X,X,X" from color string
          // e.g. "rgb(23, 21, 42)" -> "(23, 21, 42"
          // this will be assembled to full string e.g. "rgba(23, 21, 42, 0.5)"
          const regex = /\((\d*,\s?){2}\d*/g;
          gradient?.addColorStop(0.1, "rgba" + color.match(regex) + ", 0.5)");
          gradient?.addColorStop(0.3, "rgba" + color.match(regex) + ", 0.25)");
          gradient?.addColorStop(0.6, "rgba" + color.match(regex) + ", 0.1)");
          gradient?.addColorStop(0.85, "rgba" + color.match(regex) + ", 0.0)");
          this.chartData.datasets[_i].backgroundColor = gradient;
        }
      }
    }
    if (this.customYAxes !== undefined) {
      this.options.scales.yAxes = this.customYAxes;
    }
    if (this.chartData) {
      this.renderChart(this.chartData, this.options);
    }
  }
}
</script>
