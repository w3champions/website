<template>
  <div>
    <v-text-field
      :model-value="dateFrom"
      label="From"
      type="date"
      density="compact"
      hide-details
      class="mb-2"
      @update:modelValue="(value: string) => $emit('update:dateFrom', value)"
    />
    <v-text-field
      :model-value="dateTo"
      label="To"
      type="date"
      density="compact"
      hide-details
      @update:modelValue="(value: string) => $emit('update:dateTo', value)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// The date-range editor: two bounds, either may stay open.
export default defineComponent({
  name: "DateRangeEditor",
  props: {
    dateFrom: {
      type: String,
      required: true,
    },
    dateTo: {
      type: String,
      required: true,
    },
  },
  emits: ["update:dateFrom", "update:dateTo"],
});
</script>
