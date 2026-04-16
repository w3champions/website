<template>
  <v-menu location="right" :close-on-content-click="false" @update:model-value="onMenuToggled">
    <template v-slot:activator="{ props }">
      <v-btn tile style="background-color: transparent" v-bind="props">
        <v-icon size="x-large" start>{{ mdiTimerSand }}</v-icon>
        {{ selected }}
      </v-btn>
    </template>

    <v-card class="px-2">
      <v-card-text class="text-body-1 w3-mid-emphasis pt-3 pl-1 pb-0">Duration (seconds)</v-card-text>

      <v-card-text>
        <v-range-slider
          v-model="currentMinMax"
          color="primary"
          thumb-color="primary"
          :min="minSelectable"
          :max="maxSelectable"
          step="30"
          thumb-label="always"
          class="pt-6"
          strict
          min-width="300"
          track-size="1"
          hide-details
        />
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref, watch } from "vue";
import { mdiTimerSand } from "@mdi/js";

export default defineComponent({
  name: "DurationSelect",
  props: {
    duration: {
      type: Object as PropType<{ min: number; max: number }>,
      required: true,
    },
  },
  emits: ["durationFilterChanged"],

  setup(props, { emit }) {
    const minSelectable = ref(0);
    const maxSelectable = ref(99999);

    const currentMinMax = ref<number[]>([300, 99999]);

    const selected = computed(() => {
      const [min, max] = currentMinMax.value;
      if (min === 300 && max === 99999) {
        return "Duration";
      }
      return `${min}s - ${max}s`;
    });
    watch(
      () => props.duration,
      (newDuration) => {
        currentMinMax.value = [newDuration.min, newDuration.max];
      },
      { immediate: true }
    );
    let previousMinMax: number[] = [props.duration.min, props.duration.max];

    function hasChanged(): boolean {
      const [currMin, currMax] = currentMinMax.value;
      const [prevMin, prevMax] = previousMinMax;
      return currMin !== prevMin || currMax !== prevMax;
    }

    function onMenuToggled(opened: boolean): void {
      if (!opened && hasChanged()) {
        previousMinMax = [...currentMinMax.value];
        emit("durationFilterChanged", {
          min: currentMinMax.value[0],
          max: currentMinMax.value[1],
        });
      }
    }

    return {
      mdiTimerSand,
      selected,
      currentMinMax,
      minSelectable,
      maxSelectable,
      onMenuToggled,
    };
  },
});
</script>