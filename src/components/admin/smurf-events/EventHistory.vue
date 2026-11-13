<template>
  <v-card class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("history_title")) }}</v-card-title>
    <v-card-text v-if="loading" class="text-medium-emphasis" role="status">{{ t(key("history_loading")) }}</v-card-text>
    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mx-4 mb-4">
      {{ t(key("history_failed")) }} {{ error }}
      <template v-slot:append>
        <v-btn variant="text" size="small" @click="emit('retry')">{{ t(key("retry")) }}</v-btn>
      </template>
    </v-alert>
    <v-card-text v-else-if="history !== null" class="pt-0">
      <div v-if="history.changedSinceReview && history.changedSinceReview.length > 0" class="history-changed mb-3 text-body-2">
        <div class="font-weight-bold">{{ t(key("history_changed_title")) }}</div>
        <div v-for="change in history.changedSinceReview" :key="change.fact" class="text-warning">
          <span aria-hidden="true">&#9670;</span>
          {{ changeText(change) }}
        </div>
      </div>
      <div v-if="history.entries.length === 0" class="text-medium-emphasis">{{ t(key("history_none")) }}</div>
      <ul v-else class="history-list">
        <li v-for="entry in history.entries" :key="entry.id" class="history-entry mb-2 text-body-2">
          <div>
            <span class="text-no-wrap">{{ formatUtc(entry.at) }}</span> · {{ entry.author }} ·
            <span class="font-weight-bold">{{ historyActionLabel(entry.action, tr) }}</span>
            <v-tooltip v-if="entry.outcome.repaired === true" :text="t(key('history_repaired_hint'))" location="bottom">
              <template v-slot:activator="{ props: activator }">
                <span v-bind="activator" class="repaired text-medium-emphasis ml-2 px-1" tabindex="0">{{ t(key("history_repaired")) }}</span>
              </template>
            </v-tooltip>
          </div>
          <div v-if="entry.reason" class="text-medium-emphasis">{{ t(key("history_reason"), { reason: entry.reason }) }}</div>
          <div class="text-medium-emphasis">{{ nameText(entry) }}</div>
          <div v-if="reviewFactsText(entry.outcome, tr)" class="text-medium-emphasis">{{ t(key("history_facts"), { facts: reviewFactsText(entry.outcome, tr) }) }}</div>
        </li>
      </ul>
      <div v-if="history.truncated" class="text-body-2 text-medium-emphasis" role="status">{{ t(key("history_truncated")) }}</div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { formatUtc } from "@/helpers/utc-dates";
import type { SmurfEventFactChange, SmurfEventHistory, SmurfEventHistoryEntry } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { factText } from "@/store/admin/smurfEvents/facts";
import { factLabel, historyActionLabel, reviewFactsText } from "@/store/admin/smurfEvents/labels";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

defineProps<{
  history: SmurfEventHistory | null;
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  (e: "retry"): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});

/** "Attendees: 3 → 5", or "Attendees: 3 then, no longer known" when the fact can no longer be counted. */
function changeText(change: SmurfEventFactChange): string {
  const fact = factLabel(change.fact, tr);
  const then = factText(change.then, change.thenCapped, tr);
  return change.now === undefined ? t(key("history_changed_unknown"), { fact, then }) : t(key("history_changed"), { fact, then, now: factText(change.now, change.nowCapped, tr) });
}

/** A rename reads "Renamed from X to Y" when the previous name is on the entry; every other entry shows the name it was made under. */
function nameText(entry: SmurfEventHistoryEntry): string {
  const previous = entry.outcome.previousName;
  if (entry.action === "event-rename" && typeof previous === "string") return t(key("history_renamed"), { previous, name: entry.name });
  return t(key("history_name"), { name: entry.name });
}
</script>

<style scoped>
.repaired {
  border: 1px dashed currentcolor;
  border-radius: 2px;
  font-size: 0.8125rem;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
