<template>
  <v-menu offset-x :close-on-content-click="false" @input="onMenuToggled">
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" class="transparent">
        <v-icon class="mr-1">{{ mdiChevronTripleUp }}</v-icon> {{ selected }}
      </v-btn>
    </template>
    <v-card class="px-2 pt-2">
      <v-card-text>
        <v-range-slider
          v-model="currentMinMax"
          max="3000"
          min="0"
          step="100"
          thumb-label="always"
          :hint="$t('components_common_mmrselect.selectmmr')"
          persistent-hint
          class="pt-7"
          style="min-width: 300px"
          @change="selectMmr"
        ></v-range-slider>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
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
    const previousMmr = {} as Mmr;
    const currentMmr = { min: 0, max: 3000 } as Mmr;
    const currentMinMax: number[] = [currentMmr.min, currentMmr.max];

    function selectMmr(selectedMmr: number[]): void {
      currentMmr.min = selectedMmr[0];
      currentMmr.max = selectedMmr[1];
    }

    const selected = computed<string>(() => (props.mmr.min == 0 && props.mmr.max == 3000) ? "MMR" : `${props.mmr.min} - ${props.mmr.max}`);

    function onMenuToggled(opened: boolean): void {
      // Only send a request to backend when closing menu and selecting a different mmr.
      if (!opened && hasSelectedDifferentMmr()) {
        previousMmr.min = currentMmr.min;
        previousMmr.max = currentMmr.max;
        context.emit("mmrChanged", currentMmr);
      }
    }

    function hasSelectedDifferentMmr(): boolean {
      return currentMmr.min != previousMmr.min || currentMmr.max != previousMmr.max;
    }

    return {
      mdiChevronTripleUp,
      selectMmr,
      selected,
      onMenuToggled,
      currentMinMax,
    };
  },
});
</script>

<style lang="scss" scoped>
::v-deep(.v-messages) {
  font-size: 15px;
}

::v-deep(.theme--dark .v-slider__thumb-label) {
  color: black;
}
</style>
