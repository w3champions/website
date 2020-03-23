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
import { Prop } from "vue-property-decorator";
import { RaceStat } from "@/store/player/types";
import { ERaceEnum } from "@/store/typings";

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
      this.getGamesFor(ERaceEnum.HUMAN),
      this.getGamesFor(ERaceEnum.ORC),
      this.getGamesFor(ERaceEnum.NIGHT_ELF),
      this.getGamesFor(ERaceEnum.UNDEAD)
    ];
    if (this.statsContainRandom())
      wins.push(this.getGamesFor(ERaceEnum.RANDOM));
    return wins;
  }

  private statsContainRandom() {
    return this.stats.filter(s => s.race === ERaceEnum.RANDOM);
  }

  private getCategories() {
    const eRaceEnumElement = ERaceEnum[ERaceEnum.HUMAN];
    const axis = [
      this.$t("races." + eRaceEnumElement),
      this.$t("races." + ERaceEnum[ERaceEnum.ORC]),
      this.$t("races." + ERaceEnum[ERaceEnum.NIGHT_ELF]),
      this.$t("races." + ERaceEnum[ERaceEnum.UNDEAD])
    ];
    if (this.statsContainRandom())
      axis.push(this.$t("races." + ERaceEnum[ERaceEnum.RANDOM]));
    return axis;
  }

  private getGamesFor(race: ERaceEnum) {
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
