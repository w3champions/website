<template>
  <v-menu location="bottom start">
    <template v-slot:activator="{ props }">
      <v-btn
        v-if="isPlayerMatchesTab"
        tile
        class="is-player-matches-tab"
        color="medium-emphasis"
        variant="text"
        border="sm opacity-25"
        width="250"
        height="56"
        active-color="primary"
        :active="!!selectedHeroes.length"
        v-bind="props"
      >
        <v-icon v-if="isAllHeroesSelected" size="x-large" start>{{ mdiDramaMasks }}</v-icon>
        <v-img
          v-else
          :src="selectedHeroIcon"
          :alt="selectedText"
          width="28"
          aspect-ratio="1"
          class="hero-select-button-icon"
        />
        {{ selectedText }}
      </v-btn>
      <v-btn
        v-else
        class="w3-dropdown-button"
        style="background-color: transparent"
        v-bind="props"
      >
        <v-icon v-if="isAllHeroesSelected" size="x-large" start>{{ mdiDramaMasks }}</v-icon>
        <v-img
          v-else
          :src="selectedHeroIcon"
          :alt="selectedText"
          width="28"
          aspect-ratio="1"
          class="hero-select-button-icon"
        />
        {{ selectedText }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text class="dropdown-menu-content">
        <div class="dropdown-menu-title">{{ $t("common.selecthero_highestlevel") }}</div>
        <v-divider />
        <v-list density="compact" max-height="400" class="overflow-y-auto">
          <v-list-item
            v-for="hero in heroFilters"
            :key="hero.type"
            @click="toggleHero(hero)"
          >
            <template v-slot:prepend>
              <span v-if="hero.name === 'allfilter'" class="hero-select-icon hero-select-icon--default">
                <v-icon size="28">{{ mdiDramaMasks }}</v-icon>
              </span>
              <v-img
                v-else
                :src="getHeroIcon(hero)"
                :alt="$t(`heroNames.${hero.name}`)"
                width="28"
                aspect-ratio="1"
                class="hero-select-icon"
              />
            </template>
            <v-list-item-title>{{ $t(`heroNames.${hero.name}`) }}</v-list-item-title>
            <template v-slot:append>
              <v-icon v-if="isSelected(hero)" size="18">{{ mdiCheck }}</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { mdiCheck, mdiDramaMasks } from "@mdi/js";
import { useCommonStore } from "@/store/common/store";
import { HeroFilter } from "@/store/heroes";
import { getAsset } from "@/helpers/url-functions";

const { isPlayerMatchesTab, selectedHeroes } = defineProps({
  isPlayerMatchesTab: {
    type: Boolean,
    default: false,
  },
  selectedHeroes: {
    type: Array<number>,
    default: [],
  },
});

const emit = defineEmits<{
  heroChanged: [heroes: number[]];
}>();

const { t } = useI18n();
const commonStore = useCommonStore();
const heroFilters = computed<HeroFilter[]>(() => commonStore.heroFilters);

const selectedHero = computed<HeroFilter | undefined>(() => {
  if (!selectedHeroes.length) {
    return heroFilters.value.find((hero) => hero.name === "allfilter");
  }

  return heroFilters.value.find((hero) => hero.type === selectedHeroes[0]);
});

const selectedText = computed<string>(() => {
  return selectedHero.value ? t(`heroNames.${selectedHero.value.name}`) : t("heroNames.allfilter");
});

const isAllHeroesSelected = computed<boolean>(() => {
  return !selectedHeroes.length || selectedHero.value?.name === "allfilter";
});

const selectedHeroIcon = computed<string>(() => {
  return getAsset(`heroes/${getHeroIconName(selectedHero.value?.name ?? "allfilter")}.png`);
});

onMounted(async (): Promise<void> => {
  await commonStore.loadHeroFilters();
});

const toggleHero = (hero: HeroFilter) => {
  emit("heroChanged", hero.name === "allfilter" ? [] : [hero.type]);
};

const isSelected = (hero: HeroFilter): boolean => {
  if (hero.name === "allfilter") return selectedHeroes.length === 0;
  return selectedHeroes.includes(hero.type);
};

const getHeroIcon = (hero: HeroFilter): string => {
  return getAsset(`heroes/${getHeroIconName(hero.name)}.png`);
};

const getHeroIconName = (heroName: string): string => {
  return heroName === "allfilter" ? "all" : heroName;
};
</script>

<style lang="scss" scoped>
.is-player-matches-tab {
  @media (max-width: 960px) {
    width: 100% !important;
  }
}

.hero-select-icon {
  border-radius: 2px;
  flex: 0 0 28px;
  margin-right: 8px;
  width: 28px;
}

.hero-select-icon--default {
  align-items: center;
  border-radius: 0;
  display: inline-flex;
  justify-content: center;
}

.hero-select-button-icon {
  border-radius: 2px;
  flex: none;
  margin-right: 8px;
}
</style>
