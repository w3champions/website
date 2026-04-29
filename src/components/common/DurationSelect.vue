<template>
  <v-menu
    location="right"
    :close-on-content-click="false"
    @update:model-value="onMenuToggled"
  >
    <template v-slot:activator="{ props }">
      <v-btn
        tile
        style="background-color: transparent; min-width: 180px;"
        v-bind="props"
      >
        <v-icon size="x-large" start>{{ mdiTimerSand }}</v-icon>
        {{ selected }}
      </v-btn>
    </template>

    <v-card class="px-2" min-width="300">
      <v-card-text class="text-body-1 w3-mid-emphasis pt-3 pl-1 pb-1">
        Match Duration
      </v-card-text>

      <div class="px-4 pb-1 d-flex justify-space-between">
        <v-chip size="small" color="primary" variant="flat">
          {{ format(currentMinMax[0]) }}
        </v-chip>

        <v-chip size="small" color="primary" variant="flat">
          {{ format(currentMinMax[1]) }}
        </v-chip>
      </div>

      <v-card-text class="pt-0">
        <v-range-slider
          v-model="currentMinMax"
          :min="0"
          :max="240"
          step="1"
          color="primary"
          thumb-color="primary"
          class="mt-0"
          track-size="1"
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
    const minSelectable = 0;
    const maxSelectable = 240;

    const initialMin = props.duration
      ? Math.floor(props.duration.min / 60)
      : minSelectable;

    const initialMax = props.duration
      ? Math.floor(props.duration.max / 60)
      : maxSelectable;

    let previousMinMax = [initialMin, initialMax];

    const currentMinMax = ref<number[]>([initialMin, initialMax]);

    const format = (m: number) =>
      m === 240
        ? "4h+"
        : m < 60
        ? `${m} min`
        : `${Math.floor(m / 60)}h ${m % 60 ? m % 60 + "min" : ""}`.trim();

    const selected = computed(() => {
      if (!props.duration) return "Duration";

      const min = Math.floor(props.duration.min / 60);
      const max = Math.floor(props.duration.max / 60);

      if (min === 0 && max === 240) return "Duration";

      return `${format(min)} - ${format(max)}`;
    });

    function onMenuToggled(opened: boolean) {
      if (!opened) {
        const [min, max] = currentMinMax.value;

        if (min !== previousMinMax[0] || max !== previousMinMax[1]) {
          previousMinMax = [...currentMinMax.value];

          if (min === 0 && max === 240) {
            emit("durationFilterChanged", null);
          } else {
            emit("durationFilterChanged", {
              min: min * 60,
              max: max * 60,
            });
          }
        }
      }
    }

    return {
      mdiTimerSand,
      selected,
      currentMinMax,
      onMenuToggled,
      format,
    };
  },
});
</script>

<style scoped>
.uniform-values {
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.75);
}
</style>