<script lang="ts">
import { Component, Prop, Mixins } from "vue-property-decorator";
import { Line } from "vue-chartjs";

import { GameDay } from "@/store/overallStats/types";

@Component({})
export default class PlayersPerDayChart extends Mixins(Line) {
  @Prop() public gameDays!: GameDay[];

  mounted() {
    this.renderChart(
      {
        labels: this.gameDayDates,
        datasets: [
          {
            label: "# of Games",
            data: this.gameDayCounts,
            backgroundColor: ["rgba(54, 162, 235, 0.2)"],
            borderColor: ["rgba(54, 162, 235, 1)"],
            borderWidth: 1
          }
        ]
      },
      {
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

  get gameDayDates() {
    return this.gameDays.map(g => g.date.toString());
  }

  get gameDayCounts() {
    return this.gameDays.map(g => g.gamesPlayed);
  }
}
</script>
