<template>
  <bar-chart :chart-data="gameHourChartData" :chartOptions="mergedChartOptions" />
</template>
<script lang="ts">
import { Component, Prop } from "vue-property-decorator";

import { PlayedHero } from "@/store/overallStats/types";
import BarChart from "@/components/overal-statistics/BarChart.vue";
import { ChartData, ChartOptions } from "chart.js";
import Vue from "vue";
import { HeroIndex, HeroNames } from "@/enums/Heroes";
import { HeroIcons } from "@/types/Heroes";
import { DefaultOptions } from "@/types/BarChart";

@Component({
  components: { BarChart },
})
export default class PlayedHeroesChart extends Vue {
  @Prop() public playedHeroes!: PlayedHero[];
  @Prop() public mode!: string;
  @Prop() public pick!: string;  

  get orderedHeroes(): PlayedHero[] {
    return this.playedHeroes
      .map((h) => ({
        icon: this.$t("heroNames." + h.icon).toString(),
        count: h.count,
      }))
      .sort(this.compare);
  }

  private compare(a: PlayedHero, b: PlayedHero): number {
    if (this.compareHeroRace(a, b) === -1) {
      return -1;
    } else if (this.compareHeroRace(a, b) === 0) {
      return b.count - a.count;
    }

    return 1;
  }

  private compareHeroRace(a: PlayedHero, b: PlayedHero) {
    const first = HeroIcons.find((f: any) => f.icon === a.icon);
    const second = HeroIcons.find((f: any) => f.icon === b.icon);

    if (first != null && second != null) {
      if (first.index < second.index) {
        return -1;
      } else if (first.index === second.index) {
        return 0;
      } else {
        return 1;
      }
    }

    if (first != null) {
      return -1;
    } else {
      return 1;
    }
  }

  get gameHourChartData(): ChartData {
    return {
      labels: this.orderedHeroes.map((p) => p.icon),
      datasets: [
        {
          label: "played heroes",
          data: this.generatePercentageGroupedByHeroRace,
          backgroundColor: this.backgroundColors,
          borderWidth: 1,
        },
      ],
    };
  }

  get generatePercentageGroupedByHeroRace(): number[] {
    var totals: number[] = [];
    totals[HeroIndex.Human] = this.calculateSumTotal(HeroIndex.Human);
    totals[HeroIndex.Orc] = this.calculateSumTotal(HeroIndex.Orc);
    totals[HeroIndex.NightElf] = this.calculateSumTotal(HeroIndex.NightElf);
    totals[HeroIndex.Undead] = this.calculateSumTotal(HeroIndex.Undead);
    totals[HeroIndex.Tavern] = this.calculateSumTotal(HeroIndex.Tavern);
    
    return this.orderedHeroes.map((p) => {
        var index = HeroIcons.find((f: any) => f.icon === p.icon)?.index ?? -1;
        return ((p.count / totals[index]) * 100);
      });
  }

  private calculateSumTotal(index: number): number {
    if (!this.orderedHeroes || !this.orderedHeroes.length) {
      return -1;
    }
    return this.orderedHeroes.filter((hero: PlayedHero) => index === HeroIcons.find((f: any) => f.icon === hero.icon)?.index ?? -1)
      .map((value: PlayedHero) => value.count)
      .reduce((accumulator: number, currentValue: number) => accumulator + currentValue);
  }

  get formattedTitle(): string {
    return `Hero Distribution for ${this.mode} (${this.pick} pick)`;
  }
  
  private backgroundColors = [
    "rgba(85, 172, 215, 255)",
    "rgba(85, 172, 215, 255)",
    "rgba(85, 172, 215, 255)",
    "rgba(85, 172, 215, 255)",
    "rgba(233, 151, 143, 255)",
    "rgba(233, 151, 143, 255)",
    "rgba(233, 151, 143, 255)",
    "rgba(233, 151, 143, 255)",    
    "rgba(74, 172, 155, 255)",
    "rgba(74, 172, 155, 255)",
    "rgba(74, 172, 155, 255)",
    "rgba(74, 172, 155, 255)",
    "rgba(199, 159, 233, 255)",
    "rgba(199, 159, 233, 255)",
    "rgba(199, 159, 233, 255)",
    "rgba(199, 159, 233, 255)",
    "rgba(180, 157, 72, 255)",
    "rgba(180, 157, 72, 255)",
    "rgba(180, 157, 72, 255)",
    "rgba(180, 157, 72, 255)",
    "rgba(180, 157, 72, 255)",
    "rgba(180, 157, 72, 255)",
    "rgba(180, 157, 72, 255)",
    "rgba(180, 157, 72, 255)",
  ];

  private chartOptions: ChartOptions = {
      legend: {
        display: false,        
      },
      title: {
        display: true,
        text: this.formattedTitle,
        fontSize: 16,
        fontStyle: "bold"
      },
      scales: {        
        yAxes: [
          {
            ticks: {
              min: 0,

              callback: (value: any, index: number, values: any[]) => {
                return value + "%";
              },
            },
            scaleLabel: {
              display: false,
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
      }
    };

    private mergedChartOptions: ChartOptions = Object.assign({}, DefaultOptions, this.chartOptions)
}
</script>
