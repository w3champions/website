<template>
  <v-card-text :class="{ 'pa-1': $vuetify.breakpoint.xsOnly }">
    <v-tooltip top>
      <template #activator="{ on }">
        <div v-on="on">
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
        </div>
      </template>
      <div>{{ heroPickName }}</div>
    </v-tooltip>
    <div class="text-center hero-level-flag">
      <span>{{ (heroIndex % 3) + 1 }}</span>
    </div>
    <v-dialog v-model="dialogOpened" max-width="300px">
      <v-card class="pa-1">
        <v-row
          no-gutters
          :justify="'space-between'"
          v-for="heroPickPerRace in possibleHeroPickRows"
          :key="heroPickPerRace.map((h) => h.heroId).join('_')"
        >
          <v-col
            :cols="3"
            v-for="heroPickSelection in heroPickPerRace"
            :key="heroPickSelection.heroId"
          >
            <v-tooltip top>
              <template #activator="{ on }">
                <div v-on="on" class="ma-1">
                  <v-responsive :aspect-ratio="1 / 1">
                    <div
                      :style="{ backgroundImage: 'url(' + parsePicture(heroPickSelection) + ')' }"
                      class="hero-icon-select"
                      :class="isEnabledForSelect(heroPickSelection) ? '' : 'hero-icon-disabled'"
                      @click="
                        () => {
                          if (isEnabledForSelect(heroPickSelection)) {
                            pickHero(heroPickSelection);
                          }
                        }
                      "
                    >
                    </div>
                  </v-responsive>
                </div>
              </template>
              <div>{{ heroPickSelection.name }}</div>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </v-card-text>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { TranslateResult } from "vue-i18n";
import { HeroPick } from "@/store/overallStats/types";
import { ERaceEnum } from "@/store/types";
import { getAsset } from "@/helpers/url-functions";
import { useOverallStatsStore } from "@/store/overallStats/store";

export default defineComponent({
  name: "HeroPictureSelect",
  components: {},
  props: {
    heroIndex: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const overallStatsStore = useOverallStatsStore();

    const dialogOpened = ref<boolean>(false);
    const heroPicks = computed<HeroPick[]>(() => overallStatsStore.heroPicks);

    function openDialog() {
      dialogOpened.value = true;
    }

    function pickHero(hero: HeroPick) {
      const newPick = { index: props.heroIndex, heroPick: hero };

      if (hero.heroId === "none" || hero.heroId === "all") {
        if (props.heroIndex === 0 || props.heroIndex === 3) {
          overallStatsStore.SET_HERO_PICK({
            index: props.heroIndex + 1,
            heroPick: hero,
          });
          overallStatsStore.SET_HERO_PICK({
            index: props.heroIndex + 2,
            heroPick: hero,
          });
        }
        if (props.heroIndex === 1 || props.heroIndex === 4) {
          overallStatsStore.SET_HERO_PICK({
            index: props.heroIndex + 1,
            heroPick: hero,
          });
        }
      }

      if (props.heroIndex === 0 || props.heroIndex === 3) {
        const allPickedRaces = [
          heroPicks.value[0 + (props.heroIndex % 3)].race,
          heroPicks.value[1 + (props.heroIndex % 3)].race,
          heroPicks.value[2 + (props.heroIndex % 3)].race,
        ];

        if (allPickedRaces[1] !== hero.race && allPickedRaces[1] !== ERaceEnum.RANDOM) {
          overallStatsStore.SET_HERO_PICK({
            index: props.heroIndex + 1,
            heroPick: {
              name: "anyhero",
              heroId: "all",
              race: ERaceEnum.TOTAL,
            },
          });
          overallStatsStore.SET_HERO_PICK({
            index: props.heroIndex + 2,
            heroPick: {
              name: "anyhero",
              heroId: "all",
              race: ERaceEnum.TOTAL,
            },
          });
        }

        if (allPickedRaces[2] !== hero.race && allPickedRaces[2] !== ERaceEnum.RANDOM) {
          overallStatsStore.SET_HERO_PICK({
            index: props.heroIndex + 2,
            heroPick: {
              name: "anyhero",
              heroId: "all",
              race: ERaceEnum.TOTAL,
            },
          });
        }
      }

      overallStatsStore.SET_HERO_PICK(newPick);
      overallStatsStore.loadHeroWinrates();
      dialogOpened.value = false;
    }

    function parsePicture(hero: HeroPick): string {
      return getAsset(`heroes/${hero.heroId}.png`);
    }

    const isEnabledForChange = computed<boolean>(() =>
      previousHero.value?.heroId !== "all"
      && previousHero.value?.heroId !== "none"
    );

    const previousHero = computed<HeroPick | null>(() => {
      if (props.heroIndex === 3 || props.heroIndex === 0) {
        return null;
      }
      return heroPicks.value[props.heroIndex - 1];
    });

    const previousPreviousHero = computed<HeroPick | null>(() => {
      if (
        props.heroIndex === 4
        || props.heroIndex === 1
        || props.heroIndex === 3
        || props.heroIndex === 0
      ) {
        return null;
      }

      return heroPicks.value[props.heroIndex - 2];
    });

    function isEnabledForSelect(heroPick: HeroPick): boolean {
      if (props.heroIndex === 0 && heroPick.heroId === "none") return false;
      if (props.heroIndex === 3 && heroPick.heroId === "none") return false;

      const previousHeroRaces = [
        possibleHeroPicks.filter((h) => h.heroId === previousHero.value?.heroId)[0]?.race ?? ERaceEnum.TOTAL,
        possibleHeroPicks.filter((h) => h.heroId === previousPreviousHero.value?.heroId)[0]?.race ?? ERaceEnum.TOTAL,
      ];

      const previousHeroPicks = [
        possibleHeroPicks.filter((h) => h.heroId === previousHero.value?.heroId)[0]?.heroId ?? "all",
        possibleHeroPicks.filter((h) => h.heroId === previousPreviousHero.value?.heroId)[0]?.heroId ?? "all",
      ];

      const raceWithoutRandom = previousHeroRaces.filter((r) => r !== ERaceEnum.TOTAL && r !== ERaceEnum.RANDOM)[0];
      const picksWithoutAll = previousHeroPicks.filter((r) => r !== "all" && r !== "none");

      if (heroPick.race === ERaceEnum.RANDOM) {
        const wasHeroPicked = picksWithoutAll.filter((p) => p === heroPick.heroId)[0];
        return !wasHeroPicked;
      }

      if (heroPick.race === ERaceEnum.TOTAL) return true;
      if (!raceWithoutRandom) return true;
      if (!picksWithoutAll) return true;
      if (picksWithoutAll[0] === heroPick.heroId) return false;
      if (picksWithoutAll[1] === heroPick.heroId) return false;

      return heroPick.race === raceWithoutRandom;
    }

    const heroPicture = computed<string>(() => parsePicture(heroPicks.value[props.heroIndex]));

    const heroPickName = computed<TranslateResult>(() => {
      const heroName = heroPicks.value[props.heroIndex].name;
      if (heroName === "anyhero") {
        return t("components_overall-statistics_heropictureselect.anyhero");
      }
      return heroName;
    });

    const possibleHeroPicks: HeroPick[] = [
      { name: t(`heroNames.none`).toString(), heroId: "none", race: ERaceEnum.TOTAL },
      { name: t(`heroNames.all`).toString(), heroId: "all", race: ERaceEnum.TOTAL },
      { name: t(`heroNames.archmage`).toString(), heroId: "archmage", race: ERaceEnum.HUMAN },
      { name: t(`heroNames.mountainking`).toString(), heroId: "mountainking", race: ERaceEnum.HUMAN },
      { name: t(`heroNames.paladin`).toString(), heroId: "paladin", race: ERaceEnum.HUMAN },
      { name: t(`heroNames.sorceror`).toString(), heroId: "sorceror", race: ERaceEnum.HUMAN },
      { name: t(`heroNames.farseer`).toString(), heroId: "farseer", race: ERaceEnum.ORC },
      { name: t(`heroNames.blademaster`).toString(), heroId: "blademaster", race: ERaceEnum.ORC },
      { name: t(`heroNames.shadowhunter`).toString(), heroId: "shadowhunter", race: ERaceEnum.ORC },
      { name: t(`heroNames.taurenchieftain`).toString(), heroId: "taurenchieftain", race: ERaceEnum.ORC },
      { name: t(`heroNames.deathknight`).toString(), heroId: "deathknight", race: ERaceEnum.UNDEAD },
      { name: t(`heroNames.lich`).toString(), heroId: "lich", race: ERaceEnum.UNDEAD },
      { name: t(`heroNames.dreadlord`).toString(), heroId: "dreadlord", race: ERaceEnum.UNDEAD },
      { name: t(`heroNames.cryptlord`).toString(), heroId: "cryptlord", race: ERaceEnum.UNDEAD },
      { name: t(`heroNames.demonhunter`).toString(), heroId: "demonhunter", race: ERaceEnum.NIGHT_ELF },
      { name: t(`heroNames.keeperofthegrove`).toString(), heroId: "keeperofthegrove", race: ERaceEnum.NIGHT_ELF },
      { name: t(`heroNames.warden`).toString(), heroId: "warden", race: ERaceEnum.NIGHT_ELF },
      { name: t(`heroNames.priestessofthemoon`).toString(), heroId: "priestessofthemoon", race: ERaceEnum.NIGHT_ELF },
      { name: t(`heroNames.avatarofflame`).toString(), heroId: "avatarofflame", race: ERaceEnum.RANDOM },
      { name: t(`heroNames.bansheeranger`).toString(), heroId: "bansheeranger", race: ERaceEnum.RANDOM },
      { name: t(`heroNames.beastmaster`).toString(), heroId: "beastmaster", race: ERaceEnum.RANDOM },
      { name: t(`heroNames.pandarenbrewmaster`).toString(), heroId: "pandarenbrewmaster", race: ERaceEnum.RANDOM },
      { name: t(`heroNames.pitlord`).toString(), heroId: "pitlord", race: ERaceEnum.RANDOM },
      { name: t(`heroNames.seawitch`).toString(), heroId: "seawitch", race: ERaceEnum.RANDOM },
      { name: t(`heroNames.tinker`).toString(), heroId: "tinker", race: ERaceEnum.RANDOM },
      { name: t(`heroNames.alchemist`).toString(), heroId: "alchemist", race: ERaceEnum.RANDOM },
    ];

    const possibleHeroPickRows: HeroPick[][] = [
      possibleHeroPicks.slice(0, 2),
      possibleHeroPicks.slice(2, 6),
      possibleHeroPicks.slice(6, 10),
      possibleHeroPicks.slice(10, 14),
      possibleHeroPicks.slice(14, 18),
      possibleHeroPicks.slice(18, 22),
      possibleHeroPicks.slice(22, 26),
    ];

    return {
      isEnabledForChange,
      openDialog,
      heroPicture,
      heroPickName,
      dialogOpened,
      possibleHeroPickRows,
      parsePicture,
      isEnabledForSelect,
      pickHero,
    };
  },
});
</script>

<style lang="scss" scoped>
.hero-picture-select {
  z-index: 1;
  position: relative;
  padding-top: 100%;
  width: 100%;
  padding-bottom: 0 !important;
  background-repeat: no-repeat;
  background-size: contain;
}

.hero-icon-select {
  height: 100%;
  width: 100%;
  background-repeat: no-repeat;
  background-size: cover;
}

.hero-icon-disabled {
  opacity: 0.5;
  filter: alpha(opacity=50);
}

.theme--light .hero-level-flag {
  background: rgba(52, 122, 154, 0.5);
}

.theme--dark .hero-level-flag {
  background: rgba(50, 194, 165, 0.4);
}

.hero-level-flag {
  padding-bottom: 5px;
  font-size: 1.3em;
  clip-path: polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%);
}
</style>
