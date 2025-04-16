<template>
  <v-row v-if="show" no-gutters>
    <v-col v-for="(hero, heroIndex) in heroes" :key="heroIndex" class="pa-1">
      <hero-icon :hero="hero" :firstHero="heroIndex === 0" :show-level="false" :size="size" />
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
      required: false
    },
  },
});
</script>
