<template>
  <v-card-text>
    <v-card-title class="justify-center">
      Pick a hero
    </v-card-title>
    <v-row>
      <v-col cols="2" v-for="i in [2, 1, 0]" :key="i">
        <v-select
          :items="heroes"
          item-text="name"
          item-value="heroId"
          @change="(value) => setHero(i, value)"
          :label="(i + 1).toString()"
          outlined
          dense
        />
        <hero-picture :hero-icon="selectedIds[i]" />
      </v-col>
      <v-col cols="2" v-for="i in [3, 4, 5]" :key="i">
        <v-select
          :items="heroesExceptNone"
          item-text="name"
          item-value="heroId"
          @change="(value) => setHero(i, value)"
          :label="(i - 2).toString()"
          outlined
          dense
        />
        <hero-picture :hero-icon="selectedIds[i]" />
      </v-col>
    </v-row>
    <v-card-title v-if="winrate" class="justify-center text-center">
      {{ (winrate * 100).toFixed(2) + "%" }}
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
  public selectedIds = ["all", "all", "all", "all", "all", "all"];

  get winrate() {
    return this.$store.direct.state.overallStatistics.heroWinrate.winrate;
  }

  get wins() {
    return this.$store.direct.state.overallStatistics.heroWinrate.wins;
  }

  get losses() {
    return this.$store.direct.state.overallStatistics.heroWinrate.losses;
  }

  setHero(index: number, heroId: string) {
    this.selectedIds[index] = heroId;
    this.$store.direct.dispatch.overallStatistics.loadHeroWinrates({
      first: this.selectedIds[0],
      second: this.selectedIds[1],
      third: this.selectedIds[2],
      opFirst: this.selectedIds[3],
      opSecond: this.selectedIds[4],
      opThird: this.selectedIds[5],
    });
  }

  get heroesExceptNone() {
    return [
      { name: this.$t(`heroNames.all`), heroId: "all" },

      { name: this.$t(`heroNames.archmage`), heroId: "archmage" },
      { name: this.$t(`heroNames.mountainking`), heroId: "mountainking" },
      { name: this.$t(`heroNames.paladin`), heroId: "paladin" },
      { name: this.$t(`heroNames.sorceror`), heroId: "sorceror" },

      { name: this.$t(`heroNames.farseer`), heroId: "farseer" },
      { name: this.$t(`heroNames.blademaster`), heroId: "blademaster" },
      { name: this.$t(`heroNames.shadowhunter`), heroId: "shadowhunter" },
      { name: this.$t(`heroNames.taurenchieftain`), heroId: "taurenchieftain" },

      { name: this.$t(`heroNames.deathknight`), heroId: "deathknight" },
      { name: this.$t(`heroNames.lich`), heroId: "lich" },
      { name: this.$t(`heroNames.dreadlord`), heroId: "dreadlord" },
      { name: this.$t(`heroNames.cryptlord`), heroId: "cryptlord" },

      { name: this.$t(`heroNames.demonhunter`), heroId: "demonhunter" },
      {
        name: this.$t(`heroNames.keeperofthegrove`),
        heroId: "keeperofthegrove",
      },
      { name: this.$t(`heroNames.warden`), heroId: "warden" },
      {
        name: this.$t(`heroNames.priestessofthemoon`),
        heroId: "priestessofthemoon",
      },

      { name: this.$t(`heroNames.avatarofflame`), heroId: "avatarofflame" },
      { name: this.$t(`heroNames.bansheeranger`), heroId: "bansheeranger" },
      { name: this.$t(`heroNames.beastmaster`), heroId: "beastmaster" },
      {
        name: this.$t(`heroNames.pandarenbrewmaster`),
        heroId: "pandarenbrewmaster",
      },
      { name: this.$t(`heroNames.pitlord`), heroId: "pitlord" },
      { name: this.$t(`heroNames.seawitch`), heroId: "seawitch" },
      { name: this.$t(`heroNames.taurenchieftain`), heroId: "taurenchieftain" },
      { name: this.$t(`heroNames.tinker`), heroId: "tinker" },
      { name: this.$t(`heroNames.alchemist`), heroId: "alchemist" },
    ];
  }

  get heroes() {
    return [{ name: this.$t(`heroNames.none`), heroId: "none" }].concat(
      this.heroesExceptNone
    );
  }
}
</script>
