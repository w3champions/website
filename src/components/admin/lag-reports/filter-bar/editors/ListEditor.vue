<template>
  <div>
    <div class="text-caption text-medium-emphasis mb-1">{{ caption }}</div>
    <template v-if="multiple">
      <v-checkbox
        v-for="item in items"
        :key="item.value"
        :label="item.label"
        :model-value="item.active"
        density="compact"
        hide-details
        @update:modelValue="$emit('toggle', item.value)"
      />
    </template>
    <v-list v-else density="compact">
      <v-list-item
        v-for="item in items"
        :key="item.value"
        :active="item.active"
        @click="$emit('toggle', item.value)"
      >
        <v-list-item-title>{{ item.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
    <div v-if="error" class="text-caption text-warning mt-2">{{ errorNote }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { FACET_ERROR_NOTE } from "./PrefixFacetEditor.vue";

// A fixed list of values to pick from: checkboxes when several may hold at
// once (categories), a single-select list otherwise (connection tags, where
// picking the active value again clears it — the bar owns that semantic).
export default defineComponent({
  name: "ListEditor",
  props: {
    items: {
      type: Array as PropType<Array<{ value: string; label: string; active: boolean }>>,
      required: true,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    caption: {
      type: String,
      required: true,
    },
    error: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["toggle"],
  setup() {
    return { errorNote: FACET_ERROR_NOTE };
  },
});
</script>
