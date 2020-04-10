<script lang="ts">
import { Component, Prop, Mixins } from "vue-property-decorator";

import { GameLength } from "@/store/overallStats/types";
import { Bar } from "vue-chartjs";
import moment from "moment";

@Component({})
export default class GameLengthChart extends Mixins(Bar) {
  @Prop() public gameLength!: GameLength;

  mounted() {
    this.renderChart(
      {
        labels: this.passedTime,
        datasets: [
          {
            label: "# of Games",
            data: this.gamesCount,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1
          }
        ]
      },
      {
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
      }
    );
  }

 get passedTime() {
    return this.gameLength.lengths.map(g =>
      moment.utc(moment.duration(g.passedTimeInSeconds, "seconds").asMilliseconds()).format("mm:ss")
    );
  }

  get gamesCount() {
    return this.gameLength.lengths.map(g => g.games);
  }
}
</script>
