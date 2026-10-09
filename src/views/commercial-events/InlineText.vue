<template>
  <template v-for="(segment, index) in segments" :key="index">
    <span v-if="segment.lang" :lang="segment.lang">{{ segment.text }}</span>
    <strong v-else-if="segment.bold">{{ segment.text }}</strong>
    <em v-else-if="segment.italic">{{ segment.text }}</em>
    <template v-else>{{ segment.text }}</template>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { parseInline } from "./inline";

const props = defineProps<{ text: string }>();
const segments = computed(() => parseInline(props.text));
</script>
