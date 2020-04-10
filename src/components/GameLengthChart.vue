<script lang="ts">
import { Component, Prop, Mixins } from "vue-property-decorator";

import { GameLength } from "@/store/overallStats/types";
import { Bar } from "vue-chartjs";
import { EGameMode } from "@/store/typings";
import moment from 'moment';

@Component({})
export default class GameLengthChart extends Mixins(Bar) {
  @Prop() public gameLengths!: GameLength[];

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

  get oneVersusOneLengths(): GameLength {
    return this.gameLengths.filter(g => g.gameMode === EGameMode.GM_1ON1)[0];
  }

  get passedTime() {
    return this.oneVersusOneLengths.lengths.map(g =>
      moment.utc(moment.duration(g.passedTimeInSeconds, "seconds").asMilliseconds()).format("mm:ss")
    );
  }

  get gamesCount() {
    return this.oneVersusOneLengths.lengths.map(g => g.games);
  }
}
</script>
