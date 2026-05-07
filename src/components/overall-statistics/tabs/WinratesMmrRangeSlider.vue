<template>
  <div class="w-100">
    <v-card-text class="text-body-1 w3-mid-emphasis pt-0 pl-1 pb-0">{{ $t("components_common_mmrselect.selectmmr") }}</v-card-text>
    <v-card-text class="pt-6">
      <v-range-slider
        v-if="isBucketMode"
        v-model="bucketIndexRange"
        color="primary"
        thumb-color="primary"
        :min="0"
        :max="bucketOptions.length - 1"
        :step="1"
        show-ticks="always"
        :tick-labels="bucketLabels"
        thumb-label="always"
        class="pt-2"
        strict
        track-size="1"
        hide-details
        @update:model-value="onSliderUpdated"
      >
        <template v-slot:thumb-label="{ modelValue }">
          <span :class="['mmr-thumb-label', { 'mmr-thumb-label--combined': isCombinedBucketThumbLabel(modelValue) }]">
            {{ formatBucketThumbLabel(modelValue) }}
          </span>
        </template>
      </v-range-slider>
      <v-range-slider
        v-else
        v-model="currentMinMax"
        color="primary"
        thumb-color="primary"
        min="0"
        max="3000"
        step="100"
        thumb-label="always"
        class="pt-2"
        strict
        track-size="1"
        hide-details
        @update:model-value="onSliderUpdated"
      />
    </v-card-text>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from "vue";
import { Mmr } from "@/store/match/types";

export default defineComponent({
  name: "WinratesMmrRangeSlider",
  props: {
    mmr: {
      type: Object as PropType<Mmr>,
      required: true,
    },
    mmrOptions: {
      type: Array as PropType<number[]>,
      default: () => [],
    },
  },
  setup(props, context) {
    let previousMinMax: number[] = [props.mmr.min, props.mmr.max];
    const currentMinMax = ref<number[]>([props.mmr.min, props.mmr.max]);

    const bucketOptions = computed<number[]>(() => {
      const buckets = [...new Set(props.mmrOptions)].sort((a, b) => a - b);

      // The backend's 1000 bucket represents <=1200, so omit it from the slider UI.
      if (buckets.includes(0) && buckets.includes(1000) && buckets.includes(1200)) {
        return buckets.filter((bucket) => bucket !== 1000);
      }

      return buckets;
    });

    const isBucketMode = computed<boolean>(() => bucketOptions.value.length > 1);

    function clampBucketIndex(index: number): number {
      return Math.min(Math.max(index, 0), bucketOptions.value.length - 1);
    }

    function findClosestBucketIndex(value: number): number {
      if (!bucketOptions.value.length) {
        return 0;
      }

      let closestIndex = 0;
      let closestDistance = Math.abs(bucketOptions.value[0] - value);

      for (let i = 1; i < bucketOptions.value.length; i++) {
        const distance = Math.abs(bucketOptions.value[i] - value);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }

      return closestIndex;
    }

    function findClosestBucketValue(value: number): number {
      if (!bucketOptions.value.length) {
        return value;
      }

      return bucketOptions.value[findClosestBucketIndex(value)];
    }

    function normalizeSelection(): void {
      if (!isBucketMode.value) {
        return;
      }

      const snappedMin = findClosestBucketValue(currentMinMax.value[0]);
      const snappedMax = findClosestBucketValue(currentMinMax.value[1]);
      const normalizedMin = Math.min(snappedMin, snappedMax);
      const normalizedMax = Math.max(snappedMin, snappedMax);

      currentMinMax.value = [normalizedMin, normalizedMax];
    }

    const bucketIndexRange = computed<number[]>({
      get: () => {
        if (!isBucketMode.value || bucketOptions.value.length === 0) {
          return [0, 0];
        }

        const minIndex = findClosestBucketIndex(currentMinMax.value[0]);
        const maxIndex = findClosestBucketIndex(currentMinMax.value[1]);
        return [Math.min(minIndex, maxIndex), Math.max(minIndex, maxIndex)];
      },
      set: (indexRange) => {
        if (!isBucketMode.value || bucketOptions.value.length === 0) {
          return;
        }

        const minIndex = clampBucketIndex(indexRange[0] ?? 0);
        const maxIndex = clampBucketIndex(indexRange[1] ?? minIndex);
        const from = Math.min(minIndex, maxIndex);
        const to = Math.max(minIndex, maxIndex);

        currentMinMax.value = [bucketOptions.value[from], bucketOptions.value[to]];
      },
    });

    function bucketLowerBoundLabel(index: number): string {
      const buckets = bucketOptions.value;
      if (!buckets.length) return "";
      const value = buckets[index];
      return `${value}`;
    }

    function bucketUpperBoundLabel(index: number): string {
      const buckets = bucketOptions.value;
      if (!buckets.length) return "";
      const value = buckets[index];
      if (index === buckets.length - 1) return `${value}+`;
      return `${buckets[index + 1]}`;
    }

    function bucketRangeLabel(index: number): string {
      const lowerBound = bucketLowerBoundLabel(index);
      const upperBound = bucketUpperBoundLabel(index);
      if (upperBound.endsWith("+")) {
        return upperBound;
      }
      return `${lowerBound}-${upperBound}`;
    }

    const bucketLabels = computed<string[]>(() => {
      return bucketOptions.value.map((_, index) => bucketRangeLabel(index));
    });

    watch(
      () => props.mmr,
      (nextMmr) => {
        currentMinMax.value = [nextMmr.min, nextMmr.max];
        normalizeSelection();
        previousMinMax = [currentMinMax.value[0], currentMinMax.value[1]];
      },
      { deep: true }
    );

    watch(
      () => bucketOptions.value,
      () => {
        currentMinMax.value = [props.mmr.min, props.mmr.max];
        normalizeSelection();
        previousMinMax = [currentMinMax.value[0], currentMinMax.value[1]];
      },
      { immediate: true }
    );

    function hasSelectedDifferentMmr(): boolean {
      return currentMinMax.value[0] !== previousMinMax[0] || currentMinMax.value[1] !== previousMinMax[1];
    }

    function onSliderUpdated(): void {
      if (!isBucketMode.value) {
        normalizeSelection();
      }

      if (!hasSelectedDifferentMmr()) {
        return;
      }

      previousMinMax = [currentMinMax.value[0], currentMinMax.value[1]];
      context.emit("mmrFilterChanged", { min: currentMinMax.value[0], max: currentMinMax.value[1] } as Mmr);
    }

    function formatBucketThumbLabel(modelValue: number): string {
      if (!bucketOptions.value.length) return "";

      const minIndex = findClosestBucketIndex(Math.min(currentMinMax.value[0], currentMinMax.value[1]));
      const maxIndex = findClosestBucketIndex(Math.max(currentMinMax.value[0], currentMinMax.value[1]));

      if (minIndex === maxIndex) {
        return bucketRangeLabel(minIndex);
      }

      const thumbIndex = clampBucketIndex(Number(modelValue));
      const isLeftThumb = thumbIndex <= minIndex;

      return isLeftThumb ? bucketLowerBoundLabel(minIndex) : bucketUpperBoundLabel(maxIndex);
    }

    function isCombinedBucketThumbLabel(modelValue: number): boolean {
      return formatBucketThumbLabel(modelValue).includes("-");
    }

    return {
      currentMinMax,
      bucketOptions,
      bucketIndexRange,
      bucketLabels,
      isBucketMode,
      onSliderUpdated,
      formatBucketThumbLabel,
      isCombinedBucketThumbLabel,
    };
  },
});
</script>

<style lang="scss" scoped>
:deep(.v-slider-thumb__label) {
  padding: 0 6px;
  white-space: nowrap;
}

.mmr-thumb-label {
  display: inline-block;
  min-width: 40px;
  text-align: center;
}

.mmr-thumb-label--combined {
  min-width: 64px;
}
</style>
