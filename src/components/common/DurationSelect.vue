<template>
  <v-menu
    location="right"
    :close-on-content-click="false"
    @update:model-value="onMenuToggled"
  >
    <template v-slot:activator="{ props }">
      <v-btn tile style="background-color: transparent" v-bind="props">
        <v-icon size="x-large" start>{{ mdiTimerSand }}</v-icon>
        {{ selected }}
      </v-btn>
    </template>

    <v-card class="px-2" min-width="300">
      <v-card-text class="text-body-1 w3-mid-emphasis pt-3 pl-1 pb-0">
        Match Duration
      </v-card-text>

      <v-card-text class="d-flex flex-column gap-4">
        <v-select
          v-model="minMinutes"
          label="Min Duration"
          :items="durationOptions"
          density="comfortable"
          hide-details
        />
        <v-select
          v-model="maxMinutes"
          label="Max Duration"
          :items="durationOptions"
          density="comfortable"
          hide-details
        />
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref } from "vue";
import { mdiTimerSand } from "@mdi/js";

export default defineComponent({
  name: "DurationSelect",
  props: {
    duration: {
      type: Object as PropType<{ min: number; max: number }>,
      default: null,
    },
  },
  emits: ["durationFilterChanged"],

  setup(props, { emit }) {

    const durationOptions = Array.from({ length: 241 }, (_, i) => ({
      title: i === 240 ? "4h+" : i < 60 ? `${i} min` : `${Math.floor(i / 60)}h ${i % 60 ? i % 60 + "min" : ""}`.trim(),
      value: i,
    }));

    const minMinutes = ref(props.duration ? Math.floor(props.duration.min / 60) : 0);
    const maxMinutes = ref(props.duration ? Math.floor(props.duration.max / 60) : 240);

    const selected = computed(() => {
      if (minMinutes.value === 0 && maxMinutes.value === 240) {
        return "Duration";
      }

      const minLabel = durationOptions[minMinutes.value].title;
      const maxLabel = durationOptions[maxMinutes.value].title;

      return `${minLabel} - ${maxLabel}`;
    });

    function onMenuToggled(opened: boolean) {
      if (!opened) {
        if (minMinutes.value === 0 && maxMinutes.value === 240) {
          emit("durationFilterChanged", null);
        } else {
          emit("durationFilterChanged", {
            min: minMinutes.value * 60,
            max: maxMinutes.value * 60,
          });
        }
      }
    }

    return {
      mdiTimerSand,
      selected,
      durationOptions,
      minMinutes,
      maxMinutes,
      onMenuToggled,
    };
  },
});
</script>