<template>
  <v-row v-if="props.show" no-gutters :class="['d-flex', 'ga-2']">
    <v-col v-for="(hero, heroIndex) in heroList" :key="heroIndex">
      <hero-icon :hero="hero" :firstHero="heroIndex === firstHeroIndex" :show-level="false" :size="props.size" :selectedHeroes="props.selectedHeroes" />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Hero } from "@/store/types";
import HeroIcon from "@/components/match-details/HeroIcon.vue";

const props = withDefaults(defineProps<{
  heroes: Hero[] | null;
  left: boolean;
  show: boolean;
  selectedHeroes: number[];
  size?: number;
}>(), {
  size: 128,
});

const heroList = computed<Hero[] | null>(() => props.left && props.heroes ? props.heroes.toReversed() : props.heroes);
const firstHeroIndex = computed<number>(() => props.left && heroList.value ? heroList.value.length - 1 : 0);
</script>
