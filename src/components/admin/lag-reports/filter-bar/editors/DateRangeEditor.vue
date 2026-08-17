<template>
  <div>
    <div class="text-caption text-medium-emphasis mb-2">
      UTC day boundaries, both inclusive — the filter runs against the full database.
      Reports older than {{ retentionDays }} days have expired.
    </div>
    <div class="d-flex flex-wrap ga-1 mb-3">
      <v-chip
        v-for="preset in presets"
        :key="preset.key"
        size="small"
        variant="tonal"
        :color="preset.active ? 'primary' : undefined"
        @click="$emit('preset', preset.key)"
      >
        {{ preset.label }}
      </v-chip>
    </div>
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
import { defineComponent, PropType } from "vue";
import { RETENTION_DAYS } from "@/store/admin/lagReports/filters";

// The window editor: preset chips for the common ranges, manual bounds for
// everything else. The bar owns the datesExplicit flip and the load timing.
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
    presets: {
      type: Array as PropType<Array<{ key: string; label: string; active: boolean }>>,
      required: true,
    },
  },
  emits: ["update:dateFrom", "update:dateTo", "preset"],
  setup() {
    return { retentionDays: RETENTION_DAYS };
  },
});
</script>
