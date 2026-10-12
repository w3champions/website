<template>
  <file-drop-zone v-bind="$attrs" :model-value="modelValue" :accept="accept" :multiple="multiple" :disabled="disabled" :label="label" @update:model-value="$emit('update:modelValue', $event)" />
</template>

<script setup lang="ts">
import FileDropZone from "@/components/common/FileDropZone.vue";
withDefaults(defineProps<{ modelValue?: File[]; accept?: string; multiple?: boolean; disabled?: boolean; label?: string }>(), {
  modelValue: () => [], accept: ".w3m,.w3x", multiple: false, disabled: false, label: "Drag & drop map files here",
});
defineEmits<{ "update:modelValue": [files: File[]] }>();
</script>
