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

const { heroes, left, show, selectedHeroes, size = 128 } = defineProps<{
  heroes: Hero[] | null;
  left: boolean;
  show: boolean;
  selectedHeroes: number[];
  size?: number;
}>();

const heroList = left && heroes ? heroes.toReversed() : heroes;
const firstHeroIndex = left && heroList ? heroList.length - 1 : 0;
</script>
