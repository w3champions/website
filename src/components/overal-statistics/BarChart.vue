<script lang="ts">
import { Component, Prop, Mixins, Watch } from "vue-property-decorator";
import { Bar, mixins } from "vue-chartjs";
import { ChartData, ChartOptions } from "chart.js";
import chartjsPluginAnnotation from "chartjs-plugin-annotation";
import { DefaultOptions } from "@/types/BarChart";

@Component({
  mixins: [mixins.reactiveProp],
})
export default class BarChart extends Mixins(Bar) {
  @Prop() public chartData!: ChartData;
  @Prop() public xAxesReversed!: boolean;
  @Prop() public chartOptions!: ChartOptions;

  get options() {
    return this.chartOptions ?? DefaultOptions;
  }

  @Watch("chartOptions", { deep: true })
  onOptionsChanged(newOptions: ChartOptions) {
    if (this.chartData) this.renderChart(this.chartData, newOptions);
  }

  mounted() {
    if (this.chartData) {
      this.addPlugin([chartjsPluginAnnotation]);
      this.renderChart(this.chartData, this.options);
      if (
        this.options != null &&
        this.options.scales != null &&
        this.options.scales.xAxes != null &&
        this.options.scales.xAxes[0].ticks != null
      ) {
        this.options.scales.xAxes[0].ticks.reverse = this.xAxesReversed;
      }
    }

    this.renderChart(this.chartData, this.options);
  }  
}
</script>
