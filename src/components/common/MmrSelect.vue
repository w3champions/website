<template>
  <v-menu location="right" :close-on-content-click="false" @update:model-value="onMenuToggled">
    <template v-slot:activator="{ props }">
      <v-btn tile class="bg-transparent text-title" v-bind="props">
        <v-icon class="mr-1">{{ mdiChevronTripleUp }}</v-icon>
        {{ selected }}
      </v-btn>
    </template>
    <v-card class="px-2 pt-2">
      <v-card-text>
        <v-range-slider
          v-model="currentMinMax"
          color="primary"
          :min="minSelectableMmr"
          :max="maxSelectableMmr"
          step="100"
          thumb-label="always"
          :hint="$t('components_common_mmrselect.selectmmr')"
          persistent-hint
          class="pt-7"
          strict
          min-width="300"
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
::v-deep(.v-messages) {
  font-size: 15px;
}

::v-deep(.v-theme--dark .v-slider__thumb-label) {
  color: black;
}
</style>
