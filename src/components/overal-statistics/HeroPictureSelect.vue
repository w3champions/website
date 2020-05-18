<template>
  <v-card-text>
    <v-card-text
      class="hero-picture-select"
      :class="isEnabledForChange ? '' : 'hero-icon-disabled'"
      @click="
        () => {
          if (isEnabledForChange) openDialog();
        }
      "
      :style="{ 'background-image': 'url(' + heroPicture + ')' }"
    />
    <v-dialog v-model="dialogOpened" max-width="400px">
      <v-card>
        <v-row
          v-for="heroPickPerRace in possibleHeroPickRows"
          :key="heroPickPerRace.map((h) => h.heroId).join('_')"
          justify="space-between"
        >
          <v-col
            cols="1"
            v-for="heroPick in heroPickPerRace"
            :key="heroPick.heroId"
          >
            <v-card-text
              class="hero-icon-select"
              :class="isEnabledForSelect(heroPick) ? '' : 'hero-icon-disabled'"
              @click="
                () => {
                  if (isEnabledForSelect(heroPick)) pickHero(heroPick);
                }
              "
              :style="{
                'background-image': 'url(' + parsePicture(heroPick) + ')',
              }"
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
import { ERaceEnum } from "@/store/typings";

@Component({})
export default class HeroPictureSelect extends Vue {
  @Prop() heroIndex!: number;

  public dialogOpened = false;

  openDialog() {
    this.dialogOpened = true;
  }

  public pickHero(hero: HeroPick) {
    const newPick = { index: this.heroIndex, heroPick: hero };

    this.$store.direct.commit.overallStatistics.SET_HIRO_PICK(newPick);
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
    return (
      this.previousHero?.heroId !== "all" &&
      this.previousHero?.heroId !== "none"
    );
  }

  get previousHero() {
    if (this.heroIndex === 3 || this.heroIndex === 0) {
      return null;
    }
    return this.heroPicks[this.heroIndex - 1];
  }

  get previousPreviousHero() {
    if (this.heroIndex === 4 || this.heroIndex === 1) {
      return null;
    }
    return this.heroPicks[this.heroIndex - 2];
  }

  isEnabledForSelect(heroPick: HeroPick) {
    if (this.heroIndex === 0 && heroPick.heroId === "none") return false;
    if (this.heroIndex === 3 && heroPick.heroId === "none") return false;

    const previousHeroRaces = [
      this.possibleHeroPicks.filter(
        (h) => h.heroId === this.previousHero?.heroId
      )[0]?.race ?? ERaceEnum.TOTAL,
      this.possibleHeroPicks.filter(
        (h) => h.heroId === this.previousPreviousHero?.heroId
      )[0]?.race ?? ERaceEnum.TOTAL,
    ];

    const previousHeroPicks = [
      this.possibleHeroPicks.filter(
        (h) => h.heroId === this.previousHero?.heroId
      )[0]?.heroId ?? "all",
      this.possibleHeroPicks.filter(
        (h) => h.heroId === this.previousPreviousHero?.heroId
      )[0]?.heroId ?? "all",
    ];

    const raceWithoutRandom = previousHeroRaces.filter(
      (r) => r !== ERaceEnum.TOTAL && r !== ERaceEnum.RANDOM
    )[0];

    const picksWithoutAll = previousHeroPicks.filter(
      (r) => r !== "all" && r !== "none"
    );

    if (heroPick.race === ERaceEnum.RANDOM) return true;
    if (heroPick.race === ERaceEnum.TOTAL) return true;
    if (!raceWithoutRandom) return true;
    if (!picksWithoutAll) return true;
    if (picksWithoutAll[0] === heroPick.heroId) return false;
    if (picksWithoutAll[1] === heroPick.heroId) return false;

    return heroPick.race === raceWithoutRandom;
  }

  get heroPicture() {
    return this.parsePicture(this.heroPicks[this.heroIndex]);
  }

  get heroPicks() {
    return this.$store.direct.state.overallStatistics.heroPicks;
  }

  get heroPick() {
    return this.heroPicks[this.heroIndex];
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
    ];
  }

  get possibleHeroPicks(): HeroPick[] {
    return [
      {
        name: this.$t(`heroNames.none`).toString(),
        heroId: "none",
        race: ERaceEnum.TOTAL,
      },
      {
        name: this.$t(`heroNames.all`).toString(),
        heroId: "all",
        race: ERaceEnum.TOTAL,
      },

      {
        name: this.$t(`heroNames.archmage`).toString(),
        heroId: "archmage",
        race: ERaceEnum.HUMAN,
      },
      {
        name: this.$t(`heroNames.mountainking`).toString(),
        heroId: "mountainking",
        race: ERaceEnum.HUMAN,
      },
      {
        name: this.$t(`heroNames.paladin`).toString(),
        heroId: "paladin",
        race: ERaceEnum.HUMAN,
      },
      {
        name: this.$t(`heroNames.sorceror`).toString(),
        heroId: "sorceror",
        race: ERaceEnum.HUMAN,
      },

      {
        name: this.$t(`heroNames.farseer`).toString(),
        heroId: "farseer",
        race: ERaceEnum.ORC,
      },
      {
        name: this.$t(`heroNames.blademaster`).toString(),
        heroId: "blademaster",
        race: ERaceEnum.ORC,
      },
      {
        name: this.$t(`heroNames.shadowhunter`).toString(),
        heroId: "shadowhunter",
        race: ERaceEnum.ORC,
      },
      {
        name: this.$t(`heroNames.taurenchieftain`).toString(),
        heroId: "taurenchieftain",
        race: ERaceEnum.ORC,
      },

      {
        name: this.$t(`heroNames.deathknight`).toString(),
        heroId: "deathknight",
        race: ERaceEnum.UNDEAD,
      },
      {
        name: this.$t(`heroNames.lich`).toString(),
        heroId: "lich",
        race: ERaceEnum.UNDEAD,
      },
      {
        name: this.$t(`heroNames.dreadlord`).toString(),
        heroId: "dreadlord",
        race: ERaceEnum.UNDEAD,
      },
      {
        name: this.$t(`heroNames.cryptlord`).toString(),
        heroId: "cryptlord",
        race: ERaceEnum.UNDEAD,
      },

      {
        name: this.$t(`heroNames.demonhunter`).toString(),
        heroId: "demonhunter",
        race: ERaceEnum.NIGHT_ELF,
      },
      {
        name: this.$t(`heroNames.keeperofthegrove`).toString(),
        heroId: "keeperofthegrove",
        race: ERaceEnum.NIGHT_ELF,
      },
      {
        name: this.$t(`heroNames.warden`).toString(),
        heroId: "warden",
        race: ERaceEnum.NIGHT_ELF,
      },
      {
        name: this.$t(`heroNames.priestessofthemoon`).toString(),
        heroId: "priestessofthemoon",
        race: ERaceEnum.NIGHT_ELF,
      },

      {
        name: this.$t(`heroNames.avatarofflame`).toString(),
        heroId: "avatarofflame",
        race: ERaceEnum.RANDOM,
      },
      {
        name: this.$t(`heroNames.bansheeranger`).toString(),
        heroId: "bansheeranger",
        race: ERaceEnum.RANDOM,
      },
      {
        name: this.$t(`heroNames.beastmaster`).toString(),
        heroId: "beastmaster",
        race: ERaceEnum.RANDOM,
      },
      {
        name: this.$t(`heroNames.pandarenbrewmaster`).toString(),
        heroId: "pandarenbrewmaster",
        race: ERaceEnum.RANDOM,
      },
      {
        name: this.$t(`heroNames.pitlord`).toString(),
        heroId: "pitlord",
        race: ERaceEnum.RANDOM,
      },
      {
        name: this.$t(`heroNames.seawitch`).toString(),
        heroId: "seawitch",
        race: ERaceEnum.RANDOM,
      },
      {
        name: this.$t(`heroNames.taurenchieftain`).toString(),
        heroId: "taurenchieftain",
        race: ERaceEnum.RANDOM,
      },
      {
        name: this.$t(`heroNames.tinker`).toString(),
        heroId: "tinker",
        race: ERaceEnum.RANDOM,
      },
      {
        name: this.$t(`heroNames.alchemist`).toString(),
        heroId: "alchemist",
        race: ERaceEnum.RANDOM,
      },
    ];
  }
}
</script>

<style type="text/css" scoped>
.hero-picture-select {
  z-index: 1;
  position: relative;
  margin-top: 12px;
  padding-top: 100%;
  width: 100%;
  padding-bottom: 0 !important;
  background-repeat: no-repeat;
  background-size: contain;
}

.hero-icon-select {
  height: 48px;
  width: 48px;
  background-repeat: no-repeat;
  background-size: contain;
  padding: 0 !important;
}

.hero-icon-disabled {
  opacity: 0.5;
  filter: alpha(opacity=50);
}
</style>
