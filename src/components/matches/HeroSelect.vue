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
            <v-list-item-title>{{ $t("common.selecthero") }}</v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-divider></v-divider>
        <v-list dense max-height="400" class="overflow-y-auto">
          <v-list-item v-for="hero in heroFilters" :key="hero.type" @click="selectHero(hero)">
            <v-list-item-content>
              <v-list-item-title>{{ $t(`heroNames.${hero.name}`) }}</v-list-item-title>
            </v-list-item-content>
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

    let selectedHero = ref<HeroFilter>();
    const selectedText = computed<TranslateResult>(() => {
      if (selectedHero === undefined || selectedHero.value === undefined) {
        return t("heroNames.allfilter");
      } else {
        return t(`heroNames.${selectedHero.value.name}`);
      }
    });

    onMounted(async (): Promise<void> => {
      await commonStore.loadHeroFilters();
    });

    const selectHero = (hero: HeroFilter) => {
      selectedHero.value = hero;
      context.emit("heroChanged", hero.type);
    };

    return {
      mdiDramaMasks,
      heroFilters,
      selectHero,
      selectedHero,
      selectedText,
    };
  },
});
</script>

<style></style>
