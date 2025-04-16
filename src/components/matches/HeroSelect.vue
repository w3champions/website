<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" style="background-color: transparent">
        <v-icon style="margin-right: 5px">{{ mdiDramaMasks }}</v-icon>
        {{ selected }}
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
          <v-list-item v-for="(m, index) in heroes" :key="index" @click="selectHero(m.key)">
            <v-list-item-content>
              <v-list-item-title>{{ m.heroName }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { TranslateResult } from "vue-i18n";
import { mdiDramaMasks } from "@mdi/js";
import { EHeroes } from "@/store/heroes";

type HeroSelectHero = {
  heroName: TranslateResult;
  key: EHeroes | string;
};

export default defineComponent({
  name: "HeroSelect",
  props: {
    hero: {
      type: String,
      required: false,
      default: "All Heroes",
    }
  },
  setup: (props, context) => {
    const { t } = useI18n();
    const heroes = computed<HeroSelectHero[]>(() => {
      const heroList = Object.values(EHeroes)
        .map((hero) => ({ heroName: t(`heroNames.${hero}`), key: hero }))
        .sort((heroA, heroB) => {
          if (heroA.heroName < heroB.heroName) {
            return -1;
          }
          if (heroA.heroName > heroB.heroName) {
            return 1;
          } return 0;
        });
      return [{ heroName: "All Heroes", key: "All Heroes" }, ...heroList];
    });
    const selected = computed<string>(() => {
      const match = Object.values(EHeroes).includes(props.hero as EHeroes);
      return match ? t(`heroNames.${props.hero}`) : "All Heroes";
    });

    function selectHero(hero: EHeroes): void {
      context.emit("heroChanged", hero);
    }

    return {
      mdiDramaMasks,
      selected,
      heroes,
      selectHero,
    };
  },
});
</script>

<style></style>
