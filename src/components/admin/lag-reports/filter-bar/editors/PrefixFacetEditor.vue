<template>
  <v-text-field
    :model-value="modelValue"
    :label="label"
    :placeholder="placeholder"
    density="compact"
    autofocus
    hide-details
    @update:modelValue="(value: string) => $emit('update:modelValue', value)"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";

// The editor for every prefix-matched text filter: one text field. Typing
// emits update:modelValue; the page debounces the reload.
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
  },
  emits: ["update:modelValue"],
});
</script>
