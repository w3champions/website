<template>
  <v-card class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("history_title")) }}</v-card-title>
    <v-card-text v-if="loading" class="text-medium-emphasis" role="status">{{ t(key("history_loading")) }}</v-card-text>
    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mx-4 mb-4">{{ t(key("history_failed")) }} {{ error }}</v-alert>
    <v-card-text v-else-if="history !== null" class="pt-0">
      <div v-if="history.changedSinceReview && history.changedSinceReview.length > 0" class="history-changed mb-3 text-body-2">
        <div class="font-weight-bold">{{ t(key("history_changed_title")) }}</div>
        <div v-for="change in history.changedSinceReview" :key="change.fact" class="text-warning">
          <span aria-hidden="true">&#9670;</span> {{ t(key("history_changed"), { fact: factLabel(change.fact, tr), then: change.then, now: change.now }) }}
        </div>
      </div>
      <div v-if="history.entries.length === 0" class="text-medium-emphasis">{{ t(key("history_none")) }}</div>
      <ul v-else class="history-list">
        <li v-for="entry in history.entries" :key="entry.id" class="history-entry mb-2 text-body-2">
          <div>
            <span class="text-no-wrap">{{ formatUtc(entry.at) }}</span> · {{ entry.author }} ·
            <span class="font-weight-bold">{{ historyActionLabel(entry.action, tr) }}</span>
          </div>
          <div v-if="entry.reason" class="text-medium-emphasis">{{ t(key("history_reason"), { reason: entry.reason }) }}</div>
          <div class="text-medium-emphasis">{{ t(key("history_name"), { name: entry.name }) }}</div>
          <div v-if="reviewFactsText(entry.outcome, tr)" class="text-medium-emphasis">{{ t(key("history_facts"), { facts: reviewFactsText(entry.outcome, tr) }) }}</div>
        </li>
      </ul>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { formatUtc } from "@/helpers/utc-dates";
import type { SmurfEventHistory } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { factLabel, historyActionLabel, reviewFactsText } from "@/store/admin/smurfEvents/labels";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

defineProps<{
  history: SmurfEventHistory | null;
  loading: boolean;
  error: string | null;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
</script>

<style scoped>
.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
