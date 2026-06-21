<template>
  <div v-if="props.show" class="hero-icon-row d-flex ga-2">
    <span
      v-for="(hero, heroIndex) in heroList"
      :key="heroIndex"
      class="hero-icon-highlight-wrapper"
      :class="{ highlighted: isHighlighted(hero) }"
    >
      <img
        class="hero-img"
        :src="heroSrc(hero)"
        :width="props.size"
        :height="props.size"
        :data-tip="tooltipText(hero)"
        loading="lazy"
        decoding="async"
        alt=""
      />
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Hero } from "@/store/types";
import { getAsset } from "@/helpers/url-functions";

const props = withDefaults(defineProps<{
  heroes: Hero[] | null;
  left: boolean;
  show: boolean;
  selectedHeroes: number[];
  size?: number;
}>(), {
  size: 128,
});

const { t } = useI18n();

const heroList = computed<Hero[] | null>(() => props.left && props.heroes ? props.heroes.toReversed() : props.heroes);

function heroSrc(hero: Hero): string {
  return getAsset(`heroes/${hero.name}.png`);
}

function tooltipText(hero: Hero): string {
  return `${t(`heroNames.${hero.name}`)} (${t("common.level")} ${hero.level})`;
}

function isHighlighted(hero: Hero): boolean {
  return props.selectedHeroes.includes(hero.id ?? -1);
}
</script>

<style lang="scss" scoped>
.hero-img {
  display: block;
  object-fit: contain;
}

// Highlight wrapper mirrors the one in match-details/HeroIcon.vue, kept here so
// the matches grid can render hero icons as plain <img> elements (no per-icon
// v-img / v-tooltip) and stay cheap to mount/unmount when the heroes toggle flips.
.hero-icon-highlight-wrapper {
  display: inline-flex;
  border: 1px solid transparent;
  border-radius: 2px;
  transition: border-color 0.2s;
}

.hero-icon-highlight-wrapper.highlighted {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 6px 2px rgba(var(--v-theme-primary), 0.5);
}
</style>
