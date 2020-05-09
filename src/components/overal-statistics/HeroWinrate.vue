<template>
  <v-card-text>
    <v-card-title class="justify-center">
      Pick a hero
    </v-card-title>
    <v-row>
      <v-col cols="2" v-for="i in [2, 1, 0]" :key="i">
        <v-select
          :items="heroesHome"
          item-text="name"
          item-value="heroId"
          @change="(value) => setSelectedHero(i, value)"
          :label="(i + 1).toString()"
          outlined
          dense
        />
        <hero-picture :hero-icon="selectedHeroIds[i]" />
      </v-col>
      <v-col cols="2" v-for="i in [3, 4, 5]" :key="i">
        <v-select
          :items="heroesOpponent"
          item-text="name"
          item-value="heroId"
          @change="(value) => setSelectedHero(i, value)"
          :label="(i - 2).toString()"
          outlined
          dense
        />
        <hero-picture :hero-icon="selectedHeroIds[i]" />
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
  public selectedHeroIds = ["all", "all", "all", "all", "all", "all"];

  get winrate() {
    return this.$store.direct.state.overallStatistics.heroWinrate.winrate;
  }

  get wins() {
    return this.$store.direct.state.overallStatistics.heroWinrate.wins;
  }

  get losses() {
    return this.$store.direct.state.overallStatistics.heroWinrate.losses;
  }

  setSelectedHero(index: number, heroId: string) {
    this.selectedHeroIds[index] = heroId;
    if (index < 3) {
      this.heroesHome.forEach(h => h.disabled = false);
      this.heroesHome.filter(h => h.heroId == this.selectedHeroIds[0])[0].disabled = true
      this.heroesHome.filter(h => h.heroId == this.selectedHeroIds[1])[0].disabled = true
      this.heroesHome.filter(h => h.heroId == this.selectedHeroIds[2])[0].disabled = true
    } else {
      this.heroesOpponent.forEach(h => h.disabled = false);
      this.heroesOpponent.filter(h => h.heroId == this.selectedHeroIds[3])[0].disabled = true
      this.heroesOpponent.filter(h => h.heroId == this.selectedHeroIds[4])[0].disabled = true
      this.heroesOpponent.filter(h => h.heroId == this.selectedHeroIds[5])[0].disabled = true
    }

    this.heroesHome.filter(h => h.heroId == "all")[0].disabled = false
    this.heroesHome.filter(h => h.heroId == "none")[0].disabled = false
    this.heroesOpponent.filter(h => h.heroId == "all")[0].disabled = false

    this.$store.direct.dispatch.overallStatistics.loadHeroWinrates({
      first: this.selectedHeroIds[0],
      second: this.selectedHeroIds[1],
      third: this.selectedHeroIds[2],
      opFirst: this.selectedHeroIds[3],
      opSecond: this.selectedHeroIds[4],
      opThird: this.selectedHeroIds[5],
    });
  }

  get heroesOpponent() {
    return [
      { name: this.$t(`heroNames.all`), heroId: "all", disabled: false },

      { name: this.$t(`heroNames.archmage`), heroId: "archmage", disabled: false },
      { name: this.$t(`heroNames.mountainking`), heroId: "mountainking", disabled: false },
      { name: this.$t(`heroNames.paladin`), heroId: "paladin", disabled: false },
      { name: this.$t(`heroNames.sorceror`), heroId: "sorceror", disabled: false },

      { name: this.$t(`heroNames.farseer`), heroId: "farseer", disabled: false },
      { name: this.$t(`heroNames.blademaster`), heroId: "blademaster", disabled: false },
      { name: this.$t(`heroNames.shadowhunter`), heroId: "shadowhunter", disabled: false },
      { name: this.$t(`heroNames.taurenchieftain`), heroId: "taurenchieftain", disabled: false },

      { name: this.$t(`heroNames.deathknight`), heroId: "deathknight", disabled: false },
      { name: this.$t(`heroNames.lich`), heroId: "lich", disabled: false },
      { name: this.$t(`heroNames.dreadlord`), heroId: "dreadlord", disabled: false },
      { name: this.$t(`heroNames.cryptlord`), heroId: "cryptlord", disabled: false },

      { name: this.$t(`heroNames.demonhunter`), heroId: "demonhunter", disabled: false },
      { name: this.$t(`heroNames.keeperofthegrove`), heroId: "keeperofthegrove", disabled: false },
      { name: this.$t(`heroNames.warden`), heroId: "warden", disabled: false },
      { name: this.$t(`heroNames.priestessofthemoon`), heroId: "priestessofthemoon", disabled: false },

      { name: this.$t(`heroNames.avatarofflame`), heroId: "avatarofflame", disabled: false },
      { name: this.$t(`heroNames.bansheeranger`), heroId: "bansheeranger", disabled: false },
      { name: this.$t(`heroNames.beastmaster`), heroId: "beastmaster", disabled: false },
      { name: this.$t(`heroNames.pandarenbrewmaster`), heroId: "pandarenbrewmaster", disabled: false },
      { name: this.$t(`heroNames.pitlord`), heroId: "pitlord", disabled: false },
      { name: this.$t(`heroNames.seawitch`), heroId: "seawitch", disabled: false },
      { name: this.$t(`heroNames.taurenchieftain`), heroId: "taurenchieftain", disabled: false },
      { name: this.$t(`heroNames.tinker`), heroId: "tinker", disabled: false },
      { name: this.$t(`heroNames.alchemist`), heroId: "alchemist", disabled: false },
    ];
  }

  get heroesHome() {
    return [
      { name: this.$t(`heroNames.none`), heroId: "none", disabled: false },
      { name: this.$t(`heroNames.all`), heroId: "all", disabled: false },

      { name: this.$t(`heroNames.archmage`), heroId: "archmage", disabled: false },
      { name: this.$t(`heroNames.mountainking`), heroId: "mountainking", disabled: false },
      { name: this.$t(`heroNames.paladin`), heroId: "paladin", disabled: false },
      { name: this.$t(`heroNames.sorceror`), heroId: "sorceror", disabled: false },

      { name: this.$t(`heroNames.farseer`), heroId: "farseer", disabled: false },
      { name: this.$t(`heroNames.blademaster`), heroId: "blademaster", disabled: false },
      { name: this.$t(`heroNames.shadowhunter`), heroId: "shadowhunter", disabled: false },
      { name: this.$t(`heroNames.taurenchieftain`), heroId: "taurenchieftain", disabled: false },

      { name: this.$t(`heroNames.deathknight`), heroId: "deathknight", disabled: false },
      { name: this.$t(`heroNames.lich`), heroId: "lich", disabled: false },
      { name: this.$t(`heroNames.dreadlord`), heroId: "dreadlord", disabled: false },
      { name: this.$t(`heroNames.cryptlord`), heroId: "cryptlord", disabled: false },

      { name: this.$t(`heroNames.demonhunter`), heroId: "demonhunter", disabled: false },
      { name: this.$t(`heroNames.keeperofthegrove`), heroId: "keeperofthegrove", disabled: false },
      { name: this.$t(`heroNames.warden`), heroId: "warden", disabled: false },
      { name: this.$t(`heroNames.priestessofthemoon`), heroId: "priestessofthemoon", disabled: false },

      { name: this.$t(`heroNames.avatarofflame`), heroId: "avatarofflame", disabled: false },
      { name: this.$t(`heroNames.bansheeranger`), heroId: "bansheeranger", disabled: false },
      { name: this.$t(`heroNames.beastmaster`), heroId: "beastmaster", disabled: false },
      { name: this.$t(`heroNames.pandarenbrewmaster`), heroId: "pandarenbrewmaster", disabled: false },
      { name: this.$t(`heroNames.pitlord`), heroId: "pitlord", disabled: false },
      { name: this.$t(`heroNames.seawitch`), heroId: "seawitch", disabled: false },
      { name: this.$t(`heroNames.taurenchieftain`), heroId: "taurenchieftain", disabled: false },
      { name: this.$t(`heroNames.tinker`), heroId: "tinker", disabled: false },
      { name: this.$t(`heroNames.alchemist`), heroId: "alchemist", disabled: false },
    ];
  }
}
</script>
