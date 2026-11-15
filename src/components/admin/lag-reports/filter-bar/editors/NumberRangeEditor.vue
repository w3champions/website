<template>
  <div>
    <div class="text-caption text-medium-emphasis mb-2">
      Players in the game. Leave a box empty for no bound on that end.
    </div>
    <div class="d-flex ga-2">
      <v-text-field
        :model-value="min > 0 ? String(min) : ''"
        label="Min"
        type="number"
        min="1"
        density="compact"
        autofocus
        hide-details
        @update:modelValue="(value: string) => $emit('update:min', value)"
      />
      <v-text-field
        :model-value="max > 0 ? String(max) : ''"
        label="Max"
        type="number"
        min="1"
        density="compact"
        hide-details
        @update:modelValue="(value: string) => $emit('update:max', value)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// A min/max pair over a count; 0 means "no bound on that end" and renders as
// an empty box. The bar parses the raw strings.
export default defineComponent({
  name: "NumberRangeEditor",
  props: {
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
  },
  emits: ["update:min", "update:max"],
});
</script>
