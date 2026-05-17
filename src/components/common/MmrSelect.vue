<template>
  <v-menu location="right" :close-on-content-click="false" @update:model-value="onMenuToggled">
    <template v-slot:activator="{ props }">
      <v-btn tile class="w3-dropdown-button" style="background-color: transparent" v-bind="props">
        <v-icon size="x-large" start>{{ mdiChevronTripleUp }}</v-icon>
        {{ selected }}
      </v-btn>
    </template>
    <v-card class="px-2">
      <v-card-text class="text-body-1 w3-mid-emphasis pt-3 pl-1 pb-0">{{ $t('components_common_mmrselect.selectmmr') }}</v-card-text>
      <v-card-text>
        <v-range-slider
          v-model="currentMinMax"
          color="primary"
          thumb-color="primary"
          :min="minSelectableMmr"
          :max="maxSelectableMmr"
          step="100"
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

<script setup lang="ts">
import { computed, ref } from "vue";
import { Mmr } from "@/store/match/types";
import { mdiChevronTripleUp } from "@mdi/js";

const { mmr } = defineProps<{
  mmr: Mmr;
}>();

const emit = defineEmits<{
  mmrFilterChanged: [newMmr: Mmr];
}>();

let previousMinMax: number[] = [];
const minSelectableMmr = ref<number>(0);
const maxSelectableMmr = ref<number>(3000);
const currentMinMax = ref<number[]>([minSelectableMmr.value, maxSelectableMmr.value]);
const selected = computed<string>(() => (mmr.min == 0 && mmr.max == 3000) ? "MMR" : `${mmr.min} - ${mmr.max}`);

function onMenuToggled(opened: boolean): void {
  // Only send a request to backend when closing menu and selecting a different mmr.
  if (!opened && hasSelectedDifferentMmr()) {
    previousMinMax = [currentMinMax.value[0], currentMinMax.value[1]];
    const newMmrSelection: Mmr = { min: currentMinMax.value[0], max: currentMinMax.value[1] };
    emit("mmrFilterChanged", newMmrSelection);
  }
}

function hasSelectedDifferentMmr(): boolean {
  return currentMinMax.value[0] != previousMinMax[0] || currentMinMax.value[1] != previousMinMax[1];
}
</script>
