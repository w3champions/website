<template>
  <v-card-text>
    <v-card-title class="justify-center">
      Pick a hero
    </v-card-title>
    <v-row>
      <v-col cols="2">
        <v-select
          :items="heroesHome"
          item-text="name"
          item-value="heroId"
          v-model="thirdPickHome"
          label="3"
          return-object
          @change="(v) => setSelectedHero(2, v)"
          :disabled="secondPickHome.heroId === 'none' || secondPickHome.heroId === 'all'"
          outlined
          dense
        />
        <hero-picture :hero-icon="thirdPickHome.heroId" />
      </v-col>
      <v-col cols="2">
        <v-select
          :items="heroesHome"
          item-text="name"
          item-value="heroId"
          v-model="secondPickHome"
          label="2"
          return-object
          @change="(v) => setSelectedHero(1, v)"
          :disabled="firstPickHome.heroId === 'none' || firstPickHome.heroId === 'all'"
          outlined
          dense
        />
        <hero-picture :hero-icon="secondPickHome.heroId" />
      </v-col>
      <v-col cols="2">
        <v-select
          :items="heroesHome"
          item-text="name"
          item-value="heroId"
          v-model="firstPickHome"
          label="1"
          return-object
          outlined
          @change="(v) => setSelectedHero(0, v)"
          dense
        />
        <hero-picture :hero-icon="firstPickHome.heroId" />
      </v-col>
      <v-col cols="2">
        <v-select
          :items="heroesOpponent"
          item-text="name"
          item-value="heroId"
          v-model="firstPickOpponent"
          label="1"
          @change="(v) => setSelectedHero(3, v)"
          return-object
          outlined
          dense
        />
        <hero-picture :hero-icon="firstPickOpponent.heroId" />
      </v-col>
      <v-col cols="2">
        <v-select
          :items="heroesOpponent"
          item-text="name"
          item-value="heroId"
          v-model="secondPickOpponent"
          label="2"
          @change="(v) => setSelectedHero(4, v)"
          return-object
          :disabled="firstPickOpponent.heroId === 'none' || firstPickOpponent.heroId === 'all'"
          outlined
          dense
        />
        <hero-picture :hero-icon="secondPickOpponent.heroId" />
      </v-col>
      <v-col cols="2">
        <v-select
          :items="heroesOpponent"
          item-text="name"
          item-value="heroId"
          v-model="thirdPickOpponent"
          label="3"
          return-object
          outlined
          :disabled="secondPickOpponent.heroId === 'none' || secondPickOpponent.heroId === 'all'"
          @change="(v) => setSelectedHero(5, v)"
          dense
        />
        <hero-picture :hero-icon="thirdPickOpponent.heroId" />
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
    if (index < 3) {
      this.heroesHome.forEach(h => h.disabled = false);
      this.heroesHome.filter(h => h.heroId == this.firstPickHome.heroId)[0].disabled = true
      this.heroesHome.filter(h => h.heroId == this.secondPickHome.heroId)[0].disabled = true
      this.heroesHome.filter(h => h.heroId == this.thirdPickHome.heroId)[0].disabled = true
    } else {
      this.heroesOpponent.forEach(h => h.disabled = false);
      this.heroesOpponent.filter(h => h.heroId == this.firstPickOpponent.heroId)[0].disabled = true
      this.heroesOpponent.filter(h => h.heroId == this.secondPickOpponent.heroId)[0].disabled = true
      this.heroesOpponent.filter(h => h.heroId == this.thirdPickOpponent.heroId)[0].disabled = true
    }

    this.heroesHome.filter(h => h.heroId == "all")[0].disabled = false
    this.heroesHome.filter(h => h.heroId == "none")[0].disabled = false
    this.heroesOpponent.filter(h => h.heroId == "all")[0].disabled = false
    this.heroesOpponent.filter(h => h.heroId == "none")[0].disabled = false

    // make all selections equal depending on the higher order one and not allowing hero selections after non/all
    if (selection.heroId === "none" || selection.heroId === "all") {
      if (index == 0) {
        this.secondPickHome = { name: selection.name, heroId: selection.heroId, disabled: false };
        this.thirdPickHome = { name: selection.name, heroId: selection.heroId, disabled: false };
      }
      if (index == 1) {
        this.thirdPickHome = { name: selection.name, heroId: selection.heroId, disabled: false };
      }
      if (index == 3) {
        this.secondPickOpponent = { name: selection.name, heroId: selection.heroId, disabled: false };
        this.thirdPickOpponent = { name: selection.name, heroId: selection.heroId, disabled: false };
      }
      if (index == 4) {
        this.thirdPickOpponent = { name: selection.name, heroId: selection.heroId, disabled: false };
      }
    }

    // for not allowing none as first hero
    if (selection.heroId === "none") {
      if (index == 0) {
        this.firstPickHome = { name: "all", heroId: "all", disabled: false };
      }
      if (index == 3) {
        this.firstPickOpponent = { name: "all", heroId: "all", disabled: false };
      }
    }

    this.$store.direct.dispatch.overallStatistics.loadHeroWinrates({
      first: this.firstPickHome.heroId,
      second: this.secondPickHome.heroId,
      third: this.thirdPickHome.heroId,
      opFirst: this.firstPickOpponent.heroId,
      opSecond: this.secondPickOpponent.heroId,
      opThird: this.thirdPickOpponent.heroId,
    });
  }

  public firstPickHome = { name: "all", heroId: "all", disabled: false };
  public secondPickHome = { name: "all", heroId: "all", disabled: false };
  public thirdPickHome = { name: "all", heroId: "all", disabled: false };

  public firstPickOpponent = { name: "all", heroId: "all", disabled: false };
  public secondPickOpponent = { name: "all", heroId: "all", disabled: false };
  public thirdPickOpponent = { name: "all", heroId: "all", disabled: false };

  get heroesOpponent() {
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

  mounted() {
    this.$store.direct.dispatch.overallStatistics.loadHeroWinrates({
      first: this.firstPickHome.heroId,
      second: this.secondPickHome.heroId,
      third: this.thirdPickHome.heroId,
      opFirst: this.firstPickOpponent.heroId,
      opSecond: this.secondPickOpponent.heroId,
      opThird: this.thirdPickOpponent.heroId,
    });
  }
}
</script>
