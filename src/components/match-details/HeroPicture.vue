<template>
  <v-card-text>
    <v-card-text
      class="hero-icon"
      @click.stop="openDialog"
      :style="{ 'background-image': 'url(' + heroPicture + ')' }"
    />
    <v-dialog v-model="dialogOpened" max-width="400px">
      <v-card>
        <v-row
          v-for="heroPickPerRace in possibleHeroPicks"
          :key="heroPickPerRace.map(m => m.heroId).join('-')"
          justify="space-between"
        >
          <v-col cols="1" v-for="heroPick in heroPickPerRace" :key="heroPick.heroId">
            <v-card-text
              class="hero-icon hero-icon-select"
              @click.stop="pickHero(heroPick)"
              :style="{ 'background-image': 'url(' + parsePicture(heroPick) + ')' }"
            />
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </v-card-text>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { HeroPick } from "@/store/overallStats/types";

@Component({})
export default class HeroPicture extends Vue {
  @Prop() heroIndex!: number;

  public dialogOpened = false;

  openDialog() {
    this.dialogOpened = true;
  }

  public pickHero(pick: HeroPick) {
    this.$store.direct.commit.overallStatistics.SET_HIRO_PICK({index: this.heroIndex, heroPick: pick});
    this.$store.direct.dispatch.overallStatistics.loadHeroWinrates();
    this.dialogOpened = false;
  }

  public parsePicture(hero: HeroPick) {
    try {
      return require("../../assets/heroes/" + hero.heroId + ".png");
    } catch (e) {
      return null;
    }
  }

  get heroPicture() {
    return this.parsePicture(this.heroPicks[this.heroIndex]);
  }

  get heroPicks() {
    return this.$store.direct.state.overallStatistics.heroPicks;
  }

  get possibleHeroPicks() {
    return [
      [{ name: this.$t(`heroNames.none`), heroId: "none", disabled: false },
      { name: this.$t(`heroNames.all`), heroId: "all", disabled: false }],

      [{ name: this.$t(`heroNames.archmage`), heroId: "archmage", disabled: false },
      { name: this.$t(`heroNames.mountainking`), heroId: "mountainking", disabled: false },
      { name: this.$t(`heroNames.paladin`), heroId: "paladin", disabled: false },
      { name: this.$t(`heroNames.sorceror`), heroId: "sorceror", disabled: false }],

      [{ name: this.$t(`heroNames.farseer`), heroId: "farseer", disabled: false },
      { name: this.$t(`heroNames.blademaster`), heroId: "blademaster", disabled: false },
      { name: this.$t(`heroNames.shadowhunter`), heroId: "shadowhunter", disabled: false },
      { name: this.$t(`heroNames.taurenchieftain`), heroId: "taurenchieftain", disabled: false }],

      [{ name: this.$t(`heroNames.deathknight`), heroId: "deathknight", disabled: false },
      { name: this.$t(`heroNames.lich`), heroId: "lich", disabled: false },
      { name: this.$t(`heroNames.dreadlord`), heroId: "dreadlord", disabled: false },
      { name: this.$t(`heroNames.cryptlord`), heroId: "cryptlord", disabled: false }],

      [{ name: this.$t(`heroNames.demonhunter`), heroId: "demonhunter", disabled: false },
      { name: this.$t(`heroNames.keeperofthegrove`), heroId: "keeperofthegrove", disabled: false },
      { name: this.$t(`heroNames.warden`), heroId: "warden", disabled: false },
      { name: this.$t(`heroNames.priestessofthemoon`), heroId: "priestessofthemoon", disabled: false }],

      [{ name: this.$t(`heroNames.avatarofflame`), heroId: "avatarofflame", disabled: false },
      { name: this.$t(`heroNames.bansheeranger`), heroId: "bansheeranger", disabled: false },
      { name: this.$t(`heroNames.beastmaster`), heroId: "beastmaster", disabled: false },
      { name: this.$t(`heroNames.pandarenbrewmaster`), heroId: "pandarenbrewmaster", disabled: false },
      { name: this.$t(`heroNames.pitlord`), heroId: "pitlord", disabled: false }],
      [{ name: this.$t(`heroNames.seawitch`), heroId: "seawitch", disabled: false },
      { name: this.$t(`heroNames.taurenchieftain`), heroId: "taurenchieftain", disabled: false },
      { name: this.$t(`heroNames.tinker`), heroId: "tinker", disabled: false },
      { name: this.$t(`heroNames.alchemist`), heroId: "alchemist", disabled: false }],
    ];
  }
}
</script>

<style type="text/css" scoped>
.hero-icon {
  z-index: 1;
  position: relative;
  margin-top: 12px;
  padding-top: 100%;
  width: 100%;
  padding-bottom: 0 !important;
  margin-bottom: -2px !important;
  background-repeat: no-repeat;
  background-size: contain;
}

.hero-icon-select {
  height: 48px;
  width: 48px;
}
</style>
