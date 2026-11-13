<template>
  <svg class="dumbbell" role="img" :aria-label="alt" :width="WIDTH" :height="HEIGHT" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`">
    <title>{{ alt }}</title>
    <line :x1="WIDTH_PAD" :x2="WIDTH - WIDTH_PAD" :y1="MID" :y2="MID" class="axis" />
    <line v-if="ever" :x1="duringX" :x2="everX" :y1="MID" :y2="MID" class="link" />
    <circle :cx="duringX" :cy="MID" r="4" class="during" />
    <!-- The "ever" mark is a square and the "during" mark a circle, so the two read apart without colour. -->
    <rect v-if="ever" :x="everX - 4" :y="MID - 4" width="8" height="8" class="ever" />
  </svg>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { factText } from "@/store/admin/smurfEvents/facts";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

const WIDTH = 120;
const HEIGHT = 20;
const WIDTH_PAD = 6;
const MID = HEIGHT / 2;

const props = defineProps<{
  during: number;
  ever?: { count: number; capped?: true };
  /** Maps an account count to 0..1 on the axis shared by every row. */
  scale: (v: number) => number;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});

function xOf(value: number): number {
  return WIDTH_PAD + props.scale(value) * (WIDTH - 2 * WIDTH_PAD);
}

const duringX = computed(() => xOf(props.during));
const everX = computed(() => xOf(props.ever?.count ?? props.during));

const alt = computed(() => {
  const capped = props.ever?.capped;
  const during = factText(props.during, capped, tr);
  if (!props.ever) return t(key("dumbbell_alt_during"), { during });
  return t(key("dumbbell_alt"), { during, ever: factText(props.ever.count, capped, tr) });
});
</script>

<style scoped>
.axis {
  stroke: rgb(var(--v-theme-on-surface));
  stroke-opacity: 0.2;
}

.link {
  stroke: rgb(var(--v-theme-on-surface));
  stroke-opacity: 0.45;
  stroke-width: 2;
}

.during {
  fill: rgb(var(--v-theme-primary));
}

.ever {
  fill: rgb(var(--v-theme-surface));
  stroke: rgb(var(--v-theme-on-surface));
  stroke-opacity: 0.7;
  stroke-width: 2;
}
</style>
