<template>
  <div ref="cell" class="ban-modes">
    <template v-if="isGlobal">
      <v-chip class="ban-mode" size="small" variant="flat" color="on-surface" label>{{ t(key("all_short")) }}</v-chip>
    </template>
    <template v-else>
      <v-chip v-for="(mode, index) in gameModes" :key="mode" class="ban-mode" :class="{ 'ban-mode--hidden': index >= shown }" size="small" variant="tonal" label>
        {{ modeName(mode) }}
      </v-chip>
      <v-tooltip v-if="hiddenCount > 0" location="bottom" :text="modesText(gameModes, modeName, tr)">
        <template v-slot:activator="{ props: activator }">
          <v-chip v-bind="activator" class="ban-mode--plus" size="small" variant="outlined" label tabindex="0">+{{ hiddenCount }}</v-chip>
        </template>
      </v-tooltip>
    </template>
    <v-chip v-if="machineIdCount !== undefined" class="ban-machine" size="small" color="error" variant="outlined" label>{{ machineText }}</v-chip>

    <!-- Measuring row: every chip at its natural width, never shown. -->
    <div v-if="!isGlobal || machineIdCount !== undefined" ref="measure" class="ban-measure" aria-hidden="true">
      <v-chip v-for="mode in gameModes" :key="mode" class="ban-measure-chip" size="small" variant="tonal" label>{{ modeName(mode) }}</v-chip>
      <v-chip v-if="gameModes.length > 1" class="ban-measure-plus" size="small" variant="outlined" label>+{{ gameModes.length - 1 }}</v-chip>
      <v-chip v-if="machineIdCount !== undefined" class="ban-measure-machine" size="small" variant="outlined" label>{{ machineText }}</v-chip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { modesText } from "@/store/admin/bans/wording";
import { key } from "@/store/admin/bans/translate";
import type { EGameMode } from "@/store/types";
import { useBanFormat } from "@/composables/useBanFormat";
import { CHIP_GAP_PX, fitChipCount } from "./chipFit";

const props = defineProps<{ gameModes: EGameMode[]; machineIdCount?: number; newMachineIdCount?: number }>();
const emit = defineEmits<{ (e: "cut", cut: boolean): void }>();

const { t } = useI18n();
const { tr, modeName } = useBanFormat();

const cell = ref<HTMLElement | null>(null);
const measure = ref<HTMLElement | null>(null);
// null: not measured yet, every chip shows.
const fitted = ref<number | null>(null);

const isGlobal = computed(() => props.gameModes.length === 0);
const shown = computed(() => Math.min(fitted.value ?? props.gameModes.length, props.gameModes.length));
const hiddenCount = computed(() => props.gameModes.length - shown.value);
const machineText = computed(() =>
  (props.newMachineIdCount ?? 0) > 0
    ? t(key("machine_chip_new"), { count: props.machineIdCount ?? 0, new: props.newMachineIdCount ?? 0 })
    : t(key("machine_chip"), { count: props.machineIdCount ?? 0 })
);

function widthsOf(selector: string): number[] {
  return Array.from(measure.value?.querySelectorAll<HTMLElement>(selector) ?? [], (el) => el.offsetWidth);
}

function update(): void {
  const width = cell.value?.clientWidth ?? 0;
  if (width === 0 || isGlobal.value) {
    fitted.value = null;
    return;
  }
  const machine = widthsOf(".ban-measure-machine")[0];
  const available = width - (machine === undefined ? 0 : machine + CHIP_GAP_PX);
  fitted.value = fitChipCount(widthsOf(".ban-measure-chip"), widthsOf(".ban-measure-plus")[0] ?? 0, available);
}

watch(hiddenCount, (n) => emit("cut", n > 0), { immediate: true });
watch(() => [props.gameModes, props.machineIdCount, props.newMachineIdCount], async () => {
  await nextTick();
  update();
});

let observer: ResizeObserver | null = null;
onMounted(() => {
  update();
  observer = new ResizeObserver(update);
  if (cell.value) observer.observe(cell.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<style scoped>
.ban-modes {
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}
.ban-mode {
  flex: 0 1 auto;
  min-width: 0;
}
.ban-mode :deep(.v-chip__content) {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ban-mode--hidden {
  display: none;
}
.ban-mode--plus,
.ban-machine {
  flex: none;
}
.ban-mode--plus {
  cursor: help;
}
.ban-measure {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  width: max-content;
  height: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
}
.ban-measure :deep(.v-chip) {
  flex: none;
}
</style>
