<template>
  <v-menu location="right">
    <template v-slot:activator="{ props }">
      <v-btn
        :tile="!isPlayerMatchesTab"
        :class="{ 'is-player-matches-tab': isPlayerMatchesTab }"
        color="medium-emphasis"
        variant="text"
        border="sm opacity-25"
        width="250"
        height="56"
        active-color="primary"
        :active="!!selectedHeroes.length"
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
            :class="{ 'text-primary': isSelected(hero) }"
            @click="toggleHero(hero)"
          >
            <v-list-item-title>{{ $t(`heroNames.${hero.name}`) }}</v-list-item-title>
            <template v-slot:prepend>
              <v-list-item-action>
                <v-icon v-if="isSelected(hero)" start>{{ mdiCheck }}</v-icon>
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from "vue";
import { TranslateResult, useI18n } from "vue-i18n";
import { mdiCheck, mdiDramaMasks } from "@mdi/js";
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

    const selectedText = computed<TranslateResult>(() => {
      if (!props.selectedHeroes.length) {
        return t("heroNames.allfilter");
      }
      const hero = heroFilters.value.find((h) => h.type === props.selectedHeroes[0]);
      return hero ? t(`heroNames.${hero.name}`) : t("heroNames.allfilter");
    });

    onMounted(async (): Promise<void> => {
      await commonStore.loadHeroFilters();
    });

    const toggleHero = (hero: HeroFilter) => {
      context.emit("heroChanged", hero.name === "allfilter" ? [] : [hero.type]);
    };

    const isSelected = (hero: HeroFilter): boolean => {
      if (hero.name === "allfilter") return props.selectedHeroes.length === 0;
      return props.selectedHeroes.includes(hero.type);
    };

    return {
      mdiCheck,
      mdiDramaMasks,
      heroFilters,
      toggleHero,
      isSelected,
      selectedText,
    };
  },
});
</script>

<style lang="scss" scoped>
.is-player-matches-tab {
  @media (max-width: 960px) {
    width: 100% !important;
  }
}
</style>
