<template>
  <v-card class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("spread_title")) }}</v-card-title>
    <v-card-text>
      <div v-for="group in plainGroups" :key="group.id" class="spread-group mb-2">
        <div class="font-weight-bold">{{ group.title }}</div>
        <div class="text-medium-emphasis">
          <not-recorded v-if="group.values === undefined" />
          <template v-else-if="group.values.length === 0">{{ t(key("spread_none")) }}</template>
          <template v-else>{{ group.values.join(", ") }}</template>
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
import { key } from "@/store/admin/smurfEvents/translate";
import IdentifierChip from "../smurf-detection/IdentifierChip.vue";
import NotRecorded from "./NotRecorded.vue";

const props = defineProps<{
  spread: SmurfEventSpread;
}>();

const { t } = useI18n();

const plainGroups = computed(() => [
  { id: "countries", title: t(key("spread_countries")), values: props.spread.countries },
  { id: "providers", title: t(key("spread_providers")), values: props.spread.providers },
]);

const sharedGroups = computed(() => [
  { id: "span", title: t(key("spread_shared_span")), networks: props.spread.sharedInSpan },
  { id: "usual", title: t(key("spread_shared_usual")), networks: props.spread.sharedUsual },
]);
</script>
