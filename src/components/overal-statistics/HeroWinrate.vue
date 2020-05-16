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
import HeroPicture from "@/components/match-details/HeroPicture.vue";

@Component({
  components: { HeroPicture },
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

  setSelectedHero(index: number, selection: { heroId: string, name: string }) {
    // if (index < 3) {
    //   this.heroesHome.forEach(h => h.disabled = false);
    //   this.heroesHome.filter(h => h.heroId == this.firstPickHome.heroId)[0].disabled = true
    //   this.heroesHome.filter(h => h.heroId == this.secondPickHome.heroId)[0].disabled = true
    //   this.heroesHome.filter(h => h.heroId == this.thirdPickHome.heroId)[0].disabled = true
    // } else {
    //   this.heroesOpponent.forEach(h => h.disabled = false);
    //   this.heroesOpponent.filter(h => h.heroId == this.firstPickOpponent.heroId)[0].disabled = true
    //   this.heroesOpponent.filter(h => h.heroId == this.secondPickOpponent.heroId)[0].disabled = true
    //   this.heroesOpponent.filter(h => h.heroId == this.thirdPickOpponent.heroId)[0].disabled = true
    // }
    //
    // this.heroesHome.filter(h => h.heroId == "all")[0].disabled = false
    // this.heroesHome.filter(h => h.heroId == "none")[0].disabled = false
    // this.heroesOpponent.filter(h => h.heroId == "all")[0].disabled = false
    // this.heroesOpponent.filter(h => h.heroId == "none")[0].disabled = false
    //
    // // make all selections equal depending on the higher order one and not allowing hero selections after non/all
    // if (selection.heroId === "none" || selection.heroId === "all") {
    //   if (index == 0) {
    //     this.secondPickHome = { name: selection.name, heroId: selection.heroId, disabled: false };
    //     this.thirdPickHome = { name: selection.name, heroId: selection.heroId, disabled: false };
    //   }
    //   if (index == 1) {
    //     this.thirdPickHome = { name: selection.name, heroId: selection.heroId, disabled: false };
    //   }
    //   if (index == 3) {
    //     this.secondPickOpponent = { name: selection.name, heroId: selection.heroId, disabled: false };
    //     this.thirdPickOpponent = { name: selection.name, heroId: selection.heroId, disabled: false };
    //   }
    //   if (index == 4) {
    //     this.thirdPickOpponent = { name: selection.name, heroId: selection.heroId, disabled: false };
    //   }
    // }
    //
    // // for not allowing none as first hero
    // if (selection.heroId === "none") {
    //   if (index == 0) {
    //     this.heroPicks[1] = { name: "all", heroId: "all", disabled: false };
    //   }
    //   if (index == 3) {
    //     this.heroPicks[3] = { name: "all", heroId: "all", disabled: false };
    //   }
    // }

    this.$store.direct.dispatch.overallStatistics.loadHeroWinrates();
  }

  mounted() {
    this.$store.direct.dispatch.overallStatistics.loadHeroWinrates();
  }
}
</script>
