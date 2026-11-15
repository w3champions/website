<template>
  <v-card class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("spread_title")) }}</v-card-title>
    <v-card-text v-if="loading" class="text-medium-emphasis" role="status">{{ t(key("spread_loading")) }}</v-card-text>
    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mx-4 mb-4">
      {{ t(key("spread_failed")) }} {{ error }}
      <template v-slot:append>
        <v-btn class="retry" variant="text" size="small" @click="emit('retry')">{{ t(key("retry")) }}</v-btn>
      </template>
    </v-alert>
    <v-card-text v-else-if="spread">
      <div v-for="group in plainGroups" :key="group.id" class="spread-group mb-2">
        <div class="font-weight-bold">{{ group.title }}</div>
        <div class="text-medium-emphasis">
          <not-recorded v-if="group.values === undefined" />
          <template v-else>{{ listText(group.values, tr) }}</template>
        </div>
      </div>
      <div v-for="group in sharedGroups" :key="group.id" class="spread-group mb-2">
        <div class="font-weight-bold">{{ group.title }}</div>
        <div v-if="group.networks.length === 0" class="text-medium-emphasis">{{ t(key("spread_none")) }}</div>
        <div v-for="network in group.networks" :key="network.hash8">
          <identifier-chip kind="ip" :hash8="network.hash8" />
          <span class="ml-2">{{ network.accounts.join(", ") }}</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { SmurfEventSpread } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { listText } from "@/store/admin/smurfEvents/presence";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";
import IdentifierChip from "../smurf-detection/IdentifierChip.vue";
import NotRecorded from "./NotRecorded.vue";

const props = defineProps<{
  spread: SmurfEventSpread | null;
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  (e: "retry"): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});

const plainGroups = computed(() => [
  { id: "countries", title: t(key("spread_countries")), values: props.spread?.countries },
  { id: "providers", title: t(key("spread_providers")), values: props.spread?.providers },
]);

const sharedGroups = computed(() => [
  { id: "span", title: t(key("spread_shared_span")), networks: props.spread?.sharedInSpan ?? [] },
  { id: "usual", title: t(key("spread_shared_usual")), networks: props.spread?.sharedUsual ?? [] },
]);
</script>
