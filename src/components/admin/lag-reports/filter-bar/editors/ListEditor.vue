<template>
  <div>
    <div class="text-caption text-medium-emphasis mb-1">{{ caption }}</div>
    <v-checkbox
      v-for="item in items"
      :key="item.value"
      :label="item.label"
      :model-value="item.active"
      density="compact"
      hide-details
      @update:modelValue="$emit('toggle', item.value)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

// A fixed list of values to tick — several may hold at once, and the bar owns
// what toggling a value means.
export default defineComponent({
  name: "ListEditor",
  props: {
    items: {
      type: Array as PropType<Array<{ value: string; label: string; active: boolean }>>,
      required: true,
    },
    caption: {
      type: String,
      required: true,
    },
  },
  emits: ["toggle"],
});
</script>
