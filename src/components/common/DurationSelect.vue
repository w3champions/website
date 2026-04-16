<template>
  <v-menu location="right" :close-on-content-click="false" @update:model-value="onMenuToggled">
    <template v-slot:activator="{ props }">
      <v-btn tile style="background-color: transparent" v-bind="props">
        <v-icon size="x-large" start>{{ mdiTimerSand }}</v-icon>
        {{ selected }}
      </v-btn>
    </template>

    <v-card class="px-2">
      <v-card-text class="text-body-1 w3-mid-emphasis pt-3 pl-1 pb-0">
        Match Duration (minutes)
      </v-card-text>

      <v-card-text>
        <v-range-slider
          v-model="currentMinMaxMinutes"
          color="primary"
          thumb-color="primary"
          :min="minSelectable"
          :max="maxSelectable"
          step="1"
          thumb-label="always"
          class="pt-6"
          strict
          min-width="340"
          track-size="1"
          hide-details
        >
          <template v-slot:prepend>
            <span class="text-caption">{{ formatLabel(currentMinMaxMinutes[0]) }}</span>
          </template>
          <template v-slot:append>
            <span class="text-caption">{{ formatLabel(currentMinMaxMinutes[1]) }}</span>
          </template>
        </v-range-slider>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref, watch, onMounted } from "vue";
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
    const maxSelectable = ref(1440);

    const currentMinMaxMinutes = ref<number[]>([0, 1440]);

    const selected = computed(() => {
      const [min, max] = currentMinMaxMinutes.value;

      if (min === 0 && max === 1440) {
        return "Duration";
      }

      const minLabel = min < 60
        ? `${min} min`
        : `${Math.floor(min / 60)}h ${min % 60 ? min % 60 + "min" : ""}`.trim();

      const maxLabel = max === 1440
        ? "24h+"
        : max < 60
          ? `${max} min`
          : `${Math.floor(max / 60)}h ${max % 60 ? max % 60 + "min" : ""}`.trim();

      return `${minLabel} - ${maxLabel}`;
    });

    function formatLabel(minutes: number): string {
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const remaining = minutes % 60;
      return remaining === 0 ? `${hours}h` : `${hours}h ${remaining}min`;
    }

    const updateSlider = () => {
      if (props.duration) {
        const minMin = Math.floor(props.duration.min / 60);
        const maxMin = Math.min(Math.ceil(props.duration.max / 60), 1440);
        currentMinMaxMinutes.value = [minMin, maxMin];
      }
    };

    onMounted(updateSlider);

    watch(
      () => props.duration,
      updateSlider,
      { deep: true }
    );

    function onMenuToggled(opened: boolean): void {
      if (!opened) {
        const [min, max] = currentMinMaxMinutes.value;
        if (min > 0 || max < 1440) {
          emit("durationFilterChanged", {
            min: min * 60,
            max: max * 60,
          });
        } else {

          emit("durationFilterChanged", { min: 0, max: 86400 });
        }
      }
    }

    return {
      mdiTimerSand,
      selected,
      currentMinMaxMinutes,
      minSelectable,
      maxSelectable,
      onMenuToggled,
      formatLabel,
    };
  },
});
</script>