<template>
  <v-card class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("facts_title")) }}</v-card-title>
    <v-table density="compact">
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <td>{{ row.label }}</td>
          <td class="text-right font-weight-bold">
            <span v-if="row.notRecorded" class="not-recorded text-medium-emphasis">{{ t(key("facts_not_recorded")) }}</span>
            <template v-else>{{ row.value }}</template>
            <div v-if="row.names && row.names.length > 0" class="text-body-2 font-weight-regular">{{ row.names.join(", ") }}</div>
          </td>
        </tr>
      </tbody>
    </v-table>
    <div v-if="recordedLines.length > 0" class="px-4 pt-2 pb-3 text-body-2 text-medium-emphasis">
      <div v-for="line in recordedLines" :key="line">{{ line }}</div>
    </div>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { formatUtc } from "@/helpers/utc-dates";
import type { SmurfEventDetail } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { factText } from "@/store/admin/smurfEvents/facts";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

const props = defineProps<{
  event: SmurfEventDetail;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});

interface FactRow {
  label: string;
  value: string;
  /** The row is about evidence the server did not record for this event: a hatch, never a number. */
  notRecorded?: boolean;
  names?: string[];
}

const rows = computed<FactRow[]>(() => {
  const e = props.event;
  const facts = e.facts;
  const recorded = e.evidenceRecorded;
  const networks = facts?.networks ?? e.counts.networks;
  const ended = facts?.endedLinks ?? e.endedLinks;
  const links = facts?.liveLinks === undefined ? String(ended) : t(key("facts_links_with_live"), { ended, live: factText(facts.liveLinks, facts.liveLinksCapped, tr) });
  return [
    { label: t(key("facts_networks")), value: networks === 0 ? t(key("facts_no_network")) : String(networks), notRecorded: !recorded },
    { label: t(key("facts_max_ever")), value: factText(facts?.maxAccountsEver, facts?.maxAccountsEverCapped, tr), notRecorded: !recorded },
    { label: t(key("facts_homes")), value: factText(e.counts.homes, undefined, tr), notRecorded: !recorded },
    { label: t(key("facts_links")), value: links },
    { label: t(key("facts_not_counted")), value: String(facts?.notCounted ?? e.notCounted.length), names: e.notCounted },
  ];
});

const recordedLines = computed(() => {
  const { hardwareKeysSince, deviceMemorySince } = props.event.recorded;
  return [
    ...(hardwareKeysSince ? [t(key("facts_recorded_keys"), { date: formatUtc(hardwareKeysSince) })] : []),
    ...(deviceMemorySince ? [t(key("facts_recorded_memory"), { date: formatUtc(deviceMemorySince) })] : []),
  ];
});
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
