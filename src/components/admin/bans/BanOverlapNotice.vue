<template>
  <v-alert v-if="text" type="info" variant="tonal" density="compact" class="ban-overlap mb-4">
    <template v-if="typeof text === 'string'">{{ text }}</template>
    <template v-else>
      <div class="font-weight-bold">{{ text.heading }}</div>
      <div v-for="line in text.lines" :key="line.banId" class="d-flex align-center">
        <span>{{ line.text }}</span>
        <v-btn variant="text" size="small" color="primary" @click="emit('editInstead', line.banId)">
          {{ t(key("edit_instead")) }}
        </v-btn>
      </div>
      <div v-if="text.more">{{ text.more }}</div>
      <div v-if="text.footer" class="text-medium-emphasis">{{ text.footer }}</div>
    </template>
  </v-alert>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useBanFormat } from "@/composables/useBanFormat";
import { type OverlapNotice, overlapText } from "@/store/admin/bans/inEffect";
import { key } from "@/store/admin/bans/translate";

const props = defineProps<{ notice: OverlapNotice }>();
const emit = defineEmits<{ (e: "editInstead", banId: string): void }>();

const { t } = useI18n();
const { format } = useBanFormat();

const text = computed(() => overlapText(props.notice, format()));
</script>
