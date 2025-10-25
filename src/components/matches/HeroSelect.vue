<template>
  <v-menu location="right">
    <template v-slot:activator="{ props }">
      <v-btn
        :tile="!isPlayerMatchesTab"
        :class="{ 'is-player-matches-tab': isPlayerMatchesTab }"
        class="bg-transparent text-black-gold"
        v-bind="props"
      >
        <v-icon size="x-large" start>{{ mdiDramaMasks }}</v-icon>
        {{ selectedText }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-title>{{ $t("common.selecthero_highestlevel") }}</v-list-item-title>
        </v-list>
        <v-divider />
        <v-list density="compact" max-height="400" class="overflow-y-auto">
          <v-list-item
            v-for="hero in heroFilters"
            :key="hero.type"
            :class="{ 'primary--text': isSelected(hero) }"
            @click="toggleHero(hero)"
          >
            <v-list-item-title>{{ $t(`heroNames.${hero.name}`) }}</v-list-item-title>
            <v-list-item-action>
              <v-icon v-if="isSelected(hero)">mdi-check</v-icon>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { TranslateResult, useI18n } from "vue-i18n";
import { mdiDramaMasks } from "@mdi/js";
import { useCommonStore } from "@/store/common/store";
import { HeroFilter } from "@/store/heroes";

export default defineComponent({
  name: "HeroSelect",
  props: {
    isPlayerMatchesTab: {
      type: Boolean,
      default: false,
    },
    selectedHeroes: {
      type: Array<number>,
      default: [],
    },
  },
  setup: (props, context) => {
    const { t } = useI18n();
    const commonStore = useCommonStore();
    const heroFilters = computed<HeroFilter[]>(() => commonStore.heroFilters);

    const selectedHeroes = ref<number[]>([...props.selectedHeroes]);
    const selectedText = computed<TranslateResult>(() => {
      if (!selectedHeroes.value.length) {
        return t("heroNames.allfilter");
      }
      const hero = heroFilters.value.find((h) => h.type === selectedHeroes.value[0]);
      return hero ? t(`heroNames.${hero.name}`) : t("heroNames.allfilter");
    });

    onMounted(async (): Promise<void> => {
      await commonStore.loadHeroFilters();
    });

    const toggleHero = (hero: HeroFilter) => {
      if (hero.name === "all") {
        selectedHeroes.value = [];
      } else {
        selectedHeroes.value = [hero.type];
      }
      context.emit("heroChanged", [...selectedHeroes.value]);
    };

    const isSelected = (hero: HeroFilter): boolean => {
      if (hero.name === "all") return selectedHeroes.value.length === 0;
      return selectedHeroes.value.includes(hero.type);
    };

    return {
      mdiDramaMasks,
      heroFilters,
      toggleHero,
      isSelected,
      selectedText,
    };
  },
});
</script>

<style scoped>
.is-player-matches-tab {
  @media (max-width: 960px) {
    width: 100% !important;
  }
  height: 56px !important;
  min-width: 250px !important;
  border-radius: 4px;
  border-color: rgb(128, 128, 128, 0.5) !important;
  border-width: 1px !important;
  border-style: solid !important;
  box-shadow: none !important;
}
.is-player-matches-tab.v-theme--dark {
  color: #ffffff;
}
</style>
