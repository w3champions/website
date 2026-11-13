<template>
  <svg class="day-lane" role="img" :aria-label="alt" :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`">
    <title>{{ alt }}</title>
    <rect :x="band.x" y="0" :width="band.w" :height="height" class="band" />
    <rect
      v-for="bar in bars"
      :key="bar.day"
      :x="bar.x"
      :y="height - bar.h"
      :width="Math.max(bar.w - 0.5, 0.5)"
      :height="bar.h"
      :class="isEventDay(bar.day, window) ? 'bar-inside' : 'bar-outside'"
    />
  </svg>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { SmurfEventIdentifiers } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { key } from "@/store/admin/smurfEvents/translate";
import { bandOf, dayText, isEventDay, isValidWindow, laneBars } from "./day-lane";

const props = withDefaults(
  defineProps<{
    /** UTC day number and the accounts that day; days with use only. */
    days: Array<[number, number]>;
    window: SmurfEventIdentifiers["window"];
    /** The numbers are lower bounds: the server read only part of the accounts. */
    lowerBound?: boolean;
    width?: number;
    height?: number;
  }>(),
  { lowerBound: false, width: 168, height: 28 },
);

const { t } = useI18n();

const bars = computed(() => laneBars(props.days, props.window, props.width, props.height));
const band = computed(() => bandOf(props.window, props.width));

/** The chart in words: the window, the event, and the accounts of every day with use. */
const alt = computed(() => {
  if (!isValidWindow(props.window) || dayText(props.window.fromDay) === "" || dayText(props.window.toDay) === "") return t(key("lane_alt_invalid"));
  const shown = props.days.filter(([day, accounts]) => Number.isFinite(day) && Number.isFinite(accounts) && day >= props.window.fromDay && day <= props.window.toDay);
  const named = {
    from: dayText(props.window.fromDay),
    to: dayText(props.window.toDay),
    eventFrom: dayText(props.window.eventFromDay),
    eventTo: dayText(props.window.eventToDay),
  };
  const lines = shown.length === 0
    ? t(key("lane_alt_none"), named)
    : t(key("lane_alt"), { ...named, days: shown.map(([day, accounts]) => `${dayText(day)}: ${accounts}`).join(", ") });
  return props.lowerBound ? `${lines} ${t(key("lane_alt_lower_bound"))}` : lines;
});
</script>

<style scoped>
.band {
  fill: rgb(var(--v-theme-primary));
  fill-opacity: 0.15;
}

.bar-inside {
  fill: rgb(var(--v-theme-primary));
}

.bar-outside {
  fill: rgb(var(--v-theme-on-surface));
  fill-opacity: 0.45;
}
</style>
