<template>
    <v-row v-if="show" :class="rowClasses" style="margin: 0;">
      <v-col cols="auto" v-for="(hero, heroIndex) in heroes" :key="heroIndex" class="px-1">
        <hero-icon :hero="hero" :firstHero="heroIndex === 0" :show-level="false"/>
      </v-col>
    </v-row>
  </template>
  
  <script lang="ts">
  import { computed, defineComponent, PropType } from "vue";
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
        required: true,
      },
      left: {
        type: Boolean,
        required: true,
      },
      show: {
        type: Boolean,
        required: true,
      },
    },
    setup(props) {
      const rowClasses = computed(() => {
        const classes = ['mt-n1'];
        if (props.left) {
          classes.push('justify-end');
        } else {
          classes.push('justify-start');
        }
        return classes;
      });
  
      return {
        rowClasses
      };
    },
  });
  </script>