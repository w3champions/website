<template>
    <div>
      {{ $t("components_player_tabs_playerstatistictab.playergamelengthaveragelabel") }} {{ selectedOpponentRaceName }}: {{ averageAgainstRace }}
      <bar-chart class="player-game-length" :chart-data="playerGameLengthChartData" />
    </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import Vue from "vue";
import { usePlayerStore } from "@/store/player/store";
import { ERaceEnum } from "@/store/types";
import { formatSecondsToDuration } from "@/helpers/date-functions";

@Component({
  components: { BarChart },
})
export default class PlayerGameLengthStats extends Vue {
  private player = usePlayerStore();
  @Prop() selectedOpponentRace!: ERaceEnum;
  @Prop() selectedOpponentRaceName!: string;

  get averageAgainstRace() {
    const lengthState = this.player.playerGameLengthStats;
    const average = lengthState?.averageGameLengthByOpponentRace?.[this.selectedOpponentRace] || 0;
    return formatSecondsToDuration(average);
  }

  get lengths() {
    const lengthStatsIntervals = this.player.playerGameLengthStats?.playerGameLengthIntervalByOpponentRace;
    const lengths = lengthStatsIntervals?.[this.selectedOpponentRace]?.lengths || {};
    this.fillNonExistingIntervals(lengths);

    return lengths;
  }

  fillNonExistingIntervals(lengths: Record<number, number>): void {
    const lengthsKeys = Object.keys(lengths);

    // fill non existent intervals with 0 games
    if (lengthsKeys.length) {
      const maxNumberOfIntervals = 60;
      for (let i = 0; i < maxNumberOfIntervals; i++) {
        const key: number = i * 60;
        const shouldAdd = !(key in lengths);
        if ( shouldAdd ) {
          lengths[key] = 0;
        }
      }
    }
  }

  get intervals() {
    const intervals = Object.keys(this.lengths).map((e) => formatSecondsToDuration(parseInt(e)));
    // games in the last position have 60 min or more, so add + as suffix
    intervals[intervals.length - 1] = intervals[intervals.length - 1] + "+";
    return intervals.slice(2); // slicing to ignoring first 2 min of game
  }

  get games() {
    return Object.values(this.lengths).slice(2); // slicing to ignoring first 2 min of game
  }

  get playerGameLengthChartData() {
    return {
      labels: this.intervals,
      datasets: [
        {
          label: String(
            this.$t(
              "components_overall-statistics_gamelengthchart.amountofgames"
            )
          ),
          data: this.games,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  }

}
</script>

<style scoped lang="scss">
.player-game-length {
  margin-right: 24px;
  margin-bottom: 24px;
}

</style>