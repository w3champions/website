<template>
  <v-tooltip location="top" content-class="w3-tooltip elevation-1">
    <template v-slot:activator="{ props }">
      <v-btn size="small" v-bind="props" :aria-label="$t(`components_common_copybutton.${tooltipText}`)" @click="copy">
        <v-icon size="x-large">{{ mdiContentCopy }}</v-icon>
      </v-btn>
    </template>
    <span>{{ $t(`components_common_copybutton.${tooltipText}`) }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
import { mdiContentCopy } from "@mdi/js";

const { copyText, tooltipText = "tooltip" } = defineProps<{
  copyText: string;
  tooltipText?: string;
}>();

function copy(): void {
  navigator.clipboard.writeText(copyText);
}
</script>
