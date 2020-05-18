<template>
  <v-card-text>
    <v-card-title class="justify-center">
      Pick a hero
    </v-card-title>
    <v-row>
      <v-col cols="2">
        <hero-picture :hero-index="2" />
      </v-col>
      <v-col cols="2">
        <hero-picture :hero-index="1" />
      </v-col>
      <v-col cols="2">
        <hero-picture :hero-index="0" />
      </v-col>
      <v-col cols="2">
        <hero-picture :hero-index="3" />
      </v-col>
      <v-col cols="2">
        <hero-picture :hero-index="4" />
      </v-col>
      <v-col cols="2">
        <hero-picture :hero-index="5" />
      </v-col>
    </v-row>
    <v-card-title class="justify-center text-center">
      {{ wins === 0 && losses === 0 ? "-" : (winrate * 100).toFixed(2) + "%" }}
      <br />
      {{ wins }} / {{ losses }}
    </v-card-title>
  </v-card-text>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import HeroPictureSelect from "@/components/overal-statistics/HeroPictureSelect.vue";

@Component({
  components: { HeroPicture: HeroPictureSelect },
})
export default class HeroWinrate extends Vue {

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
