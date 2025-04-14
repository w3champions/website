<template>
  <div v-if="hero">
    <hero-picture :hero-icon="hero.icon" />
    <div v-if="showLevel"  class="text-center hero-level-flag" :class="firstHeroOrNot">
      <span>{{ hero.level }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { Hero } from "@/store/types";
import HeroPicture from "@/components/match-details/HeroPicture.vue";

export default defineComponent({
  name: "HeroIcon",
  components: {
    HeroPicture,
  },
  props: {
    hero: {
      type: Object as PropType<Hero>,
      required: false,
      default: undefined,
    },
    firstHero: {
      type: Boolean,
      false: true,
      default: undefined,
    },
    showLevel: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props) {
    const firstHeroOrNot = ref<string>(props.firstHero ? "hero-level-flag-first-hero" : "hero-level-flag-second-hero");

    return {
      firstHeroOrNot,
    };
  },
});
</script>

<style lang="scss" scoped>
.theme--light .hero-level-flag {
  background: rgba(52, 122, 154, 0.5);
}

.theme--dark .hero-level-flag {
  background: rgba(50, 194, 165, 0.4);
}

.hero-level-flag {
  padding-bottom: 5px;
  clip-path: polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%);
}

.hero-level-flag-first-hero {
  font-size: 1.5em;
  margin-left: 7%;
  margin-right: 7%;
}

.hero-level-flag-second-hero {
  font-size: 1.1em;
  margin-left: 17%;
  margin-right: 17%;
}
</style>
