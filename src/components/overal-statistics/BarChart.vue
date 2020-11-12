<script lang="ts">
import { Component, Prop, Mixins, Watch } from "vue-property-decorator";
import { Bar, mixins } from "vue-chartjs";
import { ChartData, ChartOptions } from "chart.js";
import chartjsPluginAnnotation from "chartjs-plugin-annotation";

@Component({
  mixins: [mixins.reactiveProp],
})
export default class BarChart extends Mixins(Bar) {
  @Prop() public chartData!: ChartData;
  @Prop() public chartOptions: any;

  get options() {
    return this.chartOptions ?? this.defaultOptions;
  }

  //default options
  private defaultOptions = {
    legend: {
      display: true,
    },
    tooltips: {
      bodyAlign: "center",
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

  mounted() {
    if (this.chartData) {
      this.addPlugin([chartjsPluginAnnotation]);
      this.renderChart(this.chartData, this.options);
    }
  }

  @Watch("chartOptions", { deep: true })
  onOptionsChanged(newOptions: ChartOptions) {
    if (this.chartData) this.renderChart(this.chartData, newOptions);
  }
}
</script>
