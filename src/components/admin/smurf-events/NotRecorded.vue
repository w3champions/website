<template>
  <span class="not-recorded text-medium-emphasis">{{ t(key("facts_not_recorded")) }}</span>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { key } from "@/store/admin/smurfEvents/translate";

const { t } = useI18n();
</script>

<style scoped>
.not-recorded {
  display: inline-block;
  padding: 0 8px;
  border-radius: 2px;
  font-weight: 400;
  background: repeating-linear-gradient(135deg, transparent 0 4px, rgba(var(--v-theme-on-surface), 0.12) 4px 6px);
}
</style>
