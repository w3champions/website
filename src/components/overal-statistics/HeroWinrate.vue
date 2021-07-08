<template>
  <v-card-text>
    <v-card-title>Winrates of hero matchups</v-card-title>
    <v-row>
      <v-col cols="2">
        <hero-picture-select :hero-index="0" />
      </v-col>
      <v-col cols="2">
        <hero-picture-select :hero-index="1" />
      </v-col>
      <v-col cols="2">
        <hero-picture-select :hero-index="2" />
      </v-col>
      <v-col cols="2">
        <hero-picture-select :hero-index="3" />
      </v-col>
      <v-col cols="2">
        <hero-picture-select :hero-index="4" />
      </v-col>
      <v-col cols="2">
        <hero-picture-select :hero-index="5" />
      </v-col>
    </v-row>
    <h2 class="justify-center text-center">
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
import HeroPictureSelect from "@/components/overal-statistics/HeroPictureSelect.vue";

@Component({
  components: { HeroPictureSelect },
})
export default class HeroWinrate extends Vue {
  get winrateClass() {
    if (this.winrate > 0.55) return "won";
    if (this.winrate < 0.45) return "lost";
    return "";
  }

  get winrate() {
    return this.$store.direct.state.overallStatistics.heroWinrate.winrate;
  }

  get wins() {
    return this.$store.direct.state.overallStatistics.heroWinrate.wins;
  }

  get losses() {
    return this.$store.direct.state.overallStatistics.heroWinrate.losses;
  }

  mounted() {
    this.$store.direct.dispatch.overallStatistics.loadHeroWinrates();
  }
}
</script>
