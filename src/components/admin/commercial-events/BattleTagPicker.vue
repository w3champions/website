<template>
  <player-search
    :key="resetKey"
    :set-autofocus="false"
    :search-label="label"
    @playerFound="onPlayerFound"
    @searchCleared="emit('update:modelValue', '')"
    @searchTextChanged="onSearchTextChanged"
  />
</template>

<script lang="ts" setup>
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { isStaleSelection } from "@/store/admin/commercialLicense/draft";

/**
 * Yields an exact battle tag: only a picked search result (`playerFound`, the
 * player's stored battleTag) sets the value, and editing the text afterwards clears
 * it. Typed text is never used as a battle tag. Change `resetKey` to clear the field.
 */
const props = withDefaults(defineProps<{ modelValue: string; label?: string; resetKey?: number }>(), {
  label: "Search BattleTag",
  resetKey: 0,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

function onPlayerFound(battleTag: string): void {
  emit("update:modelValue", battleTag);
}

function onSearchTextChanged(text: string): void {
  if (isStaleSelection(props.modelValue, text)) emit("update:modelValue", "");
}
</script>
