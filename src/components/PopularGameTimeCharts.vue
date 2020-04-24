<script lang="ts">
import { Component, Prop, Mixins } from "vue-property-decorator";

import { PopularGameHour } from "@/store/overallStats/types";
import { Bar } from "vue-chartjs";
import moment from "moment";

@Component({})
export default class PopularGameTimeCharts extends Mixins(Bar) {
  @Prop() public gameHours!: PopularGameHour;

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

  getTrimmedTimes() {
    const times = this.gameHours.playTimePerHour.slice(4);
    times.pop();
    return times;
  }

  get passedTime() {
    return this.getTrimmedTimes().map(g =>
      moment
        .utc(moment.duration(g.hours, "hours").add(moment.duration(g.minutes, "minutes")).asMilliseconds())
        .format("HH:mm")
    );
  }

  get gamesCount() {
    return this.getTrimmedTimes().map(g => g.games);
  }
}
</script>
