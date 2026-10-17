<template>
  <div>
    <v-text-field
      :model-value="modelValue"
      :label="label"
      :placeholder="placeholder"
      density="compact"
      autofocus
      hide-details
      @update:modelValue="(value: string) => $emit('update:modelValue', value)"
    />
    <template v-if="facets">
      <v-list v-if="facets.length > 0" density="compact" class="mt-1 facet-list">
        <v-list-subheader v-if="facetHeading">{{ facetHeading }}</v-list-subheader>
        <v-list-item v-for="[value, count] in facets" :key="value" @click="$emit('pick', value)">
          <v-list-item-title class="text-body-2">{{ value }}</v-list-item-title>
          <template v-slot:append>
            <span class="text-caption text-medium-emphasis">{{ count }}{{ countSuffix }}</span>
          </template>
        </v-list-item>
      </v-list>
      <!-- An empty suggestion list only says the value is absent from the
           current range's results; the filter itself still searches the whole
           database — so a prefix with no suggestion is still worth applying. -->
      <div v-else-if="modelValue.trim()" class="text-caption text-medium-emphasis mt-2">
        {{ missNote }}
      </div>
      <!-- A failed suggestion fetch must not read as "nothing exists". -->
      <div v-if="error" class="text-caption text-warning mt-2">{{ errorNote }}</div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

// Shared by every editor that offers suggestions: an empty list must not read
// as "nothing exists", and a failed fetch must not read as an empty list.
export const FACET_MISS_NOTE = "Not in the current results — the filter still searches the full database.";
export const FACET_ERROR_NOTE = "Couldn't load suggestions — the filter itself still works.";

// The editor for every prefix-matched text filter: a text field, and — when
// the filter has a facet source — a suggestion list with live counts. Typing
// emits update:modelValue (the page debounces those); picking a suggestion
// emits pick (a finished decision, the page loads immediately).
export default defineComponent({
  name: "PrefixFacetEditor",
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    placeholder: {
      type: String,
      required: true,
    },
    // null = this filter has no suggestion source; the editor is the field alone.
    facets: {
      type: Array as PropType<Array<[string, number]> | null>,
      default: null,
    },
    facetHeading: {
      type: String,
      default: "",
    },
    // Rendered after each count, e.g. " submitted".
    countSuffix: {
      type: String,
      default: "",
    },
    error: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "pick"],
  setup() {
    return {
      missNote: FACET_MISS_NOTE,
      errorNote: FACET_ERROR_NOTE,
    };
  },
});
</script>

<style lang="scss" scoped>
.facet-list {
  max-height: 260px;
  overflow-y: auto;
}
</style>
