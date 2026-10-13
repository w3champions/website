<template>
  <v-card class="portrait-dialog">
    <header class="portrait-dialog__header">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <v-btn icon variant="text" size="small" :disabled="busy" :aria-label="`Close ${title.toLowerCase()}`" @click="$emit('close')">
        <v-icon>{{ mdiClose }}</v-icon>
      </v-btn>
    </header>
    <v-divider />
    <v-card-text class="portrait-dialog__body"><slot></slot></v-card-text>
    <v-divider />
    <v-card-actions class="portrait-dialog__footer">
      <v-spacer />
      <v-btn variant="text" :disabled="busy" @click="$emit('close')">{{ closeLabel }}</v-btn>
      <slot name="actions"></slot>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { mdiClose } from "@mdi/js";
withDefaults(defineProps<{ title: string; subtitle?: string; busy?: boolean; closeLabel?: string }>(), {
  subtitle: "", busy: false, closeLabel: "Cancel",
});
defineEmits<{ close: [] }>();
</script>

<style scoped>
.portrait-dialog { min-width: 0; }
.portrait-dialog__header > div { min-width: 0; overflow-wrap: anywhere; }
.portrait-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
}
.portrait-dialog__header h2 {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
}
.portrait-dialog__header p {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.65;
}
.portrait-dialog__body { padding: 24px; min-width: 0; overflow-wrap: anywhere; }
.portrait-dialog__body :deep(.v-label) { white-space: normal; line-height: 1.4; }
.portrait-dialog__body :deep(.portrait-form-title) {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  margin: 0 0 12px;
}
.portrait-dialog__body :deep(.portrait-form-section + .portrait-form-section) {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.portrait-dialog__footer { padding: 16px 24px; gap: 12px; flex-wrap: wrap; }
.portrait-dialog__footer :deep(.v-btn) { max-width: 100%; min-height: 36px; height: auto; }
.portrait-dialog__footer :deep(.v-btn__content) { white-space: normal; }
@media (max-width: 600px) {
  .portrait-dialog__header, .portrait-dialog__body, .portrait-dialog__footer { padding: 16px; }
}
</style>
