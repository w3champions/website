<template>
  <VueApexCharts
    type="radar"
    :options="options"
    :series="series"
  ></VueApexCharts>
</template>

<script lang="ts">
  import Vue from "vue";
  import VueApexCharts from "vue-apexcharts/dist/vue-apexcharts";

  import Component from "vue-class-component";
  import {Prop} from "vue-property-decorator";
  import {Race, RaceStat} from "@/store/player/types";

  @Component({
  components: {
    VueApexCharts
  }
})
export default class RaceSpiderChart extends Vue {
  @Prop() public stats!: RaceStat[];

  public series = [
    {
      name: "wins",
      data: this.winSeries()
    }
  ];

  private winSeries() {
    const wins = [
      this.getGamesFor(Race.human),
      this.getGamesFor(Race.orc),
      this.getGamesFor(Race.nightElf),
      this.getGamesFor(Race.undead)
    ];
    if (this.statsContainRandom()) wins.push(this.getGamesFor(Race.random));
    return wins;
  }

  private statsContainRandom() {
    return this.stats.filter(s => s.race === Race.random);
  }

  private getCategories() {
    const axis = ["Human", "Orc", "Nightelf", "Undead"];
    if (this.statsContainRandom()) axis.push("Random");
    return axis;
  }

  private getGamesFor(race: Race) {
    const raceStats = this.stats.filter(s => s.race == race);
    const raceStat = raceStats[0];
    return raceStat.total;
  }

  public options = {
    chart: {
      toolbar: {
        show: false
      },
      dropShadow: {
        enabled: true,
        blur: 1,
        left: 1,
        top: 1
      }
    },
    xaxis: {
      categories: this.getCategories()
    },
    stroke: {
      width: 0
    },
    fill: {
      opacity: 0.4
    },
    markers: {
      size: 0
    }
  };
}
</script>
