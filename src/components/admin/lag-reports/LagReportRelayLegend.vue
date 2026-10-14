<template>
  <div class="relay-legend d-flex flex-wrap ga-4 mt-2">
    <div v-for="group in groups" :key="group.title" role="group" :aria-label="group.title" class="relay-legend__group">
      <div class="text-caption font-weight-bold">{{ group.title }}</div>
      <div v-if="group.note" class="text-caption text-disabled font-italic">{{ group.note }}</div>
      <button
        v-for="item in group.items"
        :key="item.key"
        type="button"
        class="relay-legend__item text-caption"
        :class="{ 'relay-legend__item--off': hidden.has(item.key) }"
        :aria-pressed="!hidden.has(item.key)"
        :title="hidden.has(item.key) ? 'Show' : 'Hide'"
        @click="$emit('toggle', item.key)"
      >
        <svg width="28" height="10" aria-hidden="true">
          <rect v-if="item.style === 'stall'" x="0" y="1" width="28" height="8" :fill="item.color" fill-opacity="0.35" />
          <line
            v-else
            x1="0"
            y1="5"
            x2="28"
            y2="5"
            :stroke="item.color"
            :stroke-width="item.style === 'felt' && !item.dash.length ? 3 : 2"
            :stroke-dasharray="item.dash.join(' ')"
          />
        </svg>
        {{ item.label }}
      </button>
    </div>
    <div role="group" aria-label="Markers" class="relay-legend__group">
      <div class="text-caption font-weight-bold">Markers</div>
      <div class="text-caption"><span class="relay-legend__pause" aria-hidden="true"></span> game paused (any player)</div>
      <div class="text-caption"><span class="relay-legend__event" aria-hidden="true"></span> connection event or lag report</div>
      <div class="text-caption"><span aria-hidden="true">▲</span> retransmits in that bucket</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { LegendGroup } from "./relayChartSeries";

export default defineComponent({
  name: "LagReportRelayLegend",
  props: {
    groups: { type: Array as PropType<LegendGroup[]>, required: true },
    hidden: { type: Set as PropType<Set<string>>, required: true },
  },
  emits: ["toggle"],
});
</script>

<style scoped>
.relay-legend__group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 180px;
}

.relay-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 1px 4px;
  border-radius: 4px;
  background: none;
  border: 1px solid transparent;
  color: inherit;
  cursor: pointer;
}

.relay-legend__item:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.24);
}

.relay-legend__item:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}

.relay-legend__item--off {
  opacity: 0.45;
  text-decoration: line-through;
}

.relay-legend__pause {
  display: inline-block;
  width: 20px;
  height: 8px;
  background: rgba(var(--v-theme-warning), 0.18);
  border: 1px solid rgba(var(--v-theme-warning), 0.5);
}

.relay-legend__event {
  display: inline-block;
  width: 0;
  height: 10px;
  margin: 0 9px;
  border-left: 2px dashed rgb(var(--v-theme-warning));
}
</style>
