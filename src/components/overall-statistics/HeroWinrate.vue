<template>
  <v-card-text>
    <v-card-title>Winrates of hero matchups</v-card-title>
    <v-row no-gutters>
      <v-col :cols="4" :sm="2">
        <hero-picture-select :hero-index="0" />
      </v-col>
      <v-col :cols="4" :sm="2">
        <hero-picture-select :hero-index="1" />
      </v-col>
      <v-col :cols="4" :sm="2">
        <hero-picture-select :hero-index="2" />
      </v-col>
      <v-col :cols="4" :sm="2">
        <hero-picture-select :hero-index="3" />
      </v-col>
      <v-col :cols="4" :sm="2">
        <hero-picture-select :hero-index="4" />
      </v-col>
      <v-col :cols="4" :sm="2">
        <hero-picture-select :hero-index="5" />
      </v-col>
    </v-row>
    <h2 class="justify-center text-center mt-4">
      <span :class="winrateClass" v-if="wins !== 0 && losses !== 0">
        {{
          wins === 0 && losses === 0 ? "-" : (winrate * 100).toFixed(2) + "%"
        }}
      </span>
      <br />
      <span class="won">{{ wins }}</span>
      -
      <span class="lost">{{ losses }}</span>
    </h2>
    <br />
  </v-card-text>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import HeroPictureSelect from "@/components/overall-statistics/HeroPictureSelect.vue";
import { useOverallStatsStore } from "@/store/overallStats/store";

@Component({
  components: { HeroPictureSelect },
})
export default class HeroWinrate extends Vue {
  private overallStatsStore = useOverallStatsStore();

  get winrateClass() {
    if (this.winrate > 0.55) return "won";
    if (this.winrate < 0.45) return "lost";
    return "";
  }

  get winrate() {
    return this.overallStatsStore.heroWinrate.winrate;
  }

  get wins() {
    return this.overallStatsStore.heroWinrate.wins;
  }

  get losses() {
    return this.overallStatsStore.heroWinrate.losses;
  }

  mounted() {
    this.overallStatsStore.loadHeroWinrates();
  }
}
</script>
