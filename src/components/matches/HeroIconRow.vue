<template>
  <v-row v-if="show" no-gutters :class="['d-flex', 'ga-2']">
    <v-col v-for="(hero, heroIndex) in heroList" :key="heroIndex">
      <hero-icon :hero="hero" :firstHero="heroIndex === firstHeroIndex" :show-level="false" :size="size" :selectedHeroes="selectedHeroes" />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { Hero } from "@/store/types";
import HeroIcon from "@/components/match-details/HeroIcon.vue";

const { heroes = [], left, show = false, size = 128, selectedHeroes = [] } = defineProps<{
  heroes?: Hero[];
  left: boolean;
  show?: boolean;
  size?: number;
  selectedHeroes?: number[];
}>();

const heroList = left ? heroes.toReversed() : heroes;
const firstHeroIndex = left ? heroList.length - 1 : 0;
</script>
