<template>
  <v-menu location="right" :close-on-content-click="false" @update:model-value="onMenuToggled">
    <template v-slot:activator="{ props }">
      <v-btn tile style="background-color: transparent" v-bind="props">
        <v-icon size="x-large" start>{{ mdiChevronTripleUp }}</v-icon>
        {{ selected }}
      </v-btn>
    </template>
    <v-card class="px-2">
      <div class="w3-gray-text pt-2 pl-1">{{ $t('components_common_mmrselect.selectmmr') }}</div>
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

<script lang="ts">
import { defineComponent, computed, PropType, ref } from "vue";
import { Mmr } from "@/store/match/types";
import { mdiChevronTripleUp } from "@mdi/js";

export default defineComponent({
  name: "MmrSelect",
  components: {},
  props: {
    mmr: {
      type: Object as PropType<Mmr>,
      required: true,
    },
  },
  setup: (props, context) => {
    let previousMinMax: number[] = [];
    const minSelectableMmr = ref<number>(0);
    const maxSelectableMmr = ref<number>(3000);
    const currentMinMax = ref<number[]>([minSelectableMmr.value, maxSelectableMmr.value]);

    const selected = computed<string>(() => (props.mmr.min == 0 && props.mmr.max == 3000) ? "MMR" : `${props.mmr.min} - ${props.mmr.max}`);

    function onMenuToggled(opened: boolean): void {
      // Only send a request to backend when closing menu and selecting a different mmr.
      if (!opened && hasSelectedDifferentMmr()) {
        previousMinMax = [currentMinMax.value[0], currentMinMax.value[1]];
        const newMmrSelection: Mmr = { min: currentMinMax.value[0], max: currentMinMax.value[1] };
        context.emit("mmrFilterChanged", newMmrSelection);
      }
    }

    function hasSelectedDifferentMmr(): boolean {
      return currentMinMax.value[0] != previousMinMax[0] || currentMinMax.value[1] != previousMinMax[1];
    }

    return {
      mdiChevronTripleUp,
      selected,
      onMenuToggled,
      currentMinMax,
      minSelectableMmr,
      maxSelectableMmr,
    };
  },
});
</script>

<style lang="scss" scoped>

</style>
