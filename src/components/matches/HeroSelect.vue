<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" style="background-color: transparent">
        <v-icon style="margin-right: 5px">{{ mdiDramaMasks }}</v-icon>
        {{ selectedText }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-content>
            <v-list-item-title>{{ $t("common.selecthero_highestlevel") }}</v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-divider></v-divider>
        <v-list dense max-height="400" class="overflow-y-auto">
          <v-list-item
            v-for="hero in heroFilters"
            :key="hero.type"
            @click="toggleHero(hero)"
            :class="{ 'primary--text': isSelected(hero) }"
          >
            <v-list-item-content>
              <v-list-item-title>{{ $t(`heroNames.${hero.name}`) }}</v-list-item-title>
            </v-list-item-content>
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
import { TranslateResult, useI18n } from "vue-i18n-bridge";
import { mdiDramaMasks } from "@mdi/js";
import { useCommonStore } from "@/store/common/store";
import { HeroFilter } from "@/store/heroes";


export default defineComponent({
  name: "HeroSelect",
  setup: (_, context) => {
    const { t } = useI18n();
    const commonStore = useCommonStore();
    const heroFilters = computed<HeroFilter[]>(() => commonStore.heroFilters);

    const selectedHeroes = ref<number[]>([]);
    const selectedText = computed<TranslateResult>(() => {
      if (!selectedHeroes.value.length) {
        return t("heroNames.allfilter");
      }
      const count = selectedHeroes.value.length;
      return count === 1 ? `${count} hero` : `${count} heroes`;
    });

    onMounted(async (): Promise<void> => {
      await commonStore.loadHeroFilters();
    });

    const toggleHero = (hero: HeroFilter) => {
      if (hero.name === "all") {
        selectedHeroes.value = [];
      } else {
        const idx = selectedHeroes.value.indexOf(hero.type);
        if (idx >= 0) {
          selectedHeroes.value.splice(idx, 1);
        } else {
          selectedHeroes.value.push(hero.type);
        }
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
      selectedHeroes,
      selectedText,
    };
  },
});
</script>

<style></style>
