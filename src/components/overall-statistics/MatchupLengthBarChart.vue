<template>
  <div>
    <bar-chart class="matchup-length" :chart-data="matchupLengthChartData" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-facing-decorator";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import { useOverallStatsStore } from "@/store/overallStats/store";
import { formatSecondsToDuration } from "@/helpers/date-functions";
import { MmrRangeValues } from "@/store/overallStats/types";

@Component({
  components: { BarChart },
})
export default class PlayerGameLengthStats extends Vue {
  private statsStore = useOverallStatsStore();
  @Prop() mmrRange!: MmrRangeValues;

  get lengths() {
    const mmrRange = this.statsStore.matchupMmrRange;
    return this.statsStore.matchupLength?.lengthsByMmrRange?.[mmrRange] || [];
  }

  get intervals() {
    const intervals = this.lengths.map((e) => formatSecondsToDuration(e.seconds));
    // games in the last position have 60 min or more, so add + as suffix
    intervals[intervals.length - 1] = intervals[intervals.length - 1] + "+";
    return intervals.slice(4); // slicing to ignoring first 2 min of game
  }

  get games() {
    return this.lengths.slice(4).map((e) => e.games); // slicing to ignoring first 2 min of game
  }

  get matchupLengthChartData() {
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
.matchup-length {
  margin-right: 24px;
  margin-bottom: 24px;
}

</style>