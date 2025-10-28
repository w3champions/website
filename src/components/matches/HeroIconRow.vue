<template>
  <v-row v-if="show" no-gutters :class="['d-flex', 'ga-2']">
    <v-col v-for="(hero, heroIndex) in heroList" :key="heroIndex">
      <hero-icon :hero="hero" :firstHero="heroIndex === firstHeroIndex" :show-level="false" :size="size" :selectedHeroes="selectedHeroes" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Hero } from "@/store/types";
import HeroIcon from "@/components/match-details/HeroIcon.vue";

export default defineComponent({
  name: "HeroIconRow",
  components: {
    HeroIcon,
  },
  props: {
    heroes: {
      type: Array as PropType<Hero[]>,
      required: false,
      default: Array<Hero[]>
    },
    left: {
      type: Boolean,
      required: true,
    },
    show: {
      type: Boolean,
      required: false,
      default: false
    },
    size: {
      type: Number,
      required: false,
      default: 128,
    },
    selectedHeroes: {
      type: Array as PropType<number[]>,
      required: false,
      default: () => [],
    },
  },
  setup(props) {
    let heroList = props.heroes;
    if (props.left && heroList) {
      // must slice to avoid mutating the original array
      heroList = heroList.slice().reverse();
    }
    return {
      heroList,
      firstHeroIndex: props.left && heroList ? heroList.length - 1 : 0,
    };
  }
});
</script>
