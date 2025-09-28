<template>
  <div v-if="hero">
    <div :class="['hero-icon-highlight-wrapper', { highlighted: isHighlighted }]">
      <hero-picture :hero-icon="hero.name" :hero-level="hero.level" :size="size" />
    </div>
    <div v-if="showLevel" class="text-center hero-level-flag" :class="firstHeroOrNot">
      <span>{{ hero.level }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from "vue";
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
    const firstHeroOrNot = ref<string>(props.firstHero ? "hero-level-flag-first-hero" : "hero-level-flag-second-hero");
    const isHighlighted = computed(() => {
      if (!props.hero) return false;
      return props.selectedHeroes.includes(props.hero.id ?? -1);
    });
    return {
      firstHeroOrNot,
      isHighlighted,
    };
  },
});
</script>

<style lang="scss" scoped>
.v-theme--light .hero-level-flag {
  background: rgba(52, 122, 154, 0.5);
}

.v-theme--dark .hero-level-flag {
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

.hero-icon-highlight-wrapper {
  border: 1px solid transparent;
  border-radius: 2px;
  transition: border-color 0.2s;
}
.hero-icon-highlight-wrapper.highlighted {
  border-color: gold;
  box-shadow: 0 0 6px 2px rgba(255, 215, 0, 0.5);
}
</style>
