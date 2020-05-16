<template>
  <v-card-text>
    <v-card-text
      class="hero-icon"
      :class="isEnabledForChange ? '' : 'hero-icon-disabled'"
      @click="openDialog"
      :style="{ 'background-image': 'url(' + heroPicture + ')' }"
    />
    <v-dialog v-model="dialogOpened" max-width="400px">
      <v-card>
        <v-row
          v-for="heroPickPerRace in possibleHeroPickRows"
          :key="heroPickPerRace.map(h => h.heroId).join('_')"
          justify="space-between"
        >
          <v-col cols="1" v-for="heroPick in heroPickPerRace" :key="heroPick.heroId">
            <v-card-text
              class="hero-icon hero-icon-select"
              :class="isEnabledForSelect ? '' : 'hero-icon-disabled'"
              @click="pickHero(heroPick)"
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
import {ERaceEnum} from "@/store/typings";

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

  get isEnabledForChange() {
    return this.heroPicks[this.heroIndex % 3 - 1]?.heroId !== "all" && this.heroPicks[this.heroIndex - 1]?.heroId !== "none"
  }

  get isEnabledForSelect() {
    return true
  }

  get heroPicture() {
    return this.parsePicture(this.heroPicks[this.heroIndex]);
  }

  get heroPicks() {
    return this.$store.direct.state.overallStatistics.heroPicks;
  }

  get possibleHeroPickRows() {
    return [
      this.possibleHeroPicks.slice(0, 2),
      this.possibleHeroPicks.slice(2, 6),
      this.possibleHeroPicks.slice(6, 10),
      this.possibleHeroPicks.slice(10, 14),
      this.possibleHeroPicks.slice(14, 18),
      this.possibleHeroPicks.slice(18, 23),
      this.possibleHeroPicks.slice(23, 27),
    ]
  }

  get possibleHeroPicks() {
    return [
      { name: this.$t(`heroNames.none`), heroId: "none", race: ERaceEnum.TOTAL },
      { name: this.$t(`heroNames.all`), heroId: "all", race: ERaceEnum.TOTAL },

      { name: this.$t(`heroNames.archmage`), heroId: "archmage", race: ERaceEnum.HUMAN },
      { name: this.$t(`heroNames.mountainking`), heroId: "mountainking", race: ERaceEnum.HUMAN },
      { name: this.$t(`heroNames.paladin`), heroId: "paladin", race: ERaceEnum.HUMAN },
      { name: this.$t(`heroNames.sorceror`), heroId: "sorceror", race: ERaceEnum.HUMAN },

      { name: this.$t(`heroNames.farseer`), heroId: "farseer", race: ERaceEnum.ORC },
      { name: this.$t(`heroNames.blademaster`), heroId: "blademaster", race: ERaceEnum.ORC },
      { name: this.$t(`heroNames.shadowhunter`), heroId: "shadowhunter", race: ERaceEnum.ORC },
      { name: this.$t(`heroNames.taurenchieftain`), heroId: "taurenchieftain", race: ERaceEnum.ORC },

      { name: this.$t(`heroNames.deathknight`), heroId: "deathknight", race: ERaceEnum.UNDEAD },
      { name: this.$t(`heroNames.lich`), heroId: "lich", race: ERaceEnum.UNDEAD },
      { name: this.$t(`heroNames.dreadlord`), heroId: "dreadlord", race: ERaceEnum.UNDEAD },
      { name: this.$t(`heroNames.cryptlord`), heroId: "cryptlord", race: ERaceEnum.UNDEAD },

      { name: this.$t(`heroNames.demonhunter`), heroId: "demonhunter", race: ERaceEnum.NIGHT_ELF },
      { name: this.$t(`heroNames.keeperofthegrove`), heroId: "keeperofthegrove", race: ERaceEnum.NIGHT_ELF },
      { name: this.$t(`heroNames.warden`), heroId: "warden", race: ERaceEnum.NIGHT_ELF },
      { name: this.$t(`heroNames.priestessofthemoon`), heroId: "priestessofthemoon", race: ERaceEnum.NIGHT_ELF },

      { name: this.$t(`heroNames.avatarofflame`), heroId: "avatarofflame", race: ERaceEnum.RANDOM },
      { name: this.$t(`heroNames.bansheeranger`), heroId: "bansheeranger", race: ERaceEnum.RANDOM },
      { name: this.$t(`heroNames.beastmaster`), heroId: "beastmaster", race: ERaceEnum.RANDOM },
      { name: this.$t(`heroNames.pandarenbrewmaster`), heroId: "pandarenbrewmaster", race: ERaceEnum.RANDOM },
      { name: this.$t(`heroNames.pitlord`), heroId: "pitlord", race: ERaceEnum.RANDOM },
      { name: this.$t(`heroNames.seawitch`), heroId: "seawitch", race: ERaceEnum.RANDOM },
      { name: this.$t(`heroNames.taurenchieftain`), heroId: "taurenchieftain", race: ERaceEnum.RANDOM },
      { name: this.$t(`heroNames.tinker`), heroId: "tinker", race: ERaceEnum.RANDOM },
      { name: this.$t(`heroNames.alchemist`), heroId: "alchemist", race: ERaceEnum.RANDOM },
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

.hero-icon-disabled {
  opacity: 0.5;
  filter: alpha(opacity=50);
}
</style>
