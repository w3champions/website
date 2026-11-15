<template>
  <v-card class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("spread_title")) }}</v-card-title>
    <div v-if="partialAnswer" class="px-4 pb-2 text-body-2 text-medium-emphasis" role="status">{{ t(key("presence_truncated")) }}</div>
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
          <template v-if="group.text !== null">{{ group.text }}</template>
          <not-recorded v-else />
        </div>
      </div>
      <div v-for="group in sharedGroups" :key="group.id" class="spread-group mb-2">
        <div class="font-weight-bold">{{ group.title }}</div>
        <div v-if="group.networks.length === 0" class="text-medium-emphasis">{{ noneText }}</div>
        <div v-for="network in group.networks" :key="network.hash8">
          <identifier-chip kind="ip" :hash8="network.hash8" />
          <span class="ml-2">
            <template v-for="(account, i) in network.accounts" :key="account"><template v-if="i > 0">, </template><account-link :battle-tag="account" /></template>
          </span>
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
import AccountLink from "./AccountLink.vue";
import IdentifierChip from "../smurf-detection/IdentifierChip.vue";
import NotRecorded from "./NotRecorded.vue";

const props = defineProps<{
  spread: SmurfEventSpread | null;
  /** Part of the presence answer was not read: the one-line notice under the title. */
  truncated: boolean;
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  (e: "retry"): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});

/** Said once, under the title, once the answer is in. */
const partialAnswer = computed(() => !props.loading && props.error === null && props.spread !== null && props.truncated);

/** The spread covers only the attendees read: an empty or absent list says so (the one place that rule lives is `listText`). */
const capped = computed(() => props.spread?.capped === true);
const noneText = computed(() => listText([], tr, capped.value));

const plainGroups = computed(() => [
  { id: "countries", title: t(key("spread_countries")), text: listText(props.spread?.countries, tr, capped.value) },
  { id: "providers", title: t(key("spread_providers")), text: listText(props.spread?.providers, tr, capped.value) },
]);

const sharedGroups = computed(() => [
  { id: "span", title: t(key("spread_shared_span")), networks: props.spread?.sharedInSpan ?? [] },
  { id: "usual", title: t(key("spread_shared_usual")), networks: props.spread?.sharedUsual ?? [] },
]);
</script>
