<template>
  <div class="player-hero-statistics-table">
    <v-simple-table>
      <template v-slot:default>
        <thead>
          <tr>
            <th v-for="header in headers" :key="header.value" class="text-left">
              {{ header.text }}
            </th>
          </tr>
        </thead>
        <tbody class="player-hero-statistics-table__body">
          <tr v-for="item in heroStatsCurrentPage" :key="item.id">
            <td v-for="header in headers" :key="header.value" v-html="item[header.value]"></td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>

    <v-pagination
      v-model="page"
      :length="pageLength"
      prev-icon="mdi-menu-left"
      next-icon="mdi-menu-right"
    ></v-pagination>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { PlayerHeroStatistic } from "@/store/player/types";
import { Component, Prop, Watch } from "vue-property-decorator";

@Component
export default class PlayerHeroStatisticsTable extends Vue {
  @Prop() private heroStatistics!: PlayerHeroStatistic[];
  private page = 1;
  private paginationSize = 10;

  get pageOffset(): number {
    return this.paginationSize * this.page;
  }

  get pageLength(): number {
    return Math.ceil(this.heroStatistics.length / this.paginationSize);
  }
  get heroStatsCurrentPage(): PlayerHeroStatistic[] {
    return this.heroStatistics.slice((this.pageOffset - this.paginationSize), this.pageOffset);
  }

  get headers() {
    return [
      { text: "", value: "image" },
      { text: "Hero", value: "name" },
      { text: "Total", value: "total" },
      { text: "vs. Human", value: "hu" },
      { text: "vs. Orc", value: "orc" },
      { text: "vs. Undead", value: "ud" },
      { text: "vs. Night Elf", value: "ne" },
      { text: "vs. Random", value: "rand" },
    ];
  }

  @Watch("this.heroStatistics")
  heroStatsChange(): void {
    this.heroStatistics = this.heroStatistics.sort((a: PlayerHeroStatistic, b: PlayerHeroStatistic): number => {
      if (Number(a.total) > Number(b.total)) {
        return 1;
      }
      if (Number(b.total) > Number(a.total)) {
        return -1;
      }
      return 0;
    });
  }
}
</script>

<style>
.player-hero-statistics-table__hero-image {
  margin-top: 5px;
}
</style>
